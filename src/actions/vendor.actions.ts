'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { VendorView } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getVendorViewAction(
  onlyActive: boolean = false
): Promise<VendorView[]> {
  try {
    const viewName = onlyActive ? 'vu_vendor_aktif' : 'vu_vendor';
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id_vendor, nama_vendor, badan_hukum, status FROM ${viewName}`
    );
    return rows as VendorView[];
  } catch (error) {
    console.error('Gagal mengambil data view vendor:', error);
    return [];
  }
}

export async function createVendorAction(data: {
  nama_vendor: string;
  badan_hukum: string;
  status: string;
}) {
  try {
    const { nama_vendor, badan_hukum, status } = data;

    await db.execute<ResultSetHeader>(
      'INSERT INTO vendor (nama_vendor, badan_hukum, status) VALUES (?, ?, ?)',
      [nama_vendor, badan_hukum, status]
    );

    revalidatePath('/dashboard/master/vendor');
    return { success: true, message: 'Vendor berhasil ditambahkan' };
  } catch (error) {
    console.error('Gagal menambah vendor:', error);
    return { success: false, message: 'Gagal menambahkan data vendor' };
  }
}

export async function updateVendorAction(
  id_vendor: number,
  data: {
    nama_vendor: string;
    badan_hukum: string;
    status: string;
  }
) {
  try {
    const { nama_vendor, badan_hukum, status } = data;

    await db.execute<ResultSetHeader>(
      'UPDATE vendor SET nama_vendor = ?, badan_hukum = ?, status = ? WHERE idvendor = ?',
      [nama_vendor, badan_hukum, status, id_vendor]
    );

    revalidatePath('/dashboard/master/vendor');
    return { success: true, message: 'Vendor berhasil diperbarui' };
  } catch (error) {
    console.error('Gagal mengubah vendor:', error);
    return { success: false, message: 'Gagal memperbarui data vendor' };
  }
}

export async function deleteVendorAction(id_vendor: number) {
  try {
    await db.execute<ResultSetHeader>(
      'DELETE FROM vendor WHERE idvendor = ?',
      [id_vendor]
    );

    revalidatePath('/dashboard/master/vendor');
    return { success: true, message: 'Vendor berhasil dihapus' };
  } catch (error: any) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return {
        success: false,
        message:
          'Vendor tidak dapat dihapus karena sudah tercatat pada transaksi Pengadaan',
      };
    }
    return { success: false, message: 'Gagal menghapus vendor' };
  }
}