'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import {
  PenerimaanView,
  DetailPenerimaanView,
  PengadaanPenerimaanProgressView,
  DetailPengadaanPenerimaanItem,
} from '@/types/database';
import { getSessionAction } from '@/actions/auth.actions';
import { revalidatePath } from 'next/cache';

// 1. Ambil riwayat penerimaan dari view vu_penerimaan
export async function getPenerimaanViewAction(): Promise<PenerimaanView[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id_penerimaan, 
        tanggal_penerimaan, 
        status, 
        id_pengadaan, 
        tanggal_pengadaan, 
        id_vendor, 
        nama_vendor, 
        id_user, 
        diterima_oleh 
      FROM vu_penerimaan 
      ORDER BY id_penerimaan DESC`
    );
    return rows as PenerimaanView[];
  } catch (error) {
    console.error('Gagal mengambil data view penerimaan:', error);
    return [];
  }
}

// 2. Ambil detail barang dari suatu nota penerimaan
export async function getDetailPenerimaanViewAction(
  idPenerimaan: number
): Promise<DetailPenerimaanView[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id_detail_penerimaan, 
        id_penerimaan, 
        id_barang, 
        nama_barang, 
        nama_satuan, 
        jumlah_terima, 
        harga_satuan_terima, 
        sub_total_terima 
      FROM vu_detail_penerimaan 
      WHERE id_penerimaan = ? 
      ORDER BY id_detail_penerimaan ASC`,
      [idPenerimaan]
    );
    return rows as DetailPenerimaanView[];
  } catch (error) {
    console.error('Gagal mengambil detail view penerimaan:', error);
    return [];
  }
}

// 3. Ambil daftar Pengadaan beserta progress penerimaan bertahapnya
export async function getPengadaanPenerimaanProgressAction(): Promise<
  PengadaanPenerimaanProgressView[]
> {
  try {
    const sql = `
      SELECT 
        p.id_pengadaan, 
        p.tanggal_pengadaan, 
        p.id_user, 
        p.dibuat_oleh, 
        p.id_vendor, 
        p.nama_vendor, 
        p.badan_hukum, 
        p.status, 
        p.subtotal_nilai, 
        p.ppn, 
        p.total_nilai,
        CAST(COALESCE((
          SELECT SUM(jumlah) 
          FROM detail_pengadaan 
          WHERE idpengadaan = p.id_pengadaan
        ), 0) AS SIGNED) AS total_item_pesan,
        CAST(COALESCE((
          SELECT SUM(dpn.jumlah_terima) 
          FROM detail_penerimaan dpn 
          JOIN penerimaan pn ON dpn.idpenerimaan = pn.idpenerimaan 
          WHERE pn.idpengadaan = p.id_pengadaan
        ), 0) AS SIGNED) AS total_item_terima,
        CAST(
          COALESCE((SELECT SUM(jumlah) FROM detail_pengadaan WHERE idpengadaan = p.id_pengadaan), 0) -
          COALESCE((SELECT SUM(dpn.jumlah_terima) FROM detail_penerimaan dpn JOIN penerimaan pn ON dpn.idpenerimaan = pn.idpenerimaan WHERE pn.idpengadaan = p.id_pengadaan), 0)
        AS SIGNED) AS sisa_item
      FROM vu_pengadaan p
      WHERE p.status != 'B'
      ORDER BY p.id_pengadaan DESC
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows as PengadaanPenerimaanProgressView[];
  } catch (error) {
    console.error('Gagal mengambil pengadaan progress penerimaan:', error);
    return [];
  }
}

// 4. Ambil pengadaan yang masih memiliki sisa barang untuk diterima (Bisa bertahap)
export async function getPengadaanSiapTerimaAction(): Promise<
  PengadaanPenerimaanProgressView[]
> {
  try {
    const all = await getPengadaanPenerimaanProgressAction();
    return all.filter((p) => p.status !== 'S' && p.sisa_item > 0);
  } catch (error) {
    console.error('Gagal mengambil pengadaan siap terima:', error);
    return [];
  }
}

// 5. Ambil item-item pengadaan untuk proses penerimaan bertahap (menghitung sisa per barang)
export async function getDetailPengadaanForPenerimaanAction(
  idPengadaan: number
): Promise<DetailPengadaanPenerimaanItem[]> {
  try {
    const sql = `
      SELECT 
        dp.iddetail_pengadaan AS id_detail_pengadaan,
        dp.idpengadaan AS id_pengadaan,
        dp.idbarang AS id_barang,
        b.nama AS nama_barang,
        s.nama_satuan,
        dp.harga_satuan,
        dp.jumlah AS jumlah_pesan,
        CAST(COALESCE((
          SELECT SUM(dpn.jumlah_terima)
          FROM detail_penerimaan dpn
          JOIN penerimaan pn ON dpn.idpenerimaan = pn.idpenerimaan
          WHERE pn.idpengadaan = dp.idpengadaan AND dpn.barang_idbarang = dp.idbarang
        ), 0) AS SIGNED) AS sudah_diterima,
        CAST(dp.jumlah - COALESCE((
          SELECT SUM(dpn.jumlah_terima)
          FROM detail_penerimaan dpn
          JOIN penerimaan pn ON dpn.idpenerimaan = pn.idpenerimaan
          WHERE pn.idpengadaan = dp.idpengadaan AND dpn.barang_idbarang = dp.idbarang
        ), 0) AS SIGNED) AS sisa_belum_diterima
      FROM detail_pengadaan dp
      JOIN barang b ON dp.idbarang = b.idbarang
      JOIN satuan s ON b.idsatuan = s.idsatuan
      WHERE dp.idpengadaan = ?
      ORDER BY dp.iddetail_pengadaan ASC
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql, [idPengadaan]);
    return rows as DetailPengadaanPenerimaanItem[];
  } catch (error) {
    console.error('Gagal mengambil detail pengadaan for penerimaan:', error);
    return [];
  }
}

