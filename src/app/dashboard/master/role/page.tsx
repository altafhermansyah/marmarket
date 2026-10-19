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
  Popconfirm,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Role } from '@/types/database';
import {
  getRolesViewAction,
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
} from '@/actions/role.actions';

const { Title, Text } = Typography;

export default function MasterRolePage() {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchRoles = async () => {
    setLoading(true);
    const res = await getRolesViewAction();
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: Role) => {
    setEditingRole(record);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: { nama_role: string }) => {
    setSubmitting(true);
    const res = editingRole
      ? await updateRoleAction(editingRole.id_role, values.nama_role)
      : await createRoleAction(values.nama_role);
    setSubmitting(false);

    if (res.success) {
      messageApi.success(res.message);
      setIsModalOpen(false);
      fetchRoles();
    } else {
      messageApi.error(res.message);
    }
  };

  const handleDelete = async (id_role: number) => {
    const res = await deleteRoleAction(id_role);
    if (res.success) {
      messageApi.success(res.message);
      fetchRoles();
    } else {
      messageApi.error(res.message);
    }
  };

  const columns: ColumnsType<Role> = [
    {
      title: 'ID Role',
      dataIndex: 'id_role',
      key: 'id_role',
      width: 120,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Nama Role',
      dataIndex: 'nama_role',
      key: 'nama_role',
      render: (nama: string) => (
        <Tag
          style={{
            backgroundColor: '#f4f4f5',
            border: '1px solid #e4e4e7',
            color: '#18181b',
            fontWeight: 500,
            padding: '2px 10px',
          }}
        >
          {nama}
        </Tag>
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
            title="Hapus Role"
            description={`Yakin ingin menghapus role "${record.nama_role}"?`}
            onConfirm={() => handleDelete(record.id_role)}
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
            Master Role
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber data: Simple View <Text code>vu_role</Text>
          </Text>
        </Flex>

        <Flex gap={8}>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRoles}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Tambah Role
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Data Role */}
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
          rowKey="id_role"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            style: { padding: '0 20px' },
          }}
        />
      </Card>

      {/* Modal Tambah / Edit Role */}
      <Modal
        title={editingRole ? 'Edit Role' : 'Tambah Role Baru'}
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
            nama_role: editingRole ? editingRole.nama_role : '',
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Nama Role"
            name="nama_role"
            rules={[
              { required: true, message: 'Nama role wajib diisi' },
              { max: 100, message: 'Maksimal 100 karakter' },
            ]}
          >
            <Input placeholder="Contoh: Supervisor" size="large" />
          </Form.Item>

          <Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
            <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingRole ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </Flex>
  );
}