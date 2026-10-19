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
import { SatuanView } from '@/types/database';
import {
  getSatuanViewAction,
  createSatuanAction,
  updateSatuanAction,
  deleteSatuanAction,
} from '@/actions/satuan.actions';

const { Title, Text } = Typography;

export default function MasterSatuanPage() {
  const [data, setData] = useState<SatuanView[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'active'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSatuan, setEditingSatuan] = useState<SatuanView | null>(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchSatuan = async (mode: 'all' | 'active' = viewMode) => {
    setLoading(true);
    const res = await getSatuanViewAction(mode === 'active');
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchSatuan(viewMode);
  }, [viewMode]);

  const handleOpenCreate = () => {
    setEditingSatuan(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: SatuanView) => {
    setEditingSatuan(record);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: {
    nama_satuan: string;
    status: number;
  }) => {
    setSubmitting(true);
    const res = editingSatuan
      ? await updateSatuanAction(editingSatuan.ID_SATUAN, values)
      : await createSatuanAction(values);
    setSubmitting(false);

    if (res.success) {
      messageApi.success(res.message);
      setIsModalOpen(false);
      fetchSatuan(viewMode);
    } else {
      messageApi.error(res.message);
    }
  };

  const handleDelete = async (id_satuan: number) => {
    const res = await deleteSatuanAction(id_satuan);
    if (res.success) {
      messageApi.success(res.message);
      fetchSatuan(viewMode);
    } else {
      messageApi.error(res.message);
    }
  };

  const columns: ColumnsType<SatuanView> = [
    {
      title: 'ID Satuan',
      dataIndex: 'ID_SATUAN',
      key: 'ID_SATUAN',
      width: 120,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Nama Satuan',
      dataIndex: 'NAMA_SATUAN',
      key: 'NAMA_SATUAN',
      render: (nama: string) => <Text strong>{nama}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'STATUS',
      key: 'STATUS',
      width: 160,
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
            title="Hapus Satuan"
            description={`Yakin ingin menghapus satuan "${record.NAMA_SATUAN}"?`}
            onConfirm={() => handleDelete(record.ID_SATUAN)}
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
            Master Satuan
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber data: Simple View{' '}
            <Text code>
              {viewMode === 'active' ? 'vu_satuan_aktif' : 'vu_satuan'}
            </Text>
          </Text>
        </Flex>

        <Flex gap={8} align="center" wrap="wrap">
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'all' | 'active')}
            options={[
              { label: 'Semua (vu_satuan)', value: 'all' },
              { label: 'Aktif (vu_satuan_aktif)', value: 'active' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchSatuan(viewMode)}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Tambah Satuan
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Data Satuan */}
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
          rowKey="ID_SATUAN"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            style: { padding: '0 20px' },
          }}
        />
      </Card>

      {/* Modal Tambah / Edit Satuan */}
      <Modal
        title={editingSatuan ? 'Edit Satuan' : 'Tambah Satuan Baru'}
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
            nama_satuan: editingSatuan ? editingSatuan.NAMA_SATUAN : '',
            status: editingSatuan ? editingSatuan.STATUS : 1,
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nama Satuan"
            name="nama_satuan"
            rules={[
              { required: true, message: 'Nama satuan wajib diisi' },
              { max: 45, message: 'Maksimal 45 karakter' },
            ]}
          >
            <Input placeholder="Contoh: PCS, BOX, KG, LITER" size="large" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
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

          <Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
            <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingSatuan ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </Flex>
  );
}