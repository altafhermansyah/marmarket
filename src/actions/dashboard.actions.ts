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
    const [[pengadaanRes]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM vu_pengadaan'
    );
    const [[penerimaanRes]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM vu_penerimaan'
    );
    const [[penjualanRes]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total, COALESCE(SUM(total_nilai), 0) AS omset FROM vu_penjualan'
    );

    return {
      barangAktif: Number(barangRes?.total || 0),
      vendorAktif: Number(vendorRes?.total || 0),
      totalUser: Number(userRes?.total || 0),
      satuanAktif: Number(satuanRes?.total || 0),
      totalPengadaan: Number(pengadaanRes?.total || 0),
      totalPenerimaan: Number(penerimaanRes?.total || 0),
      totalPenjualan: Number(penjualanRes?.total || 0),
      totalOmset: Number(penjualanRes?.omset || 0),
    };
  } catch (error) {
    console.error('Gagal mengambil statistik dashboard:', error);
    return {
      barangAktif: 0,
      vendorAktif: 0,
      totalUser: 0,
      satuanAktif: 0,
      totalPengadaan: 0,
      totalPenerimaan: 0,
      totalPenjualan: 0,
      totalOmset: 0,
    };
  }
}