'use server';

import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function getDashboardStatsAction() {
  try {
    const [[barangRes]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM vu_barang_aktif'
    );
    const [[vendorRes]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM vu_vendor_aktif'
    );
    const [[userRes]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM vu_user'
    );
    const [[satuanRes]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM vu_satuan_aktif'
    );

    return {
      barangAktif: Number(barangRes?.total || 0),
      vendorAktif: Number(vendorRes?.total || 0),
      totalUser: Number(userRes?.total || 0),
      satuanAktif: Number(satuanRes?.total || 0),
    };
  } catch (error) {
    console.error('Gagal mengambil statistik dashboard:', error);
    return {
      barangAktif: 0,
      vendorAktif: 0,
      totalUser: 0,
      satuanAktif: 0,
    };
  }
}