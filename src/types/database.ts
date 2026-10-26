// 1. Role
export interface Role {
  id_role: number;
  nama_role: string;
}

// 2. User (View vu_user)
export interface UserView {
  id_user: number;
  username: string;
  id_role: number;
  nama_role: string;
}

// 3. Satuan (View vu_satuan)
export interface SatuanView {
  ID_SATUAN: number;
  NAMA_SATUAN: string;
  STATUS: number;
}

// 4. Vendor (View vu_vendor)
export interface VendorView {
  id_vendor: number;
  nama_vendor: string;
  badan_hukum: string;
  status: string;
}

// 5. Barang (View vu_barang)
export interface BarangView {
  id_barang: number;
  jenis: string;
  nama_barang: string;
  id_satuan: number;
  nama_satuan: string;
  status: number;
  harga: number;
}

// 6. Margin Penjualan (View vu_margin_penjualan)
export interface MarginPenjualanView {
  id_margin: number;
  persen: number;
  status: number;
  created_at: string | Date;
  updated_at: string | Date;
  id_user: number;
  dibuat_oleh: string;
}

// 7. Pengadaan (View vu_pengadaan)
export interface PengadaanView {
  id_pengadaan: number;
  tanggal_pengadaan: string | Date;
  id_user: number;
  dibuat_oleh: string;
  id_vendor: number;
  nama_vendor: string;
  badan_hukum: string;
  status: string;
  subtotal_nilai: number;
  ppn: number;
  total_nilai: number;
}

// 8. Detail Pengadaan (View vu_detail_pengadaan)
export interface DetailPengadaanView {
  id_detail_pengadaan: number;
  id_pengadaan: number;
  id_barang: number;
  nama_barang: string;
  nama_satuan: string;
  harga_satuan: number;
  jumlah: number;
  sub_total: number;
}

// 9. Penjualan (View vu_penjualan)
export interface PenjualanView {
  id_penjualan: number;
  tanggal_penjualan: string | Date;
  id_user: number;
  kasir: string;
  id_margin: number;
  persen_margin: number;
  subtotal_nilai: number;
  ppn: number;
  total_nilai: number;
}

// 10. Detail Penjualan (View vu_detail_penjualan)
export interface DetailPenjualanView {
  id_detail_penjualan: number;
  id_penjualan: number;
  id_barang: number;
  nama_barang: string;
  nama_satuan: string;
  harga_satuan: number;
  jumlah: number;
  subtotal: number;
}

// 11. Penerimaan (View vu_penerimaan)
export interface PenerimaanView {
  id_penerimaan: number;
  tanggal_penerimaan: string | Date;
  status: string;
  id_pengadaan: number;
  tanggal_pengadaan: string | Date;
  id_vendor: number;
  nama_vendor: string;
  id_user: number;
  diterima_oleh: string;
}

// 12. Detail Penerimaan (View vu_detail_penerimaan)
export interface DetailPenerimaanView {
  id_detail_penerimaan: number;
  id_penerimaan: number;
  id_barang: number;
  nama_barang: string;
  nama_satuan: string;
  jumlah_terima: number;
  harga_satuan_terima: number;
  sub_total_terima: number;
}