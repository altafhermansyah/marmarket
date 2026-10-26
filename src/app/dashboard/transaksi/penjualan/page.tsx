'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Flex,
  Modal,
  Form,
  Select,
  InputNumber,
  Tag,
  message,
  Divider,
  Descriptions,
  Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  DeleteOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import {
  PenjualanView,
  DetailPenjualanView,
  MarginPenjualanView,
} from '@/types/database';
import {
  getPenjualanViewAction,
  getDetailPenjualanViewAction,
  getActiveMarginAction,
  getBarangWithStockAction,
  createPenjualanAction,
  BarangStokItem,
} from '@/actions/penjualan.actions';
import { formatRupiah, formatTanggal } from '@/lib/format';

const { Title, Text } = Typography;

interface CartItemRow {
  key: string;
  idbarang: number;
  nama_barang: string;
  nama_satuan: string;
  stok_tersedia: number;
  harga_dasar: number;
  harga_satuan: number; // harga jual setelah margin
  jumlah: number;
  subtotal: number;
}

export default function PenjualanPage() {
  const [data, setData] = useState<PenjualanView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [activeMargin, setActiveMargin] = useState<MarginPenjualanView | null>(null);
  const [availableBarang, setAvailableBarang] = useState<BarangStokItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItemRow[]>([]);
  const [ppnPercent, setPpnPercent] = useState<number>(11);

  // Modal Detail
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedPenjualan, setSelectedPenjualan] = useState<PenjualanView | null>(null);
  const [detailItems, setDetailItems] = useState<DetailPenjualanView[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchPenjualanList = async () => {
    setLoading(true);
    const res = await getPenjualanViewAction();
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchPenjualanList();
  }, []);

  const handleOpenCreate = async () => {
    form.resetFields();
    setPpnPercent(11);
    setCartItems([]);
    setIsCreateOpen(true);

    const [marginRes, barangRes] = await Promise.all([
      getActiveMarginAction(),
      getBarangWithStockAction(),
    ]);

    setActiveMargin(marginRes);
    setAvailableBarang(barangRes);

    // Default 1 row
    setCartItems([
      {
        key: 'cart-' + Date.now(),
        idbarang: 0,
        nama_barang: '',
        nama_satuan: '',
        stok_tersedia: 0,
        harga_dasar: 0,
        harga_satuan: 0,
        jumlah: 1,
        subtotal: 0,
      },
    ]);
  };

  const handleAddCartItem = () => {
    setCartItems((prev) => [
      ...prev,
      {
        key: 'cart-' + (Date.now() + Math.random()),
        idbarang: 0,
        nama_barang: '',
        nama_satuan: '',
        stok_tersedia: 0,
        harga_dasar: 0,
        harga_satuan: 0,
        jumlah: 1,
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveCartItem = (key: string) => {
    if (cartItems.length <= 1) {
      messageApi.warning('Minimal harus ada 1 barang dalam transaksi penjualan');
      return;
    }
    setCartItems((prev) => prev.filter((i) => i.key !== key));
  };

  const handleSelectBarang = (key: string, idbarang: number) => {
    const selected = availableBarang.find((b) => b.id_barang === idbarang);
    if (!selected) return;

    const marginPct = activeMargin?.persen || 0;
    // Harga jual = harga dasar + margin
    const hargaJual = Math.round(selected.harga * (1 + marginPct / 100));

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return {
            ...item,
            idbarang,
            nama_barang: selected.nama_barang,
            nama_satuan: selected.nama_satuan,
            stok_tersedia: selected.stok,
            harga_dasar: selected.harga,
            harga_satuan: hargaJual,
            subtotal: hargaJual * item.jumlah,
          };
        }
        return item;
      })
    );
  };

  const handleQtyChange = (key: string, qty: number | null) => {
    const val = qty || 0;
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return {
            ...item,
            jumlah: val,
            subtotal: item.harga_satuan * val,
          };
        }
        return item;
      })
    );
  };

  const calculateSubtotal = () =>
    cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);

  const calculatePpn = () =>
    Math.round(calculateSubtotal() * (ppnPercent / 100));

  const calculateTotal = () => calculateSubtotal() + calculatePpn();

  const handleCreateSubmit = async () => {
    try {
      if (!activeMargin) {
        messageApi.error('Margin penjualan aktif tidak ditemukan');
        return;
      }

      const validItems = cartItems.filter((i) => i.idbarang > 0 && i.jumlah > 0);
      if (validItems.length === 0) {
        messageApi.error('Pilih minimal 1 barang dengan jumlah valid');
        return;
      }

      // Validasi stok
      for (const item of validItems) {
        if (item.jumlah > item.stok_tersedia) {
          messageApi.error(
            `Stok "${item.nama_barang}" tidak mencukupi (Tersedia: ${item.stok_tersedia}, Diminta: ${item.jumlah})`
          );
          return;
        }
      }

      setSubmitting(true);
      const res = await createPenjualanAction({
        idmargin: activeMargin.id_margin,
        ppn_percent: ppnPercent,
        items: validItems.map((i) => ({
          idbarang: i.idbarang,
          nama_barang: i.nama_barang,
          harga_satuan: i.harga_satuan,
          jumlah: i.jumlah,
        })),
      });
      setSubmitting(false);

      if (res.success) {
        messageApi.success(res.message);
        setIsCreateOpen(false);
        fetchPenjualanList();
      } else {
        messageApi.error(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetail = async (record: PenjualanView) => {
    setSelectedPenjualan(record);
    setIsDetailOpen(true);
    setDetailLoading(true);
    const details = await getDetailPenjualanViewAction(record.id_penjualan);
    setDetailItems(details);
    setDetailLoading(false);
  };

  const columns: ColumnsType<PenjualanView> = [
    {
      title: 'No. Faktur',
      dataIndex: 'id_penjualan',
      key: 'id_penjualan',
      width: 110,
      render: (id: number) => <Text strong>#PJ-{id}</Text>,
    },
    {
      title: 'Tanggal Transaksi',
      dataIndex: 'tanggal_penjualan',
      key: 'tanggal_penjualan',
      width: 170,
      render: (tgl) => <Text>{formatTanggal(tgl)}</Text>,
    },
    {
      title: 'Kasir',
      dataIndex: 'kasir',
      key: 'kasir',
      width: 140,
      render: (kasir: string) => <Tag color="blue">{kasir}</Tag>,
    },
    {
      title: 'Margin Penjualan',
      dataIndex: 'persen_margin',
      key: 'persen_margin',
      width: 130,
      render: (margin: number) => (
        <Badge
          count={`${margin}%`}
          style={{ backgroundColor: '#0284c7' }}
        />
      ),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal_nilai',
      key: 'subtotal_nilai',
      width: 130,
      render: (val: number) => <Text>{formatRupiah(val)}</Text>,
    },
    {
      title: 'PPN',
      dataIndex: 'ppn',
      key: 'ppn',
      width: 120,
      render: (val: number) => <Text>{formatRupiah(val)}</Text>,
    },
    {
      title: 'Total Bayar',
      dataIndex: 'total_nilai',
      key: 'total_nilai',
      width: 140,
      render: (val: number) => (
        <Text strong style={{ color: '#16a34a' }}>
          {formatRupiah(val)}
        </Text>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Detail
        </Button>
      ),
    },
  ];

  return (
    <Flex vertical gap={20}>
      {contextHolder}

      {/* Header Halaman */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Flex vertical gap={2}>
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            Transaksi Penjualan (POS Kasir)
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber Data: Database View <Text code>vu_penjualan</Text> & <Text code>vu_detail_penjualan</Text>
          </Text>
        </Flex>

        <Flex gap={8} align="center">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPenjualanList}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={handleOpenCreate}
          >
            Transaksi Baru
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Penjualan */}
      <Card
        style={{
          border: '1px solid #e4e4e7',
          boxShadow: 'none',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id_penjualan"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} transaksi penjualan`,
          }}
        />
      </Card>

      {/* Modal Detail Penjualan / Struk */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <DollarOutlined />
            <span>Faktur Penjualan #PJ-{selectedPenjualan?.id_penjualan}</span>
          </Flex>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)}>
            Tutup
          </Button>,
        ]}
        width={750}
      >
        {selectedPenjualan && (
          <Flex vertical gap={16} style={{ marginTop: 12 }}>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'kasir',
                  label: 'Kasir',
                  children: selectedPenjualan.kasir,
                },
                {
                  key: 'tanggal',
                  label: 'Tanggal Transaksi',
                  children: formatTanggal(selectedPenjualan.tanggal_penjualan),
                },
                {
                  key: 'margin',
                  label: 'Margin Penjualan',
                  children: `${selectedPenjualan.persen_margin}%`,
                },
                {
                  key: 'subtotal',
                  label: 'Subtotal Nilai',
                  children: formatRupiah(selectedPenjualan.subtotal_nilai),
                },
                {
                  key: 'ppn',
                  label: 'PPN (11%)',
                  children: formatRupiah(selectedPenjualan.ppn),
                },
                {
                  key: 'total',
                  label: 'Total Bayar',
                  children: (
                    <Text strong style={{ color: '#16a34a', fontSize: 16 }}>
                      {formatRupiah(selectedPenjualan.total_nilai)}
                    </Text>
                  ),
                },
              ]}
            />

            <Flex vertical gap={6}>
              <Text strong style={{ fontSize: 13 }}>
                Item Penjualan (View: <Text code>vu_detail_penjualan</Text>)
              </Text>
              <Table
                size="small"
                bordered
                loading={detailLoading}
                dataSource={detailItems}
                rowKey="id_detail_penjualan"
                pagination={false}
                columns={[
                  {
                    title: 'No',
                    width: 50,
                    render: (_, __, idx) => idx + 1,
                  },
                  {
                    title: 'Nama Barang',
                    dataIndex: 'nama_barang',
                    key: 'nama_barang',
                    render: (nama) => <Text strong>{nama}</Text>,
                  },
                  {
                    title: 'Satuan',
                    dataIndex: 'nama_satuan',
                    key: 'nama_satuan',
                    width: 90,
                  },
                  {
                    title: 'Harga Satuan',
                    dataIndex: 'harga_satuan',
                    key: 'harga_satuan',
                    width: 130,
                    render: (val) => formatRupiah(val),
                  },
                  {
                    title: 'Qty',
                    dataIndex: 'jumlah',
                    key: 'jumlah',
                    width: 80,
                    align: 'center',
                    render: (val) => <Text strong>{val}</Text>,
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'subtotal',
                    key: 'subtotal',
                    width: 140,
                    render: (val) => <Text strong>{formatRupiah(val)}</Text>,
                  },
                ]}
              />
            </Flex>
          </Flex>
        )}
      </Modal>

      {/* Modal Transaksi Penjualan Baru */}
      <Modal
        title="Input Transaksi Penjualan Baru"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={handleCreateSubmit}
        confirmLoading={submitting}
        okText="Proses Penjualan"
        cancelText="Batal"
        width={850}
      >
        <Flex vertical gap={14} style={{ marginTop: 12 }}>
          {/* Info Margin & PPN */}
          <Card
            size="small"
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <Flex align="center" gap={8}>
                <Text type="secondary">Margin Aktif:</Text>
                <Tag color="cyan">
                  {activeMargin
                    ? `${activeMargin.persen}% (ID: #${activeMargin.id_margin})`
                    : 'Tidak ada'}
                </Tag>
              </Flex>
              <Flex align="center" gap={8}>
                <Text type="secondary">PPN (%):</Text>
                <InputNumber
                  size="small"
                  min={0}
                  max={100}
                  value={ppnPercent}
                  onChange={(val) => setPpnPercent(val || 0)}
                  style={{ width: 80 }}
                />
              </Flex>
            </Flex>
          </Card>

          <Flex justify="space-between" align="center">
            <Text strong>Keranjang Barang Belanja</Text>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddCartItem}
            >
              Tambah Item
            </Button>
          </Flex>

          {cartItems.map((item, idx) => (
            <Flex
              key={item.key}
              align="center"
              gap={10}
              style={{
                backgroundColor: '#ffffff',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #e4e4e7',
              }}
            >
              <Text style={{ width: 24, textAlign: 'center' }}>{idx + 1}</Text>

              <div style={{ flex: 3 }}>
                <Select
                  placeholder="Pilih Barang"
                  style={{ width: '100%' }}
                  value={item.idbarang > 0 ? item.idbarang : undefined}
                  onChange={(val) => handleSelectBarang(item.key, val)}
                  options={availableBarang.map((b) => ({
                    value: b.id_barang,
                    disabled: b.stok <= 0,
                    label: `${b.nama_barang} (Stok: ${b.stok} ${b.nama_satuan}) - Dasar: ${formatRupiah(b.harga)}`,
                  }))}
                />
              </div>

              <div style={{ width: 130 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Harga Jual:
                </Text>
                <div>
                  <Text strong>{formatRupiah(item.harga_satuan)}</Text>
                </div>
              </div>

              <div style={{ width: 90 }}>
                <InputNumber
                  placeholder="Qty"
                  min={1}
                  max={item.stok_tersedia > 0 ? item.stok_tersedia : 1}
                  style={{ width: '100%' }}
                  value={item.jumlah}
                  onChange={(val) => handleQtyChange(item.key, val)}
                />
              </div>

              <div style={{ width: 130, textAlign: 'right' }}>
                <Text strong>{formatRupiah(item.subtotal)}</Text>
              </div>

              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveCartItem(item.key)}
              />
            </Flex>
          ))}

          {/* Rekapitulasi Tagihan */}
          <Card
            size="small"
            style={{
              marginTop: 8,
              backgroundColor: '#fafafa',
              border: '1px dashed #d4d4d8',
            }}
          >
            <Flex vertical gap={6}>
              <Flex justify="space-between">
                <Text type="secondary">Subtotal Barang:</Text>
                <Text>{formatRupiah(calculateSubtotal())}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text type="secondary">PPN ({ppnPercent}%):</Text>
                <Text>{formatRupiah(calculatePpn())}</Text>
              </Flex>
              <Divider style={{ margin: '4px 0' }} />
              <Flex justify="space-between" align="center">
                <Text strong style={{ fontSize: 14 }}>
                  Total Pembayaran:
                </Text>
                <Text strong style={{ fontSize: 18, color: '#16a34a' }}>
                  {formatRupiah(calculateTotal())}
                </Text>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      </Modal>
    </Flex>
  );
}
