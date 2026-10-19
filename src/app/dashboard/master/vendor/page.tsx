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
import { VendorView } from '@/types/database';
import {
  getVendorViewAction,
  createVendorAction,
  updateVendorAction,
  deleteVendorAction,
} from '@/actions/vendor.actions';

const { Title, Text } = Typography;

export default function MasterVendorPage() {
  const [data, setData] = useState<VendorView[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'active'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVendor, setEditingVendor] = useState<VendorView | null>(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchVendors = async (mode: 'all' | 'active' = viewMode) => {
    setLoading(true);
    const res = await getVendorViewAction(mode === 'active');
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors(viewMode);
  }, [viewMode]);

  const handleOpenCreate = () => {
    setEditingVendor(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: VendorView) => {
    setEditingVendor(record);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: {
    nama_vendor: string;
    badan_hukum: string;
    status: string;
  }) => {
    setSubmitting(true);
    const res = editingVendor
      ? await updateVendorAction(editingVendor.id_vendor, values)
      : await createVendorAction(values);
    setSubmitting(false);

    if (res.success) {
      messageApi.success(res.message);
      setIsModalOpen(false);
      fetchVendors(viewMode);
    } else {
      messageApi.error(res.message);
    }
  };

  const handleDelete = async (id_vendor: number) => {
    const res = await deleteVendorAction(id_vendor);
    if (res.success) {
      messageApi.success(res.message);
      fetchVendors(viewMode);
    } else {
      messageApi.error(res.message);
    }
  };

  const columns: ColumnsType<VendorView> = [
    {
      title: 'ID Vendor',
      dataIndex: 'id_vendor',
      key: 'id_vendor',
      width: 120,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Nama Vendor',
      dataIndex: 'nama_vendor',
      key: 'nama_vendor',
      render: (nama: string) => <Text strong>{nama}</Text>,
    },
    {
      title: 'Badan Hukum',
      dataIndex: 'badan_hukum',
      key: 'badan_hukum',
      width: 150,
      render: (bh: string) => (
        <Text>{bh === 'Y' || bh === '1' ? 'Ya' : 'Tidak'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) =>
        status === '1' || status === 'Y' ? (
          <Text style={{ color: '#16a34a', fontWeight: 500 }}>Aktif</Text>
        ) : (
          <Text type="secondary">Nonaktif</Text>
        ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 180,
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
            title="Hapus Vendor"
            description={`Yakin ingin menghapus vendor "${record.nama_vendor}"?`}
            onConfirm={() => handleDelete(record.id_vendor)}
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
            Master Vendor
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber data: Simple View{' '}
            <Text code>
              {viewMode === 'active' ? 'vu_vendor_aktif' : 'vu_vendor'}
            </Text>
          </Text>
        </Flex>

        <Flex gap={8} align="center" wrap="wrap">
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'all' | 'active')}
            options={[
              { label: 'Semua (vu_vendor)', value: 'all' },
              { label: 'Aktif (vu_vendor_aktif)', value: 'active' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchVendors(viewMode)}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Tambah Vendor
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Data Vendor */}
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
          rowKey="id_vendor"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            style: { padding: '0 20px' },
          }}
        />
      </Card>

      {/* Modal Tambah / Edit Vendor */}
      <Modal
        title={editingVendor ? 'Edit Vendor' : 'Tambah Vendor Baru'}
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
            nama_vendor: editingVendor ? editingVendor.nama_vendor : '',
            badan_hukum: editingVendor ? editingVendor.badan_hukum : 'Y',
            status: editingVendor ? editingVendor.status : '1',
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nama Vendor"
            name="nama_vendor"
            rules={[
              { required: true, message: 'Nama vendor wajib diisi' },
              { max: 100, message: 'Maksimal 100 karakter' },
            ]}
          >
            <Input placeholder="Contoh: PT Sumber Makmur" size="large" />
          </Form.Item>

          <Form.Item
            label="Badan Hukum"
            name="badan_hukum"
            rules={[{ required: true, message: 'Badan hukum wajib dipilih' }]}
          >
            <Select
              size="large"
              options={[
                { value: 'Y', label: 'Ya (Berbadan Hukum)' },
                { value: 'N', label: 'Tidak (Non-Badan Hukum)' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Status wajib dipilih' }]}
          >
            <Select
              size="large"
              options={[
                { value: '1', label: 'Aktif' },
                { value: '0', label: 'Nonaktif' },
              ]}
            />
          </Form.Item>

          <Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
            <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingVendor ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </Flex>
  );
}