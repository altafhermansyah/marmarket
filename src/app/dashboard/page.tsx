'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Typography, Flex, Button } from 'antd';
import { getDashboardStatsAction } from '@/actions/dashboard.actions';

const { Title, Text } = Typography;

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    barangAktif: 0,
    vendorAktif: 0,
    totalUser: 0,
    satuanAktif: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const data = await getDashboardStatsAction();
      setStats(data);
    }
    loadStats();
  }, []);

  const summaryItems = [
    { label: 'Barang Aktif', value: stats.barangAktif },
    { label: 'Vendor Aktif', value: stats.vendorAktif },
    { label: 'Satuan Aktif', value: stats.satuanAktif },
    { label: 'Total User', value: stats.totalUser },
  ];

  const masterShortcuts = [
    { title: 'Master Role', view: 'vu_role', path: '/dashboard/master/role' },
    { title: 'Master User', view: 'vu_user', path: '/dashboard/master/user' },
    { title: 'Master Satuan', view: 'vu_satuan', path: '/dashboard/master/satuan' },
    { title: 'Master Vendor', view: 'vu_vendor', path: '/dashboard/master/vendor' },
    { title: 'Master Barang', view: 'vu_barang', path: '/dashboard/master/barang' },
    { title: 'Margin Penjualan', view: 'vu_margin_penjualan', path: '/dashboard/master/margin' },
  ];

  return (
    <Flex vertical gap={24}>
      <Flex vertical gap={2}>
        <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
          Overview
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Ringkasan data master Marmarket berdasarkan View database
        </Text>
      </Flex>

      {/* Kartu Statistik Ringkasan */}
      <Row gutter={[16, 16]}>
        {summaryItems.map((item, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card
              style={{
                border: '1px solid #e4e4e7',
                boxShadow: 'none',
              }}
              styles={{ body: { padding: 20 } }}
            >
              <Flex vertical gap={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.label}
                </Text>
                <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
                  {item.value}
                </Title>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Navigasi Cepat 6 Tabel Master */}
      <Card
        title={
          <Text strong style={{ fontSize: 14 }}>
            Modul 6 Tabel Master (Database Views)
          </Text>
        }
        style={{
          border: '1px solid #e4e4e7',
          boxShadow: 'none',
        }}
      >
        <Row gutter={[12, 12]}>
          {masterShortcuts.map((mod) => (
            <Col xs={24} sm={12} md={8} key={mod.path}>
              <Card
                size="small"
                style={{
                  border: '1px solid #e4e4e7',
                  backgroundColor: '#fafafa',
                }}
              >
                <Flex justify="space-between" align="center">
                  <Flex vertical>
                    <Text strong style={{ fontSize: 13 }}>
                      {mod.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      View: {mod.view}
                    </Text>
                  </Flex>
                  <Button
                    size="small"
                    onClick={() => router.push(mod.path)}
                  >
                    Buka
                  </Button>
                </Flex>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </Flex>
  );
}