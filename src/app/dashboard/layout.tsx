'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Button, Typography, Flex, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  DatabaseOutlined,
  SwapOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import {
  getSessionAction,
  logoutAction,
  SessionUser,
} from '@/actions/auth.actions';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    async function loadSession() {
      const session = await getSessionAction();
      if (!session) {
        router.replace('/login');
      } else {
        setUser(session);
      }
    }
    loadSession();
  }, [router]);

  const handleLogout = async () => {
    await logoutAction();
    router.replace('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <AppstoreOutlined />,
      label: 'Overview',
    },
    {
      key: 'group-master',
      icon: <DatabaseOutlined />,
      label: 'Data Master',
      children: [
        { key: '/dashboard/master/role', label: 'Role' },
        { key: '/dashboard/master/user', label: 'User' },
        { key: '/dashboard/master/satuan', label: 'Satuan' },
        { key: '/dashboard/master/vendor', label: 'Vendor' },
        { key: '/dashboard/master/barang', label: 'Barang' },
        { key: '/dashboard/master/margin', label: 'Margin Penjualan' },
      ],
    },
    {
      key: 'group-transaksi',
      icon: <SwapOutlined />,
      label: 'Transaksi & Stok',
      children: [
        { key: '/dashboard/transaksi/pengadaan', label: 'Pengadaan' },
        { key: '/dashboard/transaksi/penerimaan', label: 'Penerimaan' },
        { key: '/dashboard/transaksi/penjualan', label: 'Penjualan' },
        { key: '/dashboard/transaksi/retur', label: 'Retur' },
        { key: '/dashboard/transaksi/kartu-stok', label: 'Kartu Stok' },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Sider
        width={240}
        theme="light"
        style={{
          borderRight: '1px solid #e4e4e7',
          backgroundColor: '#ffffff',
        }}
      >
        <Flex
          vertical
          justify="center"
          style={{
            height: 64,
            padding: '0 24px',
            borderBottom: '1px solid #e4e4e7',
          }}
        >
          <Text strong style={{ fontSize: 16, letterSpacing: '-0.02em' }}>
            Marmarket
          </Text>
        </Flex>

        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['group-master', 'group-transaksi']}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0, padding: '8px 0' }}
        />
      </Sider>

      <Layout style={{ backgroundColor: '#fafafa' }}>
        <Header
          style={{
            backgroundColor: '#ffffff',
            padding: '0 28px',
            height: 64,
            borderBottom: '1px solid #e4e4e7',
          }}
        >
          <Flex
            justify="space-between"
            align="center"
            style={{ height: '100%' }}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              Sistem Manajemen Inventaris
            </Text>

            <Flex align="center" gap={12}>
              {user && (
                <Flex align="center" gap={8}>
                  <Text strong style={{ fontSize: 13 }}>
                    {user.username}
                  </Text>
                  <Tag
                    style={{
                      margin: 0,
                      backgroundColor: '#f4f4f5',
                      border: '1px solid #e4e4e7',
                      color: '#18181b',
                    }}
                  >
                    {user.nama_role}
                  </Tag>
                </Flex>
              )}

              <Button
                type="text"
                size="small"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ color: '#71717a' }}
              >
                Logout
              </Button>
            </Flex>
          </Flex>
        </Header>

        <Content style={{ padding: 28 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}