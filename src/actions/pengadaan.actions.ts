'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PengadaanView, DetailPengadaanView } from '@/types/database';
import { getSessionAction } from '@/actions/auth.actions';
import { revalidatePath } from 'next/cache';

export async function getPengadaanViewAction(): Promise<PengadaanView[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id_pengadaan, 
        tanggal_pengadaan, 
        id_user, 
        dibuat_oleh, 
        id_vendor, 
        nama_vendor, 
        badan_hukum, 
        status, 
        subtotal_nilai, 
        ppn, 
        total_nilai 
      FROM vu_pengadaan 
      ORDER BY id_pengadaan DESC`
    );
    return rows as PengadaanView[];
  } catch (error) {
    console.error('Gagal mengambil data view pengadaan:', error);
    return [];
  }
}

export async function getDetailPengadaanViewAction(
  idPengadaan: number
): Promise<DetailPengadaanView[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
        id_detail_pengadaan, 
        id_pengadaan, 
        id_barang, 
        nama_barang, 
        nama_satuan, 
        harga_satuan, 
        jumlah, 
        sub_total 
      FROM vu_detail_pengadaan 
      WHERE id_pengadaan = ? 
      ORDER BY id_detail_pengadaan ASC`,
      [idPengadaan]
    );
    return rows as DetailPengadaanView[];
  } catch (error) {
    console.error('Gagal mengambil detail view pengadaan:', error);
    return [];
  }
}

export async function getPengadaanByIdAction(
  idPengadaan: number
): Promise<{ header: PengadaanView | null; details: DetailPengadaanView[] }> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM vu_pengadaan WHERE id_pengadaan = ? LIMIT 1',
      [idPengadaan]
    );
    const header = rows.length > 0 ? (rows[0] as PengadaanView) : null;
    const details = await getDetailPengadaanViewAction(idPengadaan);
    return { header, details };
  } catch (error) {
    console.error('Gagal mengambil pengadaan by ID:', error);
    return { header: null, details: [] };
  }
}

export interface CreatePengadaanItemInput {
  idbarang: number;
  harga_satuan: number;
  jumlah: number;
}

export async function createPengadaanAction(data: {
  idvendor: number;
  ppn_percent?: number;
  items: CreatePengadaanItemInput[];
}) {
  const connection = await db.getConnection();
  try {
    const session = await getSessionAction();
    if (!session) {
      return { success: false, message: 'Sesi habis, silakan login kembali' };
    }

    const { idvendor, ppn_percent = 11, items } = data;

    if (!items || items.length === 0) {
      return { success: false, message: 'Daftar barang pengadaan tidak boleh kosong' };
    }

    for (const item of items) {
      if (!item.idbarang || item.jumlah <= 0 || item.harga_satuan < 0) {
        return {
          success: false,
          message: 'Jumlah barang harus lebih dari 0 dan harga satuan tidak boleh negatif',
        };
      }
    }

    const subtotal = items.reduce(
      (acc, item) => acc + item.harga_satuan * item.jumlah,
      0
    );
    const ppn = Math.round(subtotal * (ppn_percent / 100));
    const total = subtotal + ppn;

    await connection.beginTransaction();

    // 1. Simpan Header Pengadaan (Status 'P' = Proses/Diajukan)
    const [headerResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO pengadaan (user_iduser, status, vendor_idvendor, subtotal_nilai, ppn, total_nilai) 
       VALUES (?, 'P', ?, ?, ?, ?)`,
      [session.id_user, idvendor, subtotal, ppn, total]
    );

    const idpengadaan = headerResult.insertId;

    // 2. Simpan Item Detail Pengadaan
    for (const item of items) {
      const itemSubtotal = item.harga_satuan * item.jumlah;
      await connection.execute<ResultSetHeader>(
        `INSERT INTO detail_pengadaan (harga_satuan, jumlah, sub_total, idbarang, idpengadaan) 
         VALUES (?, ?, ?, ?, ?)`,
        [item.harga_satuan, item.jumlah, itemSubtotal, item.idbarang, idpengadaan]
      );
    }

    await connection.commit();

    revalidatePath('/dashboard/transaksi/pengadaan');
    return {
      success: true,
      message: `Pengadaan #${idpengadaan} berhasil dibuat`,
      id_pengadaan: idpengadaan,
    };
  } catch (error) {
    await connection.rollback();
    console.error('Gagal membuat transaksi pengadaan:', error);
    return { success: false, message: 'Gagal membuat transaksi pengadaan' };
  } finally {
    connection.release();
  }
}

export async function cancelPengadaanAction(idPengadaan: number) {
  try {
    // Cek apakah sudah pernah diterima di penerimaan
    const [penerimaanCheck] = await db.query<RowDataPacket[]>(
      'SELECT idpenerimaan FROM penerimaan WHERE idpengadaan = ? LIMIT 1',
      [idPengadaan]
    );

    if (penerimaanCheck.length > 0) {
      return {
        success: false,
        message: 'Pengadaan tidak dapat dibatalkan karena sudah diproses ke penerimaan barang',
      };
    }

    await db.execute<ResultSetHeader>(
      "UPDATE pengadaan SET status = 'B' WHERE idpengadaan = ?",
      [idPengadaan]
    );

    revalidatePath('/dashboard/transaksi/pengadaan');
    return { success: true, message: 'Pengadaan berhasil dibatalkan' };
  } catch (error) {
    console.error('Gagal membatalkan pengadaan:', error);
    return { success: false, message: 'Gagal membatalkan pengadaan' };
  }
}
