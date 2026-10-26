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
  Popconfirm,
  Tag,
  message,
  Divider,
  Descriptions,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  PengadaanView,
  DetailPengadaanView,
  VendorView,
  BarangView,
} from '@/types/database';
import {
  getPengadaanViewAction,
  getDetailPengadaanViewAction,
  createPengadaanAction,
  cancelPengadaanAction,
} from '@/actions/pengadaan.actions';
import { getVendorViewAction } from '@/actions/vendor.actions';
import { getBarangViewAction } from '@/actions/barang.actions';
import { formatRupiah, formatTanggal } from '@/lib/format';

const { Title, Text } = Typography;

interface ItemRow {
  key: string;
  idbarang: number;
  nama_barang: string;
  nama_satuan: string;
  harga_satuan: number;
  jumlah: number;
  sub_total: number;
}

export default function PengadaanPage() {
  const [data, setData] = useState<PengadaanView[]>([]);
  const [vendors, setVendors] = useState<VendorView[]>([]);
  const [barangs, setBarangs] = useState<BarangView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
  const [ppnPercent, setPpnPercent] = useState<number>(11);

  // Modal Detail
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedPengadaan, setSelectedPengadaan] = useState<PengadaanView | null>(null);
  const [detailItems, setDetailItems] = useState<DetailPengadaanView[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchPengadaanList = async () => {
    setLoading(true);
    const res = await getPengadaanViewAction();
    setData(res);
    setLoading(false);
  };

  const loadMasterData = async () => {
    const [vList, bList] = await Promise.all([
      getVendorViewAction(true),
      getBarangViewAction(true),
    ]);
    setVendors(vList);
    setBarangs(bList);
  };

  useEffect(() => {
    fetchPengadaanList();
    loadMasterData();
  }, []);

  const handleOpenCreate = () => {
    form.resetFields();
    setSelectedVendor(null);
    setPpnPercent(11);
    setItems([
      {
        key: 'item-' + Date.now(),
        idbarang: 0,
        nama_barang: '',
        nama_satuan: '',
        harga_satuan: 0,
        jumlah: 1,
        sub_total: 0,
      },
    ]);
    setIsCreateOpen(true);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: 'item-' + (Date.now() + Math.random()),
        idbarang: 0,
        nama_barang: '',
        nama_satuan: '',
        harga_satuan: 0,
        jumlah: 1,
        sub_total: 0,
      },
    ]);
  };

  const handleRemoveItem = (key: string) => {
    if (items.length <= 1) {
      messageApi.warning('Minimal harus ada 1 barang dalam pengadaan');
      return;
    }
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const handleItemBarangChange = (key: string, idbarang: number) => {
    const selected = barangs.find((b) => b.id_barang === idbarang);
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const harga = selected ? selected.harga : 0;
          return {
            ...item,
            idbarang,
            nama_barang: selected ? selected.nama_barang : '',
            nama_satuan: selected ? selected.nama_satuan : '',
            harga_satuan: harga,
            sub_total: harga * item.jumlah,
          };
        }
        return item;
      })
    );
  };

  const handleItemQtyChange = (key: string, jumlah: number | null) => {
    const qty = jumlah || 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return {
            ...item,
            jumlah: qty,
            sub_total: item.harga_satuan * qty,
          };
        }
        return item;
      })
    );
  };

  const handleItemPriceChange = (key: string, harga: number | null) => {
    const price = harga || 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return {
            ...item,
            harga_satuan: price,
            sub_total: price * item.jumlah,
          };
        }
        return item;
      })
    );
  };

  const calculateSubtotal = () =>
    items.reduce((acc, curr) => acc + curr.sub_total, 0);

  const calculatePpn = () =>
    Math.round(calculateSubtotal() * (ppnPercent / 100));

  const calculateTotal = () => calculateSubtotal() + calculatePpn();

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      const validItems = items.filter((i) => i.idbarang > 0 && i.jumlah > 0);

      if (validItems.length === 0) {
        messageApi.error('Pilih minimal 1 barang dengan jumlah valid');
        return;
      }

      setSubmitting(true);
      const res = await createPengadaanAction({
        idvendor: values.idvendor,
        ppn_percent: ppnPercent,
        items: validItems.map((i) => ({
          idbarang: i.idbarang,
          harga_satuan: i.harga_satuan,
          jumlah: i.jumlah,
        })),
      });
      setSubmitting(false);

      if (res.success) {
        messageApi.success(res.message);
        setIsCreateOpen(false);
        fetchPengadaanList();
      } else {
        messageApi.error(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetail = async (record: PengadaanView) => {
    setSelectedPengadaan(record);
    setIsDetailOpen(true);
    setDetailLoading(true);
    const details = await getDetailPengadaanViewAction(record.id_pengadaan);
    setDetailItems(details);
    setDetailLoading(false);
  };

  const handleCancel = async (idPengadaan: number) => {
    const res = await cancelPengadaanAction(idPengadaan);
    if (res.success) {
      messageApi.success(res.message);
      fetchPengadaanList();
    } else {
      messageApi.error(res.message);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'S':
        return <Tag color="success">Selesai (Diterima)</Tag>;
      case 'B':
        return <Tag color="error">Dibatalkan</Tag>;
      case 'P':
      default:
        return <Tag color="processing">Menunggu Penerimaan</Tag>;
    }
  };

  const columns: ColumnsType<PengadaanView> = [
    {
      title: 'ID',
      dataIndex: 'id_pengadaan',
      key: 'id_pengadaan',
      width: 80,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggal_pengadaan',
      key: 'tanggal_pengadaan',
      width: 170,
      render: (tgl) => <Text>{formatTanggal(tgl)}</Text>,
    },
    {
      title: 'Vendor',
      dataIndex: 'nama_vendor',
      key: 'nama_vendor',
      render: (nama: string, record) => (
        <Flex vertical gap={2}>
          <Text strong>{nama}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Badan Hukum:{' '}
            {record.badan_hukum === 'Y' || record.badan_hukum === '1'
              ? 'Ya'
              : 'Tidak'}
          </Text>
        </Flex>
      ),
    },
    {
      title: 'Dibuat Oleh',
      dataIndex: 'dibuat_oleh',
      key: 'dibuat_oleh',
      width: 130,
      render: (user: string) => <Tag>{user}</Tag>,
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
      title: 'Total Nilai',
      dataIndex: 'total_nilai',
      key: 'total_nilai',
      width: 140,
      render: (val: number) => <Text strong>{formatRupiah(val)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: string) => renderStatus(status),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 170,
      align: 'right',
      render: (_, record) => (
        <Flex justify="flex-end" gap={8}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Detail
          </Button>
          {record.status === 'P' && (
            <Popconfirm
              title="Batalkan Pengadaan"
              description={`Yakin ingin membatalkan Pengadaan #${record.id_pengadaan}?`}
              onConfirm={() => handleCancel(record.id_pengadaan)}
              okText="Batalkan"
              cancelText="Tutup"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<CloseCircleOutlined />}>
                Batal
              </Button>
            </Popconfirm>
          )}
        </Flex>
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
            Transaksi Pengadaan
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber Data: Database View <Text code>vu_pengadaan</Text> & <Text code>vu_detail_pengadaan</Text>
          </Text>
        </Flex>

        <Flex gap={8} align="center">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPengadaanList}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Buat Pengadaan
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Pengadaan */}
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
          rowKey="id_pengadaan"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} data pengadaan`,
          }}
        />
      </Card>

      {/* Modal Detail Pengadaan */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <FileTextOutlined />
            <span>Detail Pengadaan #{selectedPengadaan?.id_pengadaan}</span>
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
        {selectedPengadaan && (
          <Flex vertical gap={16} style={{ marginTop: 12 }}>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'vendor',
                  label: 'Vendor',
                  children: selectedPengadaan.nama_vendor,
                },
                {
                  key: 'dibuat_oleh',
                  label: 'Dibuat Oleh',
                  children: selectedPengadaan.dibuat_oleh,
                },
                {
                  key: 'tanggal',
                  label: 'Tanggal',
                  children: formatTanggal(selectedPengadaan.tanggal_pengadaan),
                },
                {
                  key: 'status',
                  label: 'Status',
                  children: renderStatus(selectedPengadaan.status),
                },
                {
                  key: 'subtotal',
                  label: 'Subtotal Nilai',
                  children: formatRupiah(selectedPengadaan.subtotal_nilai),
                },
                {
                  key: 'ppn',
                  label: 'PPN (11%)',
                  children: formatRupiah(selectedPengadaan.ppn),
                },
                {
                  key: 'total',
                  label: 'Total Nilai',
                  children: (
                    <Text strong style={{ color: '#16a34a', fontSize: 15 }}>
                      {formatRupiah(selectedPengadaan.total_nilai)}
                    </Text>
                  ),
                },
              ]}
            />

            <Flex vertical gap={6}>
              <Text strong style={{ fontSize: 13 }}>
                Item Barang (View: <Text code>vu_detail_pengadaan</Text>)
              </Text>
              <Table
                size="small"
                bordered
                loading={detailLoading}
                dataSource={detailItems}
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
                    title: 'Qty',
                    dataIndex: 'jumlah',
                    key: 'jumlah',
                    width: 70,
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

      {/* Modal Buat Pengadaan Baru */}
      <Modal
        title="Buat Transaksi Pengadaan Baru"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={handleCreateSubmit}
        confirmLoading={submitting}
        okText="Simpan Pengadaan"
        cancelText="Batal"
        width={800}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Flex gap={16} wrap="wrap">
            <Form.Item
              name="idvendor"
              label="Pilih Vendor"
              rules={[{ required: true, message: 'Vendor wajib dipilih' }]}
              style={{ flex: 1, minWidth: 260 }}
            >
              <Select
                placeholder="Pilih Vendor penyedia barang"
                onChange={(val) => setSelectedVendor(val)}
                options={vendors.map((v) => ({
                  value: v.id_vendor,
                  label: `${v.nama_vendor} (${v.badan_hukum === 'Y' || v.badan_hukum === '1' ? 'Badan Hukum' : 'Perorangan'})`,
                }))}
              />
            </Form.Item>

            <Form.Item label="Tarif PPN (%)" style={{ width: 140 }}>
              <InputNumber
                min={0}
                max={100}
                value={ppnPercent}
                onChange={(val) => setPpnPercent(val || 0)}
                style={{ width: '100%' }}
                formatter={(val) => `${val}%`}
              />
            </Form.Item>
          </Flex>

          <Divider style={{ margin: '8px 0 16px 0' }} />

          <Flex vertical gap={12}>
            <Flex justify="space-between" align="center">
              <Text strong>Daftar Item Barang Pengadaan</Text>
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
              >
                Tambah Item
              </Button>
            </Flex>

            {items.map((item, idx) => (
              <Flex
                key={item.key}
                align="center"
                gap={10}
                style={{
                  backgroundColor: '#f9fafb',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #e4e4e7',
                }}
              >
                <Text style={{ width: 24, textAlign: 'center' }}>{idx + 1}</Text>

                <div style={{ flex: 2 }}>
                  <Select
                    placeholder="Pilih Barang"
                    style={{ width: '100%' }}
                    value={item.idbarang > 0 ? item.idbarang : undefined}
                    onChange={(val) => handleItemBarangChange(item.key, val)}
                    options={barangs.map((b) => ({
                      value: b.id_barang,
                      label: `${b.nama_barang} (${b.nama_satuan})`,
                    }))}
                  />
                </div>

                <div style={{ flex: 1.2 }}>
                  <InputNumber
                    placeholder="Harga Satuan"
                    style={{ width: '100%' }}
                    min={0}
                    value={item.harga_satuan}
                    onChange={(val) => handleItemPriceChange(item.key, val)}
                    formatter={(value) =>
                      `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                    }
                  />
                </div>

                <div style={{ width: 90 }}>
                  <InputNumber
                    placeholder="Qty"
                    min={1}
                    style={{ width: '100%' }}
                    value={item.jumlah}
                    onChange={(val) => handleItemQtyChange(item.key, val)}
                  />
                </div>

                <div style={{ width: 130, textAlign: 'right' }}>
                  <Text strong>{formatRupiah(item.sub_total)}</Text>
                </div>

                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveItem(item.key)}
                />
              </Flex>
            ))}

            {/* Rekapitulasi Biaya */}
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
                  <Text type="secondary">Subtotal:</Text>
                  <Text>{formatRupiah(calculateSubtotal())}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text type="secondary">PPN ({ppnPercent}%):</Text>
                  <Text>{formatRupiah(calculatePpn())}</Text>
                </Flex>
                <Divider style={{ margin: '4px 0' }} />
                <Flex justify="space-between" align="center">
                  <Text strong style={{ fontSize: 14 }}>
                    Total Nilai Pengadaan:
                  </Text>
                  <Text strong style={{ fontSize: 16, color: '#16a34a' }}>
                    {formatRupiah(calculateTotal())}
                  </Text>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        </Form>
      </Modal>
    </Flex>
  );
}
