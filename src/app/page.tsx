'use client';

import React from 'react';
import { Card, Button, Typography, Space } from 'antd';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  return (
    <main style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
      <Card style={{ width: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <Space orientation="vertical" size="middle" style={{ display: 'flex' }}>
          <Title level={3}>Setup Proyek Berhasil</Title>
          <Paragraph>
            Next.js App Router, TypeScript, dan Ant Design sudah terkonfigurasi. Modul koneksi database siap digunakan.
          </Paragraph>
          <Button type="primary">Tombol Ant Design Aktif</Button>
        </Space>
      </Card>
    </main>
  );
}