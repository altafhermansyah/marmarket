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
  harga: number; // harga dasar
  harga_jual: number; // harga jual dari Function fn_hitung_harga_jual
  stok: number; // stok dari Function fn_cek_stok
}

export async function getBarangWithStockAction(): Promise<BarangStokItem[]> {
  try {
    // Memanfaatkan Function fn_hitung_harga_jual dan fn_cek_stok
    const sql = `
      SELECT 
        b.id_barang, 
        b.nama_barang, 
        b.jenis, 
        b.nama_satuan, 
        b.harga, 
        fn_hitung_harga_jual(b.id_barang) AS harga_jual,
        fn_cek_stok(b.id_barang) AS stok 
      FROM vu_barang_aktif b 
      ORDER BY b.nama_barang ASC
    `;
    const [rows] = await db.query<RowDataPacket[]>(sql);
    return rows.map((r) => ({
      id_barang: Number(r.id_barang),
      nama_barang: String(r.nama_barang),
      jenis: String(r.jenis),
      nama_satuan: String(r.nama_satuan),
      harga: Number(r.harga),
      harga_jual: Number(r.harga_jual),
      stok: Number(r.stok),
    }));
  } catch (error) {
    console.error('Gagal mengambil barang beserta stok:', error);
    return [];
  }
}

export async function cekStokBarangAction(idbarang: number): Promise<number> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT fn_cek_stok(?) AS stok',
      [idbarang]
    );
    return rows.length > 0 ? Number(rows[0].stok) : 0;
  } catch (error) {
    console.error('Gagal menjalankan fn_cek_stok:', error);
    return 0;
  }
}

export async function hitungHargaJualAction(idbarang: number): Promise<number> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT fn_hitung_harga_jual(?) AS harga_jual',
      [idbarang]
    );
    return rows.length > 0 ? Number(rows[0].harga_jual) : 0;
  } catch (error) {
    console.error('Gagal menjalankan fn_hitung_harga_jual:', error);
    return 0;
  }
}

export interface CreatePenjualanItemInput {
  idbarang: number;
  nama_barang?: string;
  jumlah: number;
}

export async function createPenjualanAction(data: {
  idmargin: number;
  items: CreatePenjualanItemInput[];
}) {
  const connection = await db.getConnection();
  try {
    const session = await getSessionAction();
    if (!session) {
      return { success: false, message: 'Sesi habis, silakan login kembali' };
    }

    const { idmargin, items } = data;

    if (!items || items.length === 0) {
      return { success: false, message: 'Daftar barang penjualan tidak boleh kosong' };
    }

    await connection.beginTransaction();

    // 1. Cek ketersediaan stok tiap barang menggunakan Function fn_cek_stok
    for (const item of items) {
      if (item.jumlah <= 0) {
        await connection.rollback();
        return { success: false, message: 'Jumlah barang harus lebih dari 0' };
      }

      const [stockRows] = await connection.query<RowDataPacket[]>(
        'SELECT fn_cek_stok(?) AS stock',
        [item.idbarang]
      );

      const currentStock = stockRows.length > 0 ? Number(stockRows[0].stock) : 0;
      if (currentStock < item.jumlah) {
        await connection.rollback();
        return {
          success: false,
          message: `Stok barang "${item.nama_barang || `#${item.idbarang}`}" tidak mencukupi (Tersedia: ${currentStock}, Diminta: ${item.jumlah})`,
        };
      }
    }

    // 2. Simpan Header Penjualan
    // Nilai subtotal, ppn, dan total_nilai akan dihitung dan diupdate otomatis oleh TRIGGER trg_after_insert_detail_penjualan
    const [headerResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO penjualan (subtotal_nilai, ppn, total_nilai, iduser, idmargin_penjualan) 
       VALUES (0, 0, 0, ?, ?)`,
      [session.id_user, idmargin]
    );

    const idpenjualan = headerResult.insertId;

    // 3. Simpan Detail Penjualan menggunakan Stored Procedure sp_tambah_detail_penjualan
    // Yang otomatis menghitung harga jual via fn_hitung_harga_jual
    // Dan memicu TRIGGER trg_after_insert_detail_penjualan untuk mencatat mutasi 'K' ke kartu_stok serta update total nota
    for (const item of items) {
      await connection.query(
        `CALL sp_tambah_detail_penjualan(?, ?, ?)`,
        [idpenjualan, item.idbarang, item.jumlah]
      );
    }

    // 4. Ambil total_nilai yang telah diupdate oleh trigger
    const [penjualanUpdated] = await connection.query<RowDataPacket[]>(
      'SELECT total_nilai FROM penjualan WHERE idpenjualan = ?',
      [idpenjualan]
    );
    const finalTotal = penjualanUpdated.length > 0 ? Number(penjualanUpdated[0].total_nilai) : 0;

    await connection.commit();

    revalidatePath('/dashboard/transaksi/penjualan');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Penjualan #${idpenjualan} berhasil disimpan`,
      id_penjualan: idpenjualan,
      total_nilai: finalTotal,
    };
  } catch (error) {
    await connection.rollback();
    console.error('Gagal menyimpan transaksi penjualan:', error);
    return { success: false, message: 'Gagal memproses transaksi penjualan' };
  } finally {
    connection.release();
  }
}
