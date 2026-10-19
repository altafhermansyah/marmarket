'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { MarginPenjualanView } from '@/types/database';
import { getSessionAction } from '@/actions/auth.actions';
import { revalidatePath } from 'next/cache';

export async function getMarginViewAction(
  onlyActive: boolean = false
): Promise<MarginPenjualanView[]> {
  try {
    const viewName = onlyActive
      ? 'vu_margin_penjualan_aktif'
      : 'vu_margin_penjualan';
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id_margin, persen, status, created_at, updated_at, id_user, dibuat_oleh FROM ${viewName} ORDER BY id_margin DESC`
    );
    return rows as MarginPenjualanView[];
  } catch (error) {
    console.error('Gagal mengambil data view margin:', error);
    return [];
  }
}

export async function createMarginAction(data: {
  persen: number;
  status: number;
}) {
  try {
    const session = await getSessionAction();
    if (!session) {
      return { success: false, message: 'Sesi habis, silakan login kembali' };
    }

    const { persen, status } = data;

    if (status === 1) {
      await db.execute('UPDATE margin_penjualan SET status = 0 WHERE status = 1');
    }

    await db.execute<ResultSetHeader>(
      'INSERT INTO margin_penjualan (persen, status, iduser, created_at) VALUES (?, ?, ?, NOW())',
      [persen, status, session.id_user]
    );

    revalidatePath('/dashboard/master/margin');
    return { success: true, message: 'Margin penjualan berhasil ditambahkan' };
  } catch (error) {
    console.error('Gagal menambah margin:', error);
    return { success: false, message: 'Gagal menambahkan margin penjualan' };
  }
}

export async function updateMarginAction(
  id_margin: number,
  data: {
    persen: number;
    status: number;
  }
) {
  try {
    const session = await getSessionAction();
    if (!session) {
      return { success: false, message: 'Sesi habis, silakan login kembali' };
    }

    const { persen, status } = data;

    if (status === 1) {
      await db.execute(
        'UPDATE margin_penjualan SET status = 0 WHERE status = 1 AND idmargin_penjualan != ?',
        [id_margin]
      );
    }

    await db.execute<ResultSetHeader>(
      'UPDATE margin_penjualan SET persen = ?, status = ?, iduser = ?, updated_at = NOW() WHERE idmargin_penjualan = ?',
      [persen, status, session.id_user, id_margin]
    );

    revalidatePath('/dashboard/master/margin');
    return { success: true, message: 'Margin penjualan berhasil diperbarui' };
  } catch (error) {
    console.error('Gagal mengubah margin:', error);
    return { success: false, message: 'Gagal memperbarui margin penjualan' };
  }
}

export async function deleteMarginAction(id_margin: number) {
  try {
    await db.execute<ResultSetHeader>(
      'DELETE FROM margin_penjualan WHERE idmargin_penjualan = ?',
      [id_margin]
    );

    revalidatePath('/dashboard/master/margin');
    return { success: true, message: 'Margin penjualan berhasil dihapus' };
  } catch (error: any) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return {
        success: false,
        message:
          'Margin penjualan tidak dapat dihapus karena tercatat pada riwayat Penjualan',
      };
    }
    return { success: false, message: 'Gagal menghapus margin penjualan' };
  }
}