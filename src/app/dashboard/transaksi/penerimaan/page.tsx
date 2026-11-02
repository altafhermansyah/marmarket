'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Flex,
  Modal,
  InputNumber,
  Tag,
  message,
  Divider,
  Descriptions,
  Alert,
  Tabs,
  Progress,
  Badge,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ReloadOutlined,
  EyeOutlined,
  InboxOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShoppingOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import {
  PenerimaanView,
  DetailPenerimaanView,
  PengadaanPenerimaanProgressView,
  DetailPengadaanPenerimaanItem,
  DetailPengadaanView,
} from '@/types/database';
import {
  getPenerimaanViewAction,
  getDetailPenerimaanViewAction,
  getPengadaanPenerimaanProgressAction,
  getDetailPengadaanForPenerimaanAction,
  createPenerimaanAction,
} from '@/actions/penerimaan.actions';
import { getDetailPengadaanViewAction } from '@/actions/pengadaan.actions';
import { formatRupiah, formatTanggal } from '@/lib/format';

const { Title, Text } = Typography;

interface ReceivingItemRow extends DetailPengadaanPenerimaanItem {
  jumlah_terima: number;
  harga_satuan_terima: number;
  sub_total_terima: number;
}

export default function PenerimaanPage() {
  const [activeTab, setActiveTab] = useState<string>('pengadaan');

  // Data Pengadaan Siap Terima
  const [pengadaanList, setPengadaanList] = useState<PengadaanPenerimaanProgressView[]>([]);
  const [loadingPengadaan, setLoadingPengadaan] = useState<boolean>(true);

  // Data Riwayat Penerimaan
  const [penerimaanList, setPenerimaanList] = useState<PenerimaanView[]>([]);
  const [loadingPenerimaan, setLoadingPenerimaan] = useState<boolean>(true);

  // Modal Proses Penerimaan Bertahap
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState<boolean>(false);
  const [selectedPengadaan, setSelectedPengadaan] = useState<PengadaanPenerimaanProgressView | null>(null);
  const [receivingItems, setReceivingItems] = useState<ReceivingItemRow[]>([]);
  const [loadingReceiveItems, setLoadingReceiveItems] = useState<boolean>(false);
  const [submittingReceive, setSubmittingReceive] = useState<boolean>(false);

  // Modal Detail Penerimaan (Surat Jalan)
  const [isDetailPenerimaanOpen, setIsDetailPenerimaanOpen] = useState<boolean>(false);
  const [selectedPenerimaan, setSelectedPenerimaan] = useState<PenerimaanView | null>(null);
  const [detailPenerimaanItems, setDetailPenerimaanItems] = useState<DetailPenerimaanView[]>([]);
  const [loadingDetailPenerimaan, setLoadingDetailPenerimaan] = useState<boolean>(false);

  // Modal Detail PO Pengadaan
  const [isDetailPOOpen, setIsDetailPOOpen] = useState<boolean>(false);
  const [selectedPO, setSelectedPO] = useState<PengadaanPenerimaanProgressView | null>(null);
  const [detailPOItems, setDetailPOItems] = useState<DetailPengadaanView[]>([]);
  const [loadingDetailPO, setLoadingDetailPO] = useState<boolean>(false);

  const [messageApi, contextHolder] = message.useMessage();

  // Load Daftar Pengadaan
  const fetchPengadaanList = async () => {
    setLoadingPengadaan(true);
    const res = await getPengadaanPenerimaanProgressAction();
    setPengadaanList(res);
    setLoadingPengadaan(false);
  };

  // Load Riwayat Penerimaan
  const fetchPenerimaanList = async () => {
    setLoadingPenerimaan(true);
    const res = await getPenerimaanViewAction();
    setPenerimaanList(res);
    setLoadingPenerimaan(false);
  };

  const reloadAll = () => {
    fetchPengadaanList();
    fetchPenerimaanList();
  };

  useEffect(() => {
    reloadAll();
  }, []);

  // Buka Modal Terima Barang langsung dari Pengadaan yang dipilih
  const handleOpenReceive = async (record: PengadaanPenerimaanProgressView) => {
    setSelectedPengadaan(record);
    setIsReceiveModalOpen(true);
    setLoadingReceiveItems(true);

    const items = await getDetailPengadaanForPenerimaanAction(record.id_pengadaan);

    // Format item: default jumlah_terima adalah sisa_belum_diterima
    const formatted: ReceivingItemRow[] = items.map((item) => {
      const defaultQty = Math.max(0, item.sisa_belum_diterima);
      return {
        ...item,
        jumlah_terima: defaultQty,
        harga_satuan_terima: item.harga_satuan,
        sub_total_terima: defaultQty * item.harga_satuan,
      };
    });

    setReceivingItems(formatted);
    setLoadingReceiveItems(false);
  };

  const handleQtyChange = (idDetail: number, qty: number | null) => {
    const val = qty || 0;
    setReceivingItems((prev) =>
      prev.map((item) => {
        if (item.id_detail_pengadaan === idDetail) {
          const clamped = Math.max(0, Math.min(val, item.sisa_belum_diterima));
          return {
            ...item,
            jumlah_terima: clamped,
            sub_total_terima: clamped * item.harga_satuan_terima,
          };
        }
        return item;
      })
    );
  };

  const handlePriceChange = (idDetail: number, price: number | null) => {
    const val = price || 0;
    setReceivingItems((prev) =>
      prev.map((item) => {
        if (item.id_detail_pengadaan === idDetail) {
          return {
            ...item,
            harga_satuan_terima: val,
            sub_total_terima: val * item.jumlah_terima,
          };
        }
        return item;
      })
    );
  };

  const handleSetAllRemaining = () => {
    setReceivingItems((prev) =>
      prev.map((item) => ({
        ...item,
        jumlah_terima: Math.max(0, item.sisa_belum_diterima),
        sub_total_terima: Math.max(0, item.sisa_belum_diterima) * item.harga_satuan_terima,
      }))
    );
  };

  const handleResetAllZero = () => {
    setReceivingItems((prev) =>
      prev.map((item) => ({
        ...item,
        jumlah_terima: 0,
        sub_total_terima: 0,
      }))
    );
  };

  const calculateTotalQtyTerima = () =>
    receivingItems.reduce((acc, curr) => acc + curr.jumlah_terima, 0);

  const calculateTotalNilaiTerima = () =>
    receivingItems.reduce((acc, curr) => acc + curr.sub_total_terima, 0);

  const handleSubmitReceive = async () => {
    if (!selectedPengadaan) return;

    const itemsToSave = receivingItems
      .filter((i) => i.jumlah_terima > 0)
      .map((i) => ({
        idbarang: i.id_barang,
        nama_barang: i.nama_barang,
        jumlah_terima: i.jumlah_terima,
        harga_satuan_terima: i.harga_satuan_terima,
      }));

    if (itemsToSave.length === 0) {
      messageApi.error('Masukkan minimal 1 barang dengan jumlah terima lebih dari 0');
      return;
    }

    setSubmittingReceive(true);
    const res = await createPenerimaanAction({
      idpengadaan: selectedPengadaan.id_pengadaan,
      items: itemsToSave,
    });
    setSubmittingReceive(false);

    if (res.success) {
      messageApi.success(res.message);
      setIsReceiveModalOpen(false);
      reloadAll();
    } else {
      messageApi.error(res.message);
    }
  };

  // Buka Modal Detail Riwayat Penerimaan (Surat Jalan)
  const handleViewDetailPenerimaan = async (record: PenerimaanView) => {
    setSelectedPenerimaan(record);
    setIsDetailPenerimaanOpen(true);
    setLoadingDetailPenerimaan(true);
    const details = await getDetailPenerimaanViewAction(record.id_penerimaan);
    setDetailPenerimaanItems(details);
    setLoadingDetailPenerimaan(false);
  };

  // Buka Modal Detail PO Pengadaan
  const handleViewPODetail = async (record: PengadaanPenerimaanProgressView) => {
    setSelectedPO(record);
    setIsDetailPOOpen(true);
    setLoadingDetailPO(true);
    const details = await getDetailPengadaanViewAction(record.id_pengadaan);
    setDetailPOItems(details);
    setLoadingDetailPO(false);
  };

  // Kolom Tabel Pengadaan (Aksi Penerimaan Barang)
  const columnsPengadaan: ColumnsType<PengadaanPenerimaanProgressView> = [
    {
      title: 'No. PO',
      dataIndex: 'id_pengadaan',
      key: 'id_pengadaan',
      width: 90,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Tanggal PO',
      dataIndex: 'tanggal_pengadaan',
      key: 'tanggal_pengadaan',
      width: 160,
      render: (tgl) => <Text>{formatTanggal(tgl)}</Text>,
    },
    {
      title: 'Vendor',
      dataIndex: 'nama_vendor',
      key: 'nama_vendor',
      render: (nama: string, record) => (
        <Flex vertical gap={2}>
          <Text strong>{nama}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.badan_hukum === 'Y' || record.badan_hukum === '1'
              ? 'Badan Hukum (PT/CV)'
              : 'Perorangan'}
          </Text>
        </Flex>
      ),
    },
    {
      title: 'Total Nilai PO',
      dataIndex: 'total_nilai',
      key: 'total_nilai',
      width: 140,
      render: (val: number) => <Text strong>{formatRupiah(val)}</Text>,
    },
    {
      title: 'Progress Penerimaan',
      key: 'progress',
      width: 210,
      render: (_, r) => {
        const pct =
          r.total_item_pesan > 0
            ? Math.round((r.total_item_terima / r.total_item_pesan) * 100)
            : 0;
        return (
          <Flex vertical gap={4} style={{ width: '100%' }}>
            <Flex justify="space-between" style={{ fontSize: 12 }}>
              <Text type="secondary">
                {r.total_item_terima} / {r.total_item_pesan} item
              </Text>
              <Text strong>{pct}%</Text>
            </Flex>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={pct >= 100 ? '#16a34a' : '#0284c7'}
            />
          </Flex>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string, r) => {
        if (status === 'S' || r.sisa_item <= 0) {
          return (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              Selesai Lengkap
            </Tag>
          );
        }
        if (r.total_item_terima > 0) {
          return (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              Parsial ({r.sisa_item} sisa)
            </Tag>
          );
        }
        return (
          <Tag color="processing" icon={<ShoppingOutlined />}>
            Menunggu Kiriman
          </Tag>
        );
      },
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 200,
      align: 'right',
      render: (_, record) => {
        const isCompleted = record.status === 'S' || record.sisa_item <= 0;
        return (
          <Flex justify="flex-end" gap={6}>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewPODetail(record)}
            >
              Detail PO
            </Button>
            {!isCompleted ? (
              <Button
                size="small"
                type="primary"
                icon={<InboxOutlined />}
                onClick={() => handleOpenReceive(record)}
              >
                Terima Barang
              </Button>
            ) : (
              <Tag color="default" style={{ margin: 0, padding: '2px 8px' }}>
                Lengkap
              </Tag>
            )}
          </Flex>
        );
      },
    },
  ];

  // Kolom Tabel Riwayat Penerimaan (Surat Jalan)
  const columnsPenerimaan: ColumnsType<PenerimaanView> = [
    {
      title: 'ID Terima',
      dataIndex: 'id_penerimaan',
      key: 'id_penerimaan',
      width: 110,
      render: (id: number) => <Text strong>#PN-{id}</Text>,
    },
    {
      title: 'Waktu Terima',
      dataIndex: 'tanggal_penerimaan',
      key: 'tanggal_penerimaan',
      width: 170,
      render: (tgl) => <Text>{formatTanggal(tgl)}</Text>,
    },
    {
      title: 'Ref Pengadaan',
      dataIndex: 'id_pengadaan',
      key: 'id_pengadaan',
      width: 130,
      render: (idPengadaan: number) => (
        <Tag color="blue">PO #{idPengadaan}</Tag>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'nama_vendor',
      key: 'nama_vendor',
      render: (vendor: string) => <Text strong>{vendor}</Text>,
    },
    {
      title: 'Diterima Oleh',
      dataIndex: 'diterima_oleh',
      key: 'diterima_oleh',
      width: 140,
      render: (user: string) => <Tag>{user}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: () => <Tag color="success">Diterima</Tag>,
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetailPenerimaan(record)}
        >
          Lihat Item
        </Button>
      ),
    },
  ];

  const pendingPengadaanCount = pengadaanList.filter(
    (p) => p.status !== 'S' && p.sisa_item > 0
  ).length;

  return (
    <Flex vertical gap={20}>
      {contextHolder}

      {/* Header Halaman */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Flex vertical gap={2}>
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            Penerimaan Barang Masuk (Bertahap)
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Penerimaan dilakukan berdasarkan Pengadaan. Stok barang otomatis tercatat ke <Text code>kartu_stok</Text> via Database Trigger.
          </Text>
        </Flex>

        <Flex gap={8} align="center">
          <Button
            icon={<ReloadOutlined />}
            onClick={reloadAll}
            loading={loadingPengadaan || loadingPenerimaan}
          >
            Refresh Data
          </Button>
        </Flex>
      </Flex>

      {/* Tab Konten Utama */}
      <Card
        style={{
          border: '1px solid #e4e4e7',
          boxShadow: 'none',
        }}
        styles={{ body: { padding: '8px 16px 16px 16px' } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pengadaan',
              label: (
                <Flex align="center" gap={8}>
                  <ShoppingOutlined />
                  <span>Daftar Pengadaan (Untuk Diterima)</span>
                  {pendingPengadaanCount > 0 && (
                    <Badge
                      count={pendingPengadaanCount}
                      style={{ backgroundColor: '#0284c7' }}
                    />
                  )}
                </Flex>
              ),
              children: (
                <Flex vertical gap={12} style={{ marginTop: 8 }}>
                  <Table
                    columns={columnsPengadaan}
                    dataSource={pengadaanList}
                    rowKey="id_pengadaan"
                    loading={loadingPengadaan}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} pengadaan`,
                    }}
                  />
                </Flex>
              ),
            },
            {
              key: 'riwayat',
              label: (
                <Flex align="center" gap={8}>
                  <FileDoneOutlined />
                  <span>Riwayat Surat Penerimaan</span>
                  <Badge
                    count={penerimaanList.length}
                    style={{ backgroundColor: '#64748b' }}
                  />
                </Flex>
              ),
              children: (
                <Flex vertical gap={12} style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Daftar bukti penerimaan barang masuk yang telah tercatat ke dalam database kartu stok.
                  </Text>
                  <Table
                    columns={columnsPenerimaan}
                    dataSource={penerimaanList}
                    rowKey="id_penerimaan"
                    loading={loadingPenerimaan}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} riwayat penerimaan`,
                    }}
                  />
                </Flex>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Terima Barang Bertahap */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <InboxOutlined style={{ color: '#0284c7', fontSize: 18 }} />
            <span>
              Penerimaan Barang: PO #{selectedPengadaan?.id_pengadaan} - {selectedPengadaan?.nama_vendor}
            </span>
          </Flex>
        }
        open={isReceiveModalOpen}
        onCancel={() => setIsReceiveModalOpen(false)}
        onOk={handleSubmitReceive}
        confirmLoading={submittingReceive}
        okText="Konfirmasi Terima Barang"
        cancelText="Batal"
        width={900}
        destroyOnHidden
      >
        {selectedPengadaan && (
          <Flex vertical gap={16} style={{ marginTop: 12 }}>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 3 }}
              items={[
                {
                  key: 'po',
                  label: 'Nomor PO',
                  children: <Text strong>#{selectedPengadaan.id_pengadaan}</Text>,
                },
                {
                  key: 'vendor',
                  label: 'Vendor',
                  children: selectedPengadaan.nama_vendor,
                },
                {
                  key: 'tgl',
                  label: 'Tanggal PO',
                  children: formatTanggal(selectedPengadaan.tanggal_pengadaan),
                },
                {
                  key: 'dibuat',
                  label: 'Dibuat Oleh',
                  children: selectedPengadaan.dibuat_oleh,
                },
                {
                  key: 'total',
                  label: 'Total Nilai PO',
                  children: formatRupiah(selectedPengadaan.total_nilai),
                },
                {
                  key: 'progress',
                  label: 'Status Saat Ini',
                  children: (
                    <Text strong>
                      {selectedPengadaan.total_item_terima} / {selectedPengadaan.total_item_pesan} item (
                      {selectedPengadaan.sisa_item} sisa)
                    </Text>
                  ),
                },
              ]}
            />

            <Alert
              type="success"
              showIcon
              message={
                <Flex vertical gap={2}>
                  <Text strong>Dukungan Penerimaan Bertahap</Text>
                  <Text style={{ fontSize: 12 }}>
                    Masukkan jumlah fisik barang yang Anda terima pada tahap ini. Database Stored Procedure (
                    <Text code>sp_tambah_detail_penerimaan</Text>) dan Trigger (
                    <Text code>trg_after_insert_detail_penerimaan</Text>) akan otomatis menambah stok masuk ke{' '}
                    <Text code>kartu_stok</Text> serta mengubah status PO menjadi Selesai jika seluruh barang terpenuhi.
                  </Text>
                </Flex>
              }
            />

            <Flex justify="space-between" align="center">
              <Text strong style={{ fontSize: 14 }}>
                Konfirmasi Item Diterima Tahap Ini:
              </Text>
              <Flex gap={8}>
                <Button size="small" onClick={handleSetAllRemaining}>
                  Terima Semua Sisa
                </Button>
                <Button size="small" onClick={handleResetAllZero}>
                  Reset Qty ke 0
                </Button>
              </Flex>
            </Flex>

            <Table
              size="small"
              bordered
              loading={loadingReceiveItems}
              dataSource={receivingItems}
              rowKey="id_detail_pengadaan"
              pagination={false}
              columns={[
                {
                  title: 'No',
                  width: 45,
                  render: (_, __, idx) => idx + 1,
                },
                {
                  title: 'Barang & Satuan',
                  dataIndex: 'nama_barang',
                  key: 'nama_barang',
                  render: (nama, r) => (
                    <Flex vertical>
                      <Text strong>{nama}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Satuan: {r.nama_satuan} | ID #{r.id_barang}
                      </Text>
                    </Flex>
                  ),
                },
                {
                  title: 'Pesan',
                  dataIndex: 'jumlah_pesan',
                  key: 'jumlah_pesan',
                  width: 75,
                  align: 'center',
                },
                {
                  title: 'Sudah Diterima',
                  dataIndex: 'sudah_diterima',
                  key: 'sudah_diterima',
                  width: 105,
                  align: 'center',
                  render: (val) => (
                    <Text style={{ color: val > 0 ? '#0284c7' : '#71717a' }}>{val}</Text>
                  ),
                },
                {
                  title: 'Sisa Belum',
                  dataIndex: 'sisa_belum_diterima',
                  key: 'sisa_belum_diterima',
                  width: 95,
                  align: 'center',
                  render: (val) =>
                    val > 0 ? (
                      <Tag color="orange" style={{ margin: 0 }}>
                        {val}
                      </Tag>
                    ) : (
                      <Tag color="success" style={{ margin: 0 }}>
                        Lengkap
                      </Tag>
                    ),
                },
                {
                  title: (
                    <Tooltip title="Jumlah barang yang diterima pada pengiriman ini">
                      <span>Qty Terima Sekarang</span>
                    </Tooltip>
                  ),
                  dataIndex: 'jumlah_terima',
                  key: 'jumlah_terima',
                  width: 130,
                  render: (_, r) => (
                    <InputNumber
                      min={0}
                      max={r.sisa_belum_diterima}
                      value={r.jumlah_terima}
                      disabled={r.sisa_belum_diterima <= 0}
                      onChange={(val) => handleQtyChange(r.id_detail_pengadaan, val)}
                      style={{ width: '100%' }}
                    />
                  ),
                },
                {
                  title: 'Harga Satuan',
                  dataIndex: 'harga_satuan_terima',
                  key: 'harga_satuan_terima',
                  width: 130,
                  render: (_, r) => (
                    <InputNumber
                      min={0}
                      value={r.harga_satuan_terima}
                      onChange={(val) => handlePriceChange(r.id_detail_pengadaan, val)}
                      style={{ width: '100%' }}
                      formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    />
                  ),
                },
                {
                  title: 'Subtotal',
                  dataIndex: 'sub_total_terima',
                  key: 'sub_total_terima',
                  width: 130,
                  render: (val) => <Text strong>{formatRupiah(val)}</Text>,
                },
              ]}
            />

            {/* Rekapitulasi Tahap Ini */}
            <Card
              size="small"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
              }}
            >
              <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex align="center" gap={12}>
                  <Text type="secondary">Total Qty Diterima Tahap Ini:</Text>
                  <Tag color="blue" style={{ fontSize: 14, padding: '2px 8px' }}>
                    {calculateTotalQtyTerima()} Item
                  </Tag>
                </Flex>
                <Flex align="center" gap={12}>
                  <Text type="secondary">Total Nilai Diterima Tahap Ini:</Text>
                  <Text strong style={{ fontSize: 16, color: '#16a34a' }}>
                    {formatRupiah(calculateTotalNilaiTerima())}
                  </Text>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        )}
      </Modal>

      {/* Modal Detail Riwayat Penerimaan (Surat Jalan) */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <FileDoneOutlined />
            <span>Detail Bukti Penerimaan #PN-{selectedPenerimaan?.id_penerimaan}</span>
          </Flex>
        }
        open={isDetailPenerimaanOpen}
        onCancel={() => setIsDetailPenerimaanOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailPenerimaanOpen(false)}>
            Tutup
          </Button>,
        ]}
        width={750}
      >
        {selectedPenerimaan && (
          <Flex vertical gap={16} style={{ marginTop: 12 }}>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'vendor',
                  label: 'Vendor',
                  children: selectedPenerimaan.nama_vendor,
                },
                {
                  key: 'id_pengadaan',
                  label: 'Ref Pengadaan',
                  children: `Pengadaan #${selectedPenerimaan.id_pengadaan}`,
                },
                {
                  key: 'tanggal_penerimaan',
                  label: 'Tanggal Penerimaan',
                  children: formatTanggal(selectedPenerimaan.tanggal_penerimaan),
                },
                {
                  key: 'diterima_oleh',
                  label: 'Diterima Oleh',
                  children: selectedPenerimaan.diterima_oleh,
                },
                {
                  key: 'status',
                  label: 'Status',
                  children: <Tag color="success">Diterima</Tag>,
                },
              ]}
            />

            <Flex vertical gap={6}>
              <Text strong style={{ fontSize: 13 }}>
                Item Barang Masuk (View: <Text code>vu_detail_penerimaan</Text>)
              </Text>
              <Table
                size="small"
                bordered
                loading={loadingDetailPenerimaan}
                dataSource={detailPenerimaanItems}
                rowKey="id_detail_penerimaan"
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
                    title: 'Jumlah Terima',
                    dataIndex: 'jumlah_terima',
                    key: 'jumlah_terima',
                    width: 110,
                    align: 'center',
                    render: (val) => <Text strong>{val}</Text>,
                  },
                  {
                    title: 'Harga Satuan Terima',
                    dataIndex: 'harga_satuan_terima',
                    key: 'harga_satuan_terima',
                    width: 140,
                    render: (val) => formatRupiah(val),
                  },
                  {
                    title: 'Subtotal Terima',
                    dataIndex: 'sub_total_terima',
                    key: 'sub_total_terima',
                    width: 140,
                    render: (val) => <Text strong>{formatRupiah(val)}</Text>,
                  },
                ]}
              />
            </Flex>
          </Flex>
        )}
      </Modal>

      {/* Modal Detail PO Pengadaan */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <ShoppingOutlined />
            <span>Detail Pengadaan PO #{selectedPO?.id_pengadaan}</span>
          </Flex>
        }
        open={isDetailPOOpen}
        onCancel={() => setIsDetailPOOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailPOOpen(false)}>
            Tutup
          </Button>,
        ]}
        width={750}
      >
        {selectedPO && (
          <Flex vertical gap={16} style={{ marginTop: 12 }}>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'vendor',
                  label: 'Vendor',
                  children: selectedPO.nama_vendor,
                },
                {
                  key: 'dibuat_oleh',
                  label: 'Dibuat Oleh',
                  children: selectedPO.dibuat_oleh,
                },
                {
                  key: 'tanggal',
                  label: 'Tanggal PO',
                  children: formatTanggal(selectedPO.tanggal_pengadaan),
                },
                {
                  key: 'status',
                  label: 'Status',
                  children:
                    selectedPO.status === 'S' || selectedPO.sisa_item <= 0 ? (
                      <Tag color="success">Selesai Lengkap</Tag>
                    ) : (
                      <Tag color="processing">Menunggu / Parsial</Tag>
                    ),
                },
                {
                  key: 'subtotal',
                  label: 'Subtotal Nilai',
                  children: formatRupiah(selectedPO.subtotal_nilai),
                },
                {
                  key: 'ppn',
                  label: 'PPN (11%)',
                  children: formatRupiah(selectedPO.ppn),
                },
                {
                  key: 'total',
                  label: 'Total Nilai PO',
                  children: (
                    <Text strong style={{ color: '#16a34a', fontSize: 15 }}>
                      {formatRupiah(selectedPO.total_nilai)}
                    </Text>
                  ),
                },
              ]}
            />

            <Flex vertical gap={6}>
              <Text strong style={{ fontSize: 13 }}>
                Item Barang Pengadaan (View: <Text code>vu_detail_pengadaan</Text>)
              </Text>
              <Table
                size="small"
                bordered
                loading={loadingDetailPO}
                dataSource={detailPOItems}
                rowKey="id_detail_pengadaan"
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
                    width: 120,
                    render: (val) => formatRupiah(val),
                  },
                  {
                    title: 'Qty Pesan',
                    dataIndex: 'jumlah',
                    key: 'jumlah',
                    width: 80,
                    align: 'center',
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'sub_total',
                    key: 'sub_total',
                    width: 130,
                    render: (val) => <Text strong>{formatRupiah(val)}</Text>,
                  },
                ]}
              />
            </Flex>
          </Flex>
        )}
      </Modal>
    </Flex>
  );
}