export interface CreatePenerimaanItemInput {
  idbarang: number;
  nama_barang?: string;
  jumlah_terima: number;
  harga_satuan_terima: number;
}

// 6. Buat transaksi penerimaan barang (Mendukung Penerimaan Bertahap)
export async function createPenerimaanAction(data: {
  idpengadaan: number;
  items: CreatePenerimaanItemInput[];
}) {
  const connection = await db.getConnection();
  try {
    const session = await getSessionAction();
    if (!session) {
      return { success: false, message: 'Sesi habis, silakan login kembali' };
    }

    const { idpengadaan, items } = data;

    // Filter item yang jumlah terimanya > 0
    const activeItems = (items || []).filter((i) => i.jumlah_terima > 0);

    if (activeItems.length === 0) {
      return {
        success: false,
        message: 'Minimal harus ada 1 barang yang diterima dengan jumlah lebih dari 0',
      };
    }

    // Validasi sisa belum diterima dari database
    const pendingItems = await getDetailPengadaanForPenerimaanAction(idpengadaan);
    const pendingMap = new Map<number, DetailPengadaanPenerimaanItem>();
    for (const item of pendingItems) {
      pendingMap.set(item.id_barang, item);
    }

    for (const item of activeItems) {
      const match = pendingMap.get(item.idbarang);
      if (!match) {
        return {
          success: false,
          message: `Barang "${item.nama_barang || `#${item.idbarang}`}" tidak terdaftar pada Pengadaan #${idpengadaan}`,
        };
      }
      if (item.jumlah_terima > match.sisa_belum_diterima) {
        return {
          success: false,
          message: `Jumlah terima untuk "${match.nama_barang}" (${item.jumlah_terima}) melebihi sisa pesanan (${match.sisa_belum_diterima})`,
        };
      }
    }

    await connection.beginTransaction();

    // 1. Simpan Header Penerimaan (Status 'S' = Tercatat)
    const [headerResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO penerimaan (status, idpengadaan, iduser) 
       VALUES ('S', ?, ?)`,
      [idpengadaan, session.id_user]
    );

    const idpenerimaan = headerResult.insertId;

    // 2. Simpan Item Detail Penerimaan memanggil Stored Procedure sp_tambah_detail_penerimaan
    // TRIGGER trg_after_insert_detail_penerimaan akan otomatis:
    // A. Menghitung stok baru via fn_cek_stok dan mencatat mutasi 'M' ke kartu_stok
    // B. Menghitung total_terima vs total_pesan; jika sudah lengkap, otomatis update status pengadaan menjadi 'S' (Selesai)
    for (const item of activeItems) {
      await connection.query(
        `CALL sp_tambah_detail_penerimaan(?, ?, ?, ?)`,
        [idpenerimaan, item.idbarang, item.jumlah_terima, item.harga_satuan_terima]
      );
    }

    await connection.commit();

    revalidatePath('/dashboard/transaksi/penerimaan');
    revalidatePath('/dashboard/transaksi/pengadaan');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Penerimaan #${idpenerimaan} berhasil dicatat. Stok barang di kartu stok otomatis bertambah!`,
      id_penerimaan: idpenerimaan,
    };
  } catch (error) {
    await connection.rollback();
    console.error('Gagal mencatat penerimaan:', error);
    return { success: false, message: 'Gagal mencatat penerimaan barang' };
  } finally {
    connection.release();
  }
}
