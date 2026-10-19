'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Role } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getRolesViewAction(): Promise<Role[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id_role, nama_role FROM vu_role'
    );
    return rows as Role[];
  } catch (error) {
    console.error('Gagal mengambil data vu_role:', error);
    return [];
  }
}

export async function createRoleAction(nama_role: string) {
  try {
    await db.execute<ResultSetHeader>(
      'INSERT INTO role (nama_role) VALUES (?)',
      [nama_role]
    );
    revalidatePath('/dashboard/master/role');
    return { success: true, message: 'Role berhasil ditambahkan' };
  } catch (error) {
    console.error('Gagal menambah role:', error);
    return { success: false, message: 'Gagal menambahkan role baru' };
  }
}

export async function updateRoleAction(id_role: number, nama_role: string) {
  try {
    await db.execute<ResultSetHeader>(
      'UPDATE role SET nama_role = ? WHERE idrole = ?',
      [nama_role, id_role]
    );
    revalidatePath('/dashboard/master/role');
    return { success: true, message: 'Role berhasil diperbarui' };
  } catch (error) {
    console.error('Gagal mengubah role:', error);
    return { success: false, message: 'Gagal memperbarui data role' };
  }
}

export async function deleteRoleAction(id_role: number) {
  try {
    await db.execute<ResultSetHeader>(
      'DELETE FROM role WHERE idrole = ?',
      [id_role]
    );
    revalidatePath('/dashboard/master/role');
    return { success: true, message: 'Role berhasil dihapus' };
  } catch (error: any) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return {
        success: false,
        message: 'Role tidak dapat dihapus karena masih digunakan oleh data User',
      };
    }
    return { success: false, message: 'Gagal menghapus role' };
  }
}