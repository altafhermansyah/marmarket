'use client';

import React, { useEffect, useState } from 'react';
import { Card, Typography, Flex, Tag } from 'antd';
import { getSessionAction, SessionUser } from '@/actions/auth.actions';

const { Title, Paragraph } = Typography;

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      const session = await getSessionAction();
      if (session) {
        setUser(session);
      }
    }
    loadUser();
  }, []);

  return (
    <Flex vertical gap={20}>
      <Card
        style={{
          border: '1px solid #e4e4e7',
          boxShadow: 'none',
          padding: 16,
        }}
      >
        <Flex vertical gap={8}>
          <Flex align="center" gap={10} wrap="wrap">
            <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
              Selamat Datang, {user?.username || 'Pengguna'}!
            </Title>
            {user?.nama_role && (
              <Tag
                color="blue"
                style={{
                  fontSize: 13,
                  padding: '2px 10px',
                  borderRadius: 6,
                  fontWeight: 500,
                }}
              >
                {user.nama_role}
              </Tag>
            )}
          </Flex>

          <Paragraph type="secondary" style={{ fontSize: 14, margin: 0 }}>
            Anda sedang masuk sebagai <strong>{user?.nama_role || 'Pengguna'}</strong> di sistem informasi <strong>Marmarket</strong>.
            Silakan gunakan menu di sidebar sebelah kiri untuk mengelola <strong>Data Master</strong>, 
            memproses transaksi <strong>Pengadaan</strong>, <strong>Penerimaan</strong>, <strong>Penjualan Kasir</strong>, 
            serta memantau mutasi stok pada <strong>Kartu Stok</strong>.
          </Paragraph>
        </Flex>
      </Card>
    </Flex>
  );
}
