'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PenerimaanView, DetailPenerimaanView, PengadaanView, DetailPengadaanView } from '@/types/database';
import { getSessionAction } from '@/actions/auth.actions';
import { revalidatePath } from 'next/cache';

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

// Ambil pengadaan yang masih berstatus proses/aktif dan belum pernah diterima penuh
export async function getPengadaanSiapTerimaAction(): Promise<PengadaanView[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
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
        p.total_nilai 
      FROM vu_pengadaan p
      WHERE p.status NOT IN ('B', 'S')
        AND p.id_pengadaan NOT IN (SELECT idpengadaan FROM penerimaan)
      ORDER BY p.id_pengadaan DESC`
    );
    return rows as PengadaanView[];
  } catch (error) {
    console.error('Gagal mengambil pengadaan siap terima:', error);
    return [];
  }
}

export interface CreatePenerimaanItemInput {
  idbarang: number;
  jumlah_terima: number;
  harga_satuan_terima: number;
}

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

    if (!items || items.length === 0) {
      return { success: false, message: 'Daftar barang penerimaan tidak boleh kosong' };
    }

    for (const item of items) {
      if (!item.idbarang || item.jumlah_terima <= 0 || item.harga_satuan_terima < 0) {
        return {
          success: false,
          message: 'Jumlah terima harus lebih dari 0 dan harga satuan tidak boleh negatif',
        };
      }
    }

    await connection.beginTransaction();

    // 1. Simpan Header Penerimaan (Status 'S' = Selesai/Diterima)
    const [headerResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO penerimaan (status, idpengadaan, iduser) 
       VALUES ('S', ?, ?)`,
      [idpengadaan, session.id_user]
    );

    const idpenerimaan = headerResult.insertId;

    // 2. Simpan Item Detail Penerimaan & Catat ke Kartu Stok (Jenis 'M' = Masuk)
    for (const item of items) {
      const subtotalTerima = item.harga_satuan_terima * item.jumlah_terima;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO detail_penerimaan (idpenerimaan, barang_idbarang, jumlah_terima, harga_satuan_terima, sub_total_terima) 
         VALUES (?, ?, ?, ?, ?)`,
        [idpenerimaan, item.idbarang, item.jumlah_terima, item.harga_satuan_terima, subtotalTerima]
      );

      // Hitung stok terakhir dari kartu_stok
      const [lastStockRows] = await connection.query<RowDataPacket[]>(
        `SELECT stock FROM kartu_stok 
         WHERE idbarang = ? 
         ORDER BY idkartu_stok DESC 
         LIMIT 1`,
        [item.idbarang]
      );

      const prevStock = lastStockRows.length > 0 ? Number(lastStockRows[0].stock) : 0;
      const nextStock = prevStock + Number(item.jumlah_terima);

      // Catat ke kartu_stok
      await connection.execute<ResultSetHeader>(
        `INSERT INTO kartu_stok (jenis_transaksi, masuk, keluar, stock, idtransaksi, idbarang) 
         VALUES ('M', ?, 0, ?, ?, ?)`,
        [item.jumlah_terima, nextStock, idpenerimaan, item.idbarang]
      );
    }

    // 3. Update Status Pengadaan menjadi 'S' (Selesai)
    await connection.execute<ResultSetHeader>(
      "UPDATE pengadaan SET status = 'S' WHERE idpengadaan = ?",
      [idpengadaan]
    );

    await connection.commit();

    revalidatePath('/dashboard/transaksi/penerimaan');
    revalidatePath('/dashboard/transaksi/pengadaan');
    return {
      success: true,
      message: `Penerimaan #${idpenerimaan} berhasil dicatat dan stok barang diperbarui`,
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
