'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Row, Col, Typography, Flex, Button } from 'antd';
import { getDashboardStatsAction } from '@/actions/dashboard.actions';
import { formatRupiah } from '@/lib/format';

const { Title, Text } = Typography;

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    barangAktif: 0,
    vendorAktif: 0,
    totalUser: 0,
    satuanAktif: 0,
    totalPengadaan: 0,
    totalPenerimaan: 0,
    totalPenjualan: 0,
    totalOmset: 0,
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
    { label: 'Total Transaksi Penjualan', value: stats.totalPenjualan },
    { label: 'Total Omset Penjualan', value: formatRupiah(stats.totalOmset) },
  ];

  const transactionShortcuts = [
    {
      title: 'Transaksi Pengadaan',
      headerView: 'vu_pengadaan',
      detailView: 'vu_detail_pengadaan',
      path: '/dashboard/transaksi/pengadaan',
      count: stats.totalPengadaan,
      description: 'Pengadaan barang ke vendor dengan kalkulasi PPN & subtotal',
    },
    {
      title: 'Transaksi Penerimaan',
      headerView: 'vu_penerimaan',
      detailView: 'vu_detail_penerimaan',
      path: '/dashboard/transaksi/penerimaan',
      count: stats.totalPenerimaan,
      description: 'Pencatatan barang masuk dari PO vendor & penambahan stok',
    },
    {
      title: 'Transaksi Penjualan (POS)',
      headerView: 'vu_penjualan',
      detailView: 'vu_detail_penjualan',
      path: '/dashboard/transaksi/penjualan',
      count: stats.totalPenjualan,
      description: 'Kasir penjualan dengan kalkulasi margin keuntungan & PPN',
    },
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
          Ringkasan data master dan transaksi Marmarket berdasarkan Database Views
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
                <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
                  {item.value}
                </Title>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Navigasi Cepat Modul Transaksi (Views Baru) */}
      <Card
        title={
          <Flex vertical gap={2}>
            <Text strong style={{ fontSize: 14 }}>
              Modul Transaksi (Database Views)
            </Text>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
              Terintegrasi dengan 6 Database Views: vu_pengadaan, vu_detail_pengadaan, vu_penerimaan, vu_detail_penerimaan, vu_penjualan, vu_detail_penjualan
            </Text>
          </Flex>
        }
        style={{
          border: '1px solid #e4e4e7',
          boxShadow: 'none',
        }}
      >
        <Row gutter={[16, 16]}>
          {transactionShortcuts.map((t) => (
            <Col xs={24} md={8} key={t.path}>
              <Card
                size="small"
                style={{
                  border: '1px solid #e4e4e7',
                  backgroundColor: '#ffffff',
                  height: '100%',
                }}
                styles={{
                  body: {
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    gap: 12,
                  },
                }}
              >
                <Flex vertical gap={6}>
                  <Flex justify="space-between" align="center">
                    <Text strong style={{ fontSize: 14 }}>
                      {t.title}
                    </Text>
                    <Text strong style={{ color: '#0284c7' }}>
                      {t.count} Data
                    </Text>
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t.description}
                  </Text>
                  <Flex vertical gap={2} style={{ marginTop: 4 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Header: <Text code>{t.headerView}</Text>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Detail: <Text code>{t.detailView}</Text>
                    </Text>
                  </Flex>
                </Flex>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => router.push(t.path)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Buka Transaksi
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Navigasi Cepat 6 Tabel Master */}
      <Card
        title={
          <Text strong style={{ fontSize: 14 }}>
            6 Tabel Master (Database Views)
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