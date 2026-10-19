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
import { UserView, Role } from '@/types/database';
import {
  getUsersViewAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from '@/actions/user.actions';
import { getRolesViewAction } from '@/actions/role.actions';

const { Title, Text } = Typography;

export default function MasterUserPage() {
  const [users, setUsers] = useState<UserView[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserView | null>(null);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchData = async () => {
    setLoading(true);
    const [usersData, rolesData] = await Promise.all([
      getUsersViewAction(),
      getRolesViewAction(),
    ]);
    setUsers(usersData);
    setRoles(rolesData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: UserView) => {
    setEditingUser(record);
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: {
    username: string;
    password?: string;
    id_role: number;
  }) => {
    setSubmitting(true);
    const res = editingUser
      ? await updateUserAction(editingUser.id_user, values)
      : await createUserAction({
          username: values.username,
          password: values.password || '',
          id_role: values.id_role,
        });
    setSubmitting(false);

    if (res.success) {
      messageApi.success(res.message);
      setIsModalOpen(false);
      fetchData();
    } else {
      messageApi.error(res.message);
    }
  };

  const handleDelete = async (id_user: number) => {
    const res = await deleteUserAction(id_user);
    if (res.success) {
      messageApi.success(res.message);
      fetchData();
    } else {
      messageApi.error(res.message);
    }
  };

  const columns: ColumnsType<UserView> = [
    {
      title: 'ID User',
      dataIndex: 'id_user',
      key: 'id_user',
      width: 110,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username: string) => <Text>{username}</Text>,
    },
    {
      title: 'Role',
      dataIndex: 'nama_role',
      key: 'nama_role',
      width: 200,
      render: (nama_role: string) => (
        <Tag
          style={{
            backgroundColor: '#f4f4f5',
            border: '1px solid #e4e4e7',
            color: '#18181b',
            fontWeight: 500,
            padding: '2px 10px',
          }}
        >
          {nama_role}
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
            title="Hapus User"
            description={`Yakin ingin menghapus user "${record.username}"?`}
            onConfirm={() => handleDelete(record.id_user)}
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
            Master User
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber data: Complex View <Text code>vu_user</Text>
          </Text>
        </Flex>

        <Flex gap={8}>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Tambah User
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Data User */}
      <Card
        style={{
          border: '1px solid #e4e4e7',
          boxShadow: 'none',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id_user"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            style: { padding: '0 20px' },
          }}
        />
      </Card>

      {/* Modal Tambah / Edit User */}
      <Modal
        title={editingUser ? 'Edit User' : 'Tambah User Baru'}
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
            username: editingUser ? editingUser.username : '',
            id_role: editingUser ? editingUser.id_role : undefined,
            password: '',
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[
              { required: true, message: 'Username wajib diisi' },
              { max: 45, message: 'Maksimal 45 karakter' },
            ]}
          >
            <Input placeholder="Masukkan username" size="large" />
          </Form.Item>

          <Form.Item
            label="Role Akses"
            name="id_role"
            rules={[{ required: true, message: 'Role wajib dipilih' }]}
          >
            <Select
              placeholder="Pilih role"
              size="large"
              options={roles.map((r) => ({
                value: r.id_role,
                label: r.nama_role,
              }))}
            />
          </Form.Item>

          <Form.Item
            label={editingUser ? 'Password Baru (Opsional)' : 'Password'}
            name="password"
            rules={
              editingUser
                ? [
                    { min: 6, message: 'Minimal 6 karakter' },
                    { max: 100, message: 'Maksimal 100 karakter' },
                  ]
                : [
                    { required: true, message: 'Password wajib diisi' },
                    { min: 6, message: 'Minimal 6 karakter' },
                    { max: 100, message: 'Maksimal 100 karakter' },
                  ]
            }
            extra={
              editingUser
                ? 'Kosongkan jika tidak ingin mengubah password lama.'
                : undefined
            }
          >
            <Input.Password
              placeholder={
                editingUser
                  ? 'Isi hanya jika ingin ganti password'
                  : 'Masukkan password'
              }
              size="large"
            />
          </Form.Item>

          <Flex justify="flex-end" gap={8} style={{ marginTop: 24 }}>
            <Button onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingUser ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </Flex>
  );
}