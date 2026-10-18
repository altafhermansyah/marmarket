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