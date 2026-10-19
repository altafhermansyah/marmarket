'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { UserView } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getUsersViewAction(): Promise<UserView[]> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id_user, username, id_role, nama_role FROM vu_user'
    );
    return rows as UserView[];
  } catch (error) {
    console.error('Gagal mengambil data vu_user:', error);
    return [];
  }
}

export async function createUserAction(data: {
  username: string;
  password: string;
  id_role: number;
}) {
  try {
    const { username, password, id_role } = data;

    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT iduser FROM user WHERE username = ? LIMIT 1',
      [username]
    );

    if (existing.length > 0) {
      return {
        success: false,
        message: 'Username sudah terdaftar, gunakan username lain',
      };
    }

    await db.execute<ResultSetHeader>(
      'INSERT INTO user (username, password, idrole) VALUES (?, SHA2(?, 256), ?)',
      [username, password, id_role]
    );

    revalidatePath('/dashboard/master/user');
    return { success: true, message: 'User baru berhasil ditambahkan' };
  } catch (error) {
    console.error('Gagal menambah user:', error);
    return { success: false, message: 'Gagal menambahkan user baru' };
  }
}

export async function updateUserAction(
  id_user: number,
  data: {
    username: string;
    password?: string;
    id_role: number;
  }
) {
  try {
    const { username, password, id_role } = data;

    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT iduser FROM user WHERE username = ? AND iduser != ? LIMIT 1',
      [username, id_user]
    );

    if (existing.length > 0) {
      return {
        success: false,
        message: 'Username sudah digunakan oleh pengguna lain',
      };
    }

    if (password && password.trim() !== '') {
      await db.execute<ResultSetHeader>(
        'UPDATE user SET username = ?, password = SHA2(?, 256), idrole = ? WHERE iduser = ?',
        [username, password, id_role, id_user]
      );
    } else {
      await db.execute<ResultSetHeader>(
        'UPDATE user SET username = ?, idrole = ? WHERE iduser = ?',
        [username, id_role, id_user]
      );
    }

    revalidatePath('/dashboard/master/user');
    return { success: true, message: 'Data user berhasil diperbarui' };
  } catch (error) {
    console.error('Gagal memperbarui user:', error);
    return { success: false, message: 'Gagal memperbarui data user' };
  }
}

export async function deleteUserAction(id_user: number) {
  try {
    await db.execute<ResultSetHeader>(
      'DELETE FROM user WHERE iduser = ?',
      [id_user]
    );
    revalidatePath('/dashboard/master/user');
    return { success: true, message: 'User berhasil dihapus' };
  } catch (error: any) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return {
        success: false,
        message:
          'User tidak dapat dihapus karena sudah tercatat pada data Margin atau Transaksi',
      };
    }
    return { success: false, message: 'Gagal menghapus user' };
  }
}