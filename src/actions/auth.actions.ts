'use server';

import { db } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { cookies } from 'next/headers';

export interface SessionUser {
  id_user: number;
  username: string;
  id_role: number;
  nama_role: string;
}

// 1. Ambil daftar role dari View vu_role
export async function getRolesAction() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id_role, nama_role FROM vu_role'
    );
    return rows as { id_role: number; nama_role: string }[];
  } catch (error) {
    console.error('Gagal mengambil data role:', error);
    return [];
  }
}

// 2. Action Register User Baru dengan SHA2(?, 256)
export async function registerAction(data: {
  username: string;
  password: string;
  idrole: number;
}) {
  try {
    const { username, password, idrole } = data;

    // Cek apakah username sudah terdaftar
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT iduser FROM user WHERE username = ? LIMIT 1',
      [username]
    );

    if (existing.length > 0) {
      return {
        success: false,
        message: 'Username sudah digunakan, silakan pilih username lain',
      };
    }

    // Insert user baru menggunakan fungsi SHA2(?, 256) sesuai DML UTS
    await db.execute<ResultSetHeader>(
      'INSERT INTO user (username, password, idrole) VALUES (?, SHA2(?, 256), ?)',
      [username, password, idrole]
    );

    return {
      success: true,
      message: 'Register berhasil, silakan login',
    };
  } catch (error: any) {
    console.error('Error registerAction:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat menyimpan data user ke database',
    };
  }
}

// 3. Action Login User dengan pencocokan SHA2(?, 256)
export async function loginAction(data: {
  username: string;
  password: string;
}) {
  try {
    const { username, password } = data;

    // Bandingkan password di DB dengan SHA2(?, 256) langsung di query SQL
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 
         u.iduser, 
         u.username, 
         u.idrole, 
         r.nama_role,
         (u.password = SHA2(?, 256)) AS is_password_match
       FROM user u, role r 
       WHERE u.idrole = r.idrole AND u.username = ? 
       LIMIT 1`,
      [password, username]
    );

    if (rows.length === 0) {
      return {
        success: false,
        message: 'Username tidak ditemukan',
      };
    }

    const userRecord = rows[0];

    // Validasi hasil kecocokan hash SHA2 dari MySQL (1 = cocok, 0 = salah)
    if (!userRecord.is_password_match) {
      return {
        success: false,
        message: 'Password yang Anda masukkan salah',
      };
    }

    const sessionData: SessionUser = {
      id_user: userRecord.iduser,
      username: userRecord.username,
      id_role: userRecord.idrole,
      nama_role: userRecord.nama_role,
    };

    // Simpan sesi ke Cookie
    const cookieStore = await cookies();
    cookieStore.set('marmarket_session', JSON.stringify(sessionData), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return {
      success: true,
      message: `Login berhasil sebagai ${userRecord.username}`,
      user: sessionData,
    };
  } catch (error: any) {
    console.error('Error loginAction:', error);
    return {
      success: false,
      message: 'Gagal terhubung ke database',
    };
  }
}

// 4. Ambil sesi user dari Cookie
export async function getSessionAction(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('marmarket_session');
    if (!sessionCookie?.value) return null;
    return JSON.parse(sessionCookie.value) as SessionUser;
  } catch {
    return null;
  }
}

// 5. Action Logout
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('marmarket_session');
}