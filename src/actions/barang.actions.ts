'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { BarangView } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getBarangViewAction(
  onlyActive: boolean = false
): Promise<BarangView[]> {
  try {
    const viewName = onlyActive ? 'vu_barang_aktif' : 'vu_barang';
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id_barang, jenis, nama_barang, id_satuan, nama_satuan, status, harga FROM ${viewName}`
    );
    return rows as BarangView[];
  } catch (error) {
    console.error('Gagal mengambil data view barang:', error);
    return [];
  }
}

export async function createBarangAction(data: {
  jenis: string;
  nama_barang: string;
  id_satuan: number;
  status: number;
  harga: number;
}) {
  try {
    const { jenis, nama_barang, id_satuan, status, harga } = data;

    await db.execute<ResultSetHeader>(
      'INSERT INTO barang (jenis, nama, idsatuan, status, harga) VALUES (?, ?, ?, ?, ?)',
      [jenis, nama_barang, id_satuan, status, harga]
    );

    revalidatePath('/dashboard/master/barang');
    return { success: true, message: 'Barang berhasil ditambahkan' };
  } catch (error) {
    console.error('Gagal menambah barang:', error);
    return { success: false, message: 'Gagal menambahkan data barang' };
  }
}

export async function updateBarangAction(
  id_barang: number,
  data: {
    jenis: string;
    nama_barang: string;
    id_satuan: number;
    status: number;
    harga: number;
  }
) {
  try {
    const { jenis, nama_barang, id_satuan, status, harga } = data;

    await db.execute<ResultSetHeader>(
      'UPDATE barang SET jenis = ?, nama = ?, idsatuan = ?, status = ?, harga = ? WHERE idbarang = ?',
      [jenis, nama_barang, id_satuan, status, harga, id_barang]
    );

    revalidatePath('/dashboard/master/barang');
    return { success: true, message: 'Barang berhasil diperbarui' };
  } catch (error) {
    console.error('Gagal mengubah barang:', error);
    return { success: false, message: 'Gagal memperbarui data barang' };
  }
}

// 4. Hapus Barang
export async function deleteBarangAction(id_barang: number) {
  try {
    await db.execute<ResultSetHeader>(
      'DELETE FROM barang WHERE idbarang = ?',
      [id_barang]
    );

    revalidatePath('/dashboard/master/barang');
    return { success: true, message: 'Barang berhasil dihapus' };
  } catch (error: any) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return {
        success: false,
        message:
          'Barang tidak dapat dihapus karena sudah memiliki riwayat transaksi atau kartu stok',
      };
    }
    return { success: false, message: 'Gagal menghapus barang' };
  }
}