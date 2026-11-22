'use server';

import { db } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { KartuStokView } from '@/types/database';

export interface KartuStokFilterParams {
  id_barang?: number;
  jenis_transaksi?: string; // 'M' | 'K' | 'ALL'
}

export async function getKartuStokViewAction(
  params?: KartuStokFilterParams
): Promise<KartuStokView[]> {
  try {
    let sql = `
      SELECT 
        id_kartu_stok, 
        tanggal_catat, 
        id_barang, 
        nama_barang, 
        nama_satuan, 
        jenis_transaksi, 
        id_transaksi, 
        masuk, 
        keluar, 
        stock 
      FROM vu_kartu_stok 
      WHERE 1=1
    `;
    const values: any[] = [];

    if (params?.id_barang && params.id_barang > 0) {
      sql += ' AND id_barang = ?';
      values.push(params.id_barang);
    }

    if (params?.jenis_transaksi && params.jenis_transaksi !== 'ALL') {
      sql += ' AND jenis_transaksi = ?';
      values.push(params.jenis_transaksi);
    }

    sql += ' ORDER BY id_kartu_stok DESC';

    const [rows] = await db.query<RowDataPacket[]>(sql, values);
    return rows as KartuStokView[];
  } catch (error) {
    console.error('Gagal mengambil data view kartu stok:', error);
    return [];
  }
}

export interface KartuStokSummary {
  totalMutasi: number;
  totalMasuk: number;
  totalKeluar: number;
  barangTermutasi: number;
}

export async function getKartuStokSummaryAction(): Promise<KartuStokSummary> {
  try {
    const [[stats]] = await db.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) AS total_mutasi,
        COALESCE(SUM(masuk), 0) AS total_masuk,
        COALESCE(SUM(keluar), 0) AS total_keluar,
        COUNT(DISTINCT id_barang) AS barang_termutasi
       FROM vu_kartu_stok`
    );

    return {
      totalMutasi: Number(stats?.total_mutasi || 0),
      totalMasuk: Number(stats?.total_masuk || 0),
      totalKeluar: Number(stats?.total_keluar || 0),
      barangTermutasi: Number(stats?.barang_termutasi || 0),
    };
  } catch (error) {
    console.error('Gagal mengambil ringkasan kartu stok:', error);
    return {
      totalMutasi: 0,
      totalMasuk: 0,
      totalKeluar: 0,
      barangTermutasi: 0,
    };
  }
}
