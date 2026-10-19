'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { SatuanView } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getSatuanViewAction(
  onlyActive: boolean = false
): Promise<SatuanView[]> {
  try {
    const viewName = onlyActive ? 'vu_satuan_aktif' : 'vu_satuan';
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT ID_SATUAN, NAMA_SATUAN, STATUS FROM ${viewName}`
    );
    return rows as SatuanView[];
  } catch (error) {
    console.error('Gagal mengambil data view satuan:', error);
    return [];
  }
}

export async function createSatuanAction(data: {
  nama_satuan: string;
  status: number;
}) {
  try {
    const { nama_satuan, status } = data;

    await db.execute<ResultSetHeader>(
      'INSERT INTO satuan (nama_satuan, status) VALUES (?, ?)',
      [nama_satuan, status]
    );

    revalidatePath('/dashboard/master/satuan');
    return { success: true, message: 'Satuan berhasil ditambahkan' };
  } catch (error) {
    console.error('Gagal menambah satuan:', error);
    return { success: false, message: 'Gagal menambahkan data satuan' };
  }
}

export async function updateSatuanAction(
  id_satuan: number,
  data: {
    nama_satuan: string;
    status: number;
  }
) {
  try {
    const { nama_satuan, status } = data;

    await db.execute<ResultSetHeader>(
      'UPDATE satuan SET nama_satuan = ?, status = ? WHERE idsatuan = ?',
      [nama_satuan, status, id_satuan]
    );

    revalidatePath('/dashboard/master/satuan');
    return { success: true, message: 'Satuan berhasil diperbarui' };
  } catch (error) {
    console.error('Gagal mengubah satuan:', error);
    return { success: false, message: 'Gagal memperbarui data satuan' };
  }
}

export async function deleteSatuanAction(id_satuan: number) {
  try {
    await db.execute<ResultSetHeader>(
      'DELETE FROM satuan WHERE idsatuan = ?',
      [id_satuan]
    );

    revalidatePath('/dashboard/master/satuan');
    return { success: true, message: 'Satuan berhasil dihapus' };
  } catch (error: any) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return {
        success: false,
        message:
          'Satuan tidak dapat dihapus karena masih digunakan pada data Barang',
      };
    }
    return { success: false, message: 'Gagal menghapus satuan' };
  }
}