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
  Input,
  InputNumber,
  Select,
  Popconfirm,
  Segmented,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { BarangView, SatuanView } from '@/types/database';
import {
  getBarangViewAction,
  createBarangAction,
  updateBarangAction,
  deleteBarangAction,
} from '@/actions/barang.actions';
import { getSatuanViewAction } from '@/actions/satuan.actions';

const { Title, Text } = Typography;

export default function MasterBarangPage() {
  const [data, setData] = useState<BarangView[]>([]);
  const [satuans, setSatuans] = useState<SatuanView[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'active'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBarang, setEditingBarang] = useState<BarangView | null>(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchAllData = async (mode: 'all' | 'active' = viewMode) => {
    setLoading(true);
    const [barangRes, satuanRes] = await Promise.all([
      getBarangViewAction(mode === 'active'),
      getSatuanViewAction(true), // Mengambil satuan aktif untuk pilihan dropdown
    ]);
    setData(barangRes);
    setSatuans(satuanRes);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData(viewMode);
  }, [viewMode]);

  const handleOpenCreate = () => {
    setEditingBarang(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: BarangView) => {
    setEditingBarang(record);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: {
    jenis: string;
    nama_barang: string;
    id_satuan: number;
    status: number;
    harga: number;
  }) => {
    setSubmitting(true);
    const res = editingBarang
      ? await updateBarangAction(editingBarang.id_barang, values)
      : await createBarangAction(values);
    setSubmitting(false);

    if (res.success) {
      messageApi.success(res.message);
      setIsModalOpen(false);
      fetchAllData(viewMode);
    } else {
      messageApi.error(res.message);
    }
  };

  const handleDelete = async (id_barang: number) => {
    const res = await deleteBarangAction(id_barang);
    if (res.success) {
      messageApi.success(res.message);
      fetchAllData(viewMode);
    } else {
      messageApi.error(res.message);
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const columns: ColumnsType<BarangView> = [
    {
      title: 'ID Barang',
      dataIndex: 'id_barang',
      key: 'id_barang',
      width: 110,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Nama Barang',
      dataIndex: 'nama_barang',
      key: 'nama_barang',
      render: (nama: string) => <Text strong>{nama}</Text>,
    },
    {
      title: 'Jenis',
      dataIndex: 'jenis',
      key: 'jenis',
      width: 100,
      render: (jenis: string) => <Text>{jenis}</Text>,
    },
    {
      title: 'Satuan',
      dataIndex: 'nama_satuan',
      key: 'nama_satuan',
      width: 120,
      render: (satuan: string) => <Text>{satuan}</Text>,
    },
    {
      title: 'Harga Satuan',
      dataIndex: 'harga',
      key: 'harga',
      width: 150,
      render: (harga: number) => <Text>{formatRupiah(harga)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number) =>
        status === 1 ? (
          <Text style={{ color: '#16a34a', fontWeight: 500 }}>Aktif</Text>
        ) : (
          <Text type="secondary">Nonaktif</Text>
        ),
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
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Hapus Barang"
            description={`Yakin ingin menghapus barang "${record.nama_barang}"?`}
            onConfirm={() => handleDelete(record.id_barang)}
            okText="Hapus"
            cancelText="Batal"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Hapus
            </Button>
          </Popconfirm>
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
            Master Barang
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber data: Complex View{' '}
            <Text code>
              {viewMode === 'active' ? 'vu_barang_aktif' : 'vu_barang'}
            </Text>
          </Text>
        </Flex>

        <Flex gap={8} align="center" wrap="wrap">
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'all' | 'active')}
            options={[
              { label: 'Semua (vu_barang)', value: 'all' },
              { label: 'Aktif (vu_barang_aktif)', value: 'active' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchAllData(viewMode)}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Tambah Barang
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Data Barang */}
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
          rowKey="id_barang"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            style: { padding: '0 20px' },
          }}
        />
      </Card>

      {/* Modal Tambah / Edit Barang */}
      <Modal
        title={editingBarang ? 'Edit Barang' : 'Tambah Barang Baru'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          preserve={false}
          initialValues={{
            nama_barang: editingBarang ? editingBarang.nama_barang : '',
            jenis: editingBarang ? editingBarang.jenis : 'A',
            id_satuan: editingBarang ? editingBarang.id_satuan : undefined,
            harga: editingBarang ? editingBarang.harga : 0,
            status: editingBarang ? editingBarang.status : 1,
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nama Barang"
            name="nama_barang"
            rules={[
              { required: true, message: 'Nama barang wajib diisi' },
              { max: 45, message: 'Maksimal 45 karakter' },
            ]}
          >
            <Input placeholder="Contoh: Indomie Goreng 85g" size="large" />
          </Form.Item>

          <Flex gap={12}>
            <Form.Item
              label="Jenis"
              name="jenis"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Jenis wajib diisi' }]}
            >
              <Input placeholder="Misal: A" size="large" maxLength={1} />
            </Form.Item>

            <Form.Item
              label="Satuan"
              name="id_satuan"
              style={{ flex: 2 }}
              rules={[{ required: true, message: 'Satuan wajib dipilih' }]}
            >
              <Select
                placeholder="Pilih satuan"
                size="large"
                options={satuans.map((s) => ({
                  value: s.ID_SATUAN,
                  label: s.NAMA_SATUAN,
                }))}
              />
            </Form.Item>
          </Flex>

          <Flex gap={12}>
            <Form.Item
              label="Harga Satuan (Rp)"
              name="harga"
              style={{ flex: 2 }}
              rules={[{ required: true, message: 'Harga wajib diisi' }]}
            >
              <InputNumber<number>
                style={{ width: '100%' }}
                size="large"
                min={0}
                formatter={(val) =>
                  `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                }
                parser={(val) =>
                  val ? Number(val.replace(/\./g, '')) : 0
                }
                placeholder="0"
              />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              style={{ flex: 1 }}
              rules={[{ required: true, message: 'Status wajib dipilih' }]}
            >
              <Select
                size="large"
                options={[
                  { value: 1, label: 'Aktif' },
                  { value: 0, label: 'Nonaktif' },
                ]}
              />
            </Form.Item>
          </Flex>

          <Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
            <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingBarang ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </Flex>
  );
}