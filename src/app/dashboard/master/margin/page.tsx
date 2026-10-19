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
import { MarginPenjualanView } from '@/types/database';
import {
  getMarginViewAction,
  createMarginAction,
  updateMarginAction,
  deleteMarginAction,
} from '@/actions/margin.actions';

const { Title, Text } = Typography;

export default function MasterMarginPage() {
  const [data, setData] = useState<MarginPenjualanView[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'active'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMargin, setEditingMargin] =
    useState<MarginPenjualanView | null>(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchMargin = async (mode: 'all' | 'active' = viewMode) => {
    setLoading(true);
    const res = await getMarginViewAction(mode === 'active');
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchMargin(viewMode);
  }, [viewMode]);

  const handleOpenCreate = () => {
    setEditingMargin(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: MarginPenjualanView) => {
    setEditingMargin(record);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: { persen: number; status: number }) => {
    setSubmitting(true);
    const res = editingMargin
      ? await updateMarginAction(editingMargin.id_margin, values)
      : await createMarginAction(values);
    setSubmitting(false);

    if (res.success) {
      messageApi.success(res.message);
      setIsModalOpen(false);
      fetchMargin(viewMode);
    } else {
      messageApi.error(res.message);
    }
  };

  const handleDelete = async (id_margin: number) => {
    const res = await deleteMarginAction(id_margin);
    if (res.success) {
      messageApi.success(res.message);
      fetchMargin(viewMode);
    } else {
      messageApi.error(res.message);
    }
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const columns: ColumnsType<MarginPenjualanView> = [
    {
      title: 'ID Margin',
      dataIndex: 'id_margin',
      key: 'id_margin',
      width: 110,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Persentase',
      dataIndex: 'persen',
      key: 'persen',
      width: 150,
      render: (persen: number) => <Text strong>{persen}%</Text>,
    },
    {
      title: 'Dibuat Oleh',
      dataIndex: 'dibuat_oleh',
      key: 'dibuat_oleh',
      width: 160,
      render: (user: string) => <Text>{user || '-'}</Text>,
    },
    {
      title: 'Waktu Dibuat',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string | Date) => <Text>{formatDate(date)}</Text>,
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
            title="Hapus Margin"
            description="Yakin ingin menghapus data margin penjualan ini?"
            onConfirm={() => handleDelete(record.id_margin)}
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
            Master Margin Penjualan
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber data: Complex View{' '}
            <Text code>
              {viewMode === 'active'
                ? 'vu_margin_penjualan_aktif'
                : 'vu_margin_penjualan'}
            </Text>
          </Text>
        </Flex>

        <Flex gap={8} align="center" wrap="wrap">
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'all' | 'active')}
            options={[
              { label: 'Semua (vu_margin_penjualan)', value: 'all' },
              { label: 'Aktif (vu_margin_penjualan_aktif)', value: 'active' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchMargin(viewMode)}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Tambah Margin
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Data Margin */}
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
          rowKey="id_margin"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            style: { padding: '0 20px' },
          }}
        />
      </Card>

      {/* Modal Tambah / Edit Margin */}
      <Modal
        title={editingMargin ? 'Edit Margin Penjualan' : 'Tambah Margin Baru'}
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
            persen: editingMargin ? editingMargin.persen : 10,
            status: editingMargin ? editingMargin.status : 1,
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Persentase Margin (%)"
            name="persen"
            rules={[{ required: true, message: 'Persentase wajib diisi' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              min={0}
              max={100}
              step={0.1}
              placeholder="Contoh: 10"
              addonAfter="%"
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
                { value: 1, label: 'Aktif (1)' },
                { value: 0, label: 'Nonaktif (0)' },
              ]}
            />
          </Form.Item>

          <Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
            <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingMargin ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </Flex>
  );
}