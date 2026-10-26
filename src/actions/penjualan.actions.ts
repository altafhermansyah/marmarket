'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PenjualanView, DetailPenjualanView, MarginPenjualanView } from '@/types/database';
import { getSessionAction } from '@/actions/auth.actions';
import { revalidatePath } from 'next/cache';

export async function getPenjualanViewAction(): Promise<PenjualanView[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id_penjualan, 
        tanggal_penjualan, 
        id_user, 
        kasir, 
        id_margin, 
        persen_margin, 
        subtotal_nilai, 
        ppn, 
        total_nilai 
      FROM vu_penjualan 
      ORDER BY id_penjualan DESC`
    );
    return rows as PenjualanView[];
  } catch (error) {
    console.error('Gagal mengambil data view penjualan:', error);
    return [];
  }
}

export async function getDetailPenjualanViewAction(
  idPenjualan: number
): Promise<DetailPenjualanView[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id_detail_penjualan, 
        id_penjualan, 
        id_barang, 
        nama_barang, 
        nama_satuan, 
        harga_satuan, 
        jumlah, 
        subtotal 
      FROM vu_detail_penjualan 
      WHERE id_penjualan = ? 
      ORDER BY id_detail_penjualan ASC`,
      [idPenjualan]
    );
    return rows as DetailPenjualanView[];
  } catch (error) {
    console.error('Gagal mengambil detail view penjualan:', error);
    return [];
  }
}

export async function getActiveMarginAction(): Promise<MarginPenjualanView | null> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id_margin, persen, status, created_at, updated_at, id_user, dibuat_oleh FROM vu_margin_penjualan_aktif LIMIT 1'
    );
    if (rows.length > 0) {
      return rows[0] as MarginPenjualanView;
    }
    // Fallback jika view aktif kosong, ambil margin terakhir
    const [fallback] = await db.query<RowDataPacket[]>(
      'SELECT idmargin_penjualan AS id_margin, persen, status, created_at, updated_at, iduser AS id_user FROM margin_penjualan ORDER BY idmargin_penjualan DESC LIMIT 1'
    );
    return fallback.length > 0 ? (fallback[0] as any) : null;
  } catch (error) {
    console.error('Gagal mengambil margin penjualan aktif:', error);
    return null;
  }
}

export interface BarangStokItem {
  id_barang: number;
  nama_barang: string;
  jenis: string;
  nama_satuan: string;
  harga: number;
  stok: number;
}

export async function getBarangWithStockAction(): Promise<BarangStokItem[]> {
  try {
    const sql = `
      SELECT 
        b.id_barang, 
        b.nama_barang, 
        b.jenis, 
        b.nama_satuan, 
        b.harga, 
        COALESCE(ks.stock, 0) AS stok 
      FROM vu_barang_aktif b 
      LEFT JOIN (
        SELECT k1.idbarang, k1.stock 
        FROM kartu_stok k1 
        INNER JOIN (
          SELECT idbarang, MAX(idkartu_stok) as max_id 
          FROM kartu_stok 
          GROUP BY idbarang
        ) k2 ON k1.idkartu_stok = k2.max_id
      ) ks ON b.id_barang = ks.idbarang 
      ORDER BY b.nama_barang ASC
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows as BarangStokItem[];
  } catch (error) {
    console.error('Gagal mengambil barang beserta stok:', error);
    return [];
  }
}

export interface CreatePenjualanItemInput {
  idbarang: number;
  nama_barang?: string;
  harga_satuan: number;
  jumlah: number;
}

export async function createPenjualanAction(data: {
  idmargin: number;
  ppn_percent?: number;
  items: CreatePenjualanItemInput[];
}) {
  const connection = await db.getConnection();
  try {
    const session = await getSessionAction();
    if (!session) {
      return { success: false, message: 'Sesi habis, silakan login kembali' };
    }

    const { idmargin, ppn_percent = 11, items } = data;

    if (!items || items.length === 0) {
      return { success: false, message: 'Daftar barang penjualan tidak boleh kosong' };
    }

    await connection.beginTransaction();

    // 1. Cek ketersediaan stok tiap barang
    for (const item of items) {
      if (item.jumlah <= 0) {
        await connection.rollback();
        return { success: false, message: 'Jumlah barang harus lebih dari 0' };
      }

      const [stockRows] = await connection.query<RowDataPacket[]>(
        `SELECT stock FROM kartu_stok 
         WHERE idbarang = ? 
         ORDER BY idkartu_stok DESC 
         LIMIT 1`,
        [item.idbarang]
      );

      const currentStock = stockRows.length > 0 ? Number(stockRows[0].stock) : 0;
      if (currentStock < item.jumlah) {
        await connection.rollback();
        return {
          success: false,
          message: `Stok barang ${item.nama_barang || `#${item.idbarang}`} tidak mencukupi (Tersedia: ${currentStock}, Diminta: ${item.jumlah})`,
        };
      }
    }

    // 2. Hitung subtotal, ppn, dan total
    const subtotal = items.reduce(
      (acc, item) => acc + item.harga_satuan * item.jumlah,
      0
    );
    const ppn = Math.round(subtotal * (ppn_percent / 100));
    const total = subtotal + ppn;

    // 3. Simpan Header Penjualan
    const [headerResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO penjualan (subtotal_nilai, ppn, total_nilai, iduser, idmargin_penjualan) 
       VALUES (?, ?, ?, ?, ?)`,
      [subtotal, ppn, total, session.id_user, idmargin]
    );

    const idpenjualan = headerResult.insertId;

    // 4. Simpan Detail Penjualan dan Catat Pengurangan Stok (Jenis 'K' = Keluar)
    for (const item of items) {
      const itemSubtotal = item.harga_satuan * item.jumlah;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO detail_penjualan (harga_satuan, jumlah, subtotal, penjualan_idpenjualan, idbarang) 
         VALUES (?, ?, ?, ?, ?)`,
        [item.harga_satuan, item.jumlah, itemSubtotal, idpenjualan, item.idbarang]
      );

      // Ambil stok terakhir
      const [stockRows] = await connection.query<RowDataPacket[]>(
        `SELECT stock FROM kartu_stok 
         WHERE idbarang = ? 
         ORDER BY idkartu_stok DESC 
         LIMIT 1`,
        [item.idbarang]
      );

      const currentStock = stockRows.length > 0 ? Number(stockRows[0].stock) : 0;
      const nextStock = currentStock - item.jumlah;

      // Catat di kartu_stok
      await connection.execute<ResultSetHeader>(
        `INSERT INTO kartu_stok (jenis_transaksi, masuk, keluar, stock, idtransaksi, idbarang) 
         VALUES ('K', 0, ?, ?, ?, ?)`,
        [item.jumlah, nextStock, idpenjualan, item.idbarang]
      );
    }

    await connection.commit();

    revalidatePath('/dashboard/transaksi/penjualan');
    return {
      success: true,
      message: `Penjualan #${idpenjualan} berhasil disimpan`,
      id_penjualan: idpenjualan,
      total_nilai: total,
    };
  } catch (error) {
    await connection.rollback();
    console.error('Gagal menyimpan transaksi penjualan:', error);
    return { success: false, message: 'Gagal memproses transaksi penjualan' };
  } finally {
    connection.release();
  }
}
