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
  harga_satuan?: number;
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

    const { idvendor, items } = data;

    if (!items || items.length === 0) {
      return { success: false, message: 'Daftar barang pengadaan tidak boleh kosong' };
    }

    for (const item of items) {
      if (!item.idbarang || item.jumlah <= 0) {
        return {
          success: false,
          message: 'Jumlah barang harus lebih dari 0',
        };
      }
    }

    await connection.beginTransaction();

    const [headerResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO pengadaan (user_iduser, status, vendor_idvendor, subtotal_nilai, ppn, total_nilai) 
       VALUES (?, 'P', ?, 0, 0, 0)`,
      [session.id_user, idvendor]
    );

    const idpengadaan = headerResult.insertId;

    // Panggil Stored Procedure sp_tambah_detail_pengadaan (3 parameter: idpengadaan, idbarang, jumlah)
    // Harga satuan ditarik dari master barang, subtotal dihitung via fn_hitung_subtotal,
    // dan header pengadaan otomatis di-update oleh SP.
    for (const item of items) {
      await connection.query(
        `CALL sp_tambah_detail_pengadaan(?, ?, ?)`,
        [idpengadaan, item.idbarang, item.jumlah]
      );
    }

    await connection.commit();

    revalidatePath('/dashboard/transaksi/pengadaan');
    revalidatePath('/dashboard/transaksi/penerimaan');
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

export async function deleteDetailPengadaanAction(idDetailPengadaan: number) {
  try {
    await db.execute<ResultSetHeader>(
      'DELETE FROM detail_pengadaan WHERE iddetail_pengadaan = ?',
      [idDetailPengadaan]
    );

    revalidatePath('/dashboard/transaksi/pengadaan');
    return { success: true, message: 'Item detail pengadaan berhasil dihapus' };
  } catch (error) {
    console.error('Gagal menghapus item detail pengadaan:', error);
    return { success: false, message: 'Gagal menghapus item detail pengadaan' };
  }
}

export async function cancelPengadaanAction(idPengadaan: number) {
  try {
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
