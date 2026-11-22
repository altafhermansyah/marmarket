'use client';

import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Typography, Flex, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ReloadOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  HistoryOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { KartuStokView } from '@/types/database';
import { getKartuStokViewAction } from '@/actions/kartu-stok.actions';
import { formatTanggal, formatAngka } from '@/lib/format';

const { Title, Text, Paragraph } = Typography;

export default function KartuStokPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [kartuStokList, setKartuStokList] = useState<KartuStokView[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const logs = await getKartuStokViewAction();
      setKartuStokList(logs);
    } catch (err) {
      console.error('Gagal memuat data kartu stok:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: ColumnsType<KartuStokView> = [
    {
      title: 'No. Log',
      dataIndex: 'id_kartu_stok',
      key: 'id_kartu_stok',
      width: 100,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Waktu Transaksi',
      dataIndex: 'tanggal_catat',
      key: 'tanggal_catat',
      width: 180,
      render: (val: string | Date) => (
        <Text style={{ fontSize: 13 }}>{formatTanggal(val)}</Text>
      ),
    },
    {
      title: 'Barang & Satuan',
      dataIndex: 'nama_barang',
      key: 'nama_barang',
      render: (nama: string, record: KartuStokView) => (
        <Flex vertical gap={2}>
          <Text strong>{nama}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Satuan: <Tag style={{ margin: 0 }}>{record.nama_satuan}</Tag> | ID Barang: #{record.id_barang}
          </Text>
        </Flex>
      ),
    },
    {
      title: 'Tipe Mutasi',
      dataIndex: 'jenis_transaksi',
      key: 'jenis_transaksi',
      width: 150,
      align: 'center',
      filters: [
        { text: 'Masuk (M)', value: 'M' },
        { text: 'Keluar (K)', value: 'K' },
      ],
      onFilter: (value, record) => record.jenis_transaksi === value,
      render: (jenis: string) => {
        if (jenis === 'M') {
          return (
            <Tag color="success" icon={<ArrowDownOutlined />} style={{ fontWeight: 600 }}>
              MASUK (M)
            </Tag>
          );
        }
        if (jenis === 'K') {
          return (
            <Tag color="error" icon={<ArrowUpOutlined />} style={{ fontWeight: 600 }}>
              KELUAR (K)
            </Tag>
          );
        }
        return <Tag>{jenis}</Tag>;
      },
    },
    {
      title: 'Referensi Trx',
      dataIndex: 'id_transaksi',
      key: 'id_transaksi',
      width: 170,
      align: 'center',
      render: (idTrx: number, record: KartuStokView) => {
        if (record.jenis_transaksi === 'M') {
          return (
            <Tag color="blue" icon={<InboxOutlined />}>
              Penerimaan #{idTrx}
            </Tag>
          );
        }
        if (record.jenis_transaksi === 'K') {
          return (
            <Tag color="purple" icon={<ShoppingCartOutlined />}>
              Penjualan #{idTrx}
            </Tag>
          );
        }
        return <Tag>Trx #{idTrx}</Tag>;
      },
    },
    {
      title: 'Qty Masuk',
      dataIndex: 'masuk',
      key: 'masuk',
      width: 130,
      align: 'right',
      render: (val: number, record: KartuStokView) =>
        val > 0 ? (
          <Text style={{ color: '#16a34a', fontWeight: 600 }}>
            +{formatAngka(val)} {record.nama_satuan}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Qty Keluar',
      dataIndex: 'keluar',
      key: 'keluar',
      width: 130,
      align: 'right',
      render: (val: number, record: KartuStokView) =>
        val > 0 ? (
          <Text style={{ color: '#dc2626', fontWeight: 600 }}>
            -{formatAngka(val)} {record.nama_satuan}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Saldo Stok Akhir',
      dataIndex: 'stock',
      key: 'stock',
      width: 160,
      align: 'right',
      render: (stock: number, record: KartuStokView) => (
        <Tag
          color="geekblue"
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          {formatAngka(stock)} {record.nama_satuan}
        </Tag>
      ),
    },
  ];

  return (
    <Flex vertical gap={20}>
      {/* Header Halaman */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Flex vertical gap={2}>
          <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            Kartu Stok
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber data: View <Text code>vu_kartu_stok</Text>
          </Text>
        </Flex>

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
        >
          Refresh
        </Button>
      </Flex>

      {/* Tabel Data Kartu Stok */}
      <Card
        style={{
          border: '1px solid #e4e4e7',
          boxShadow: 'none',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={kartuStokList}
          rowKey="id_kartu_stok"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showTotal: (total) => `Total ${total} riwayat log mutasi`,
            style: { padding: '0 20px' },
          }}
          size="middle"
          scroll={{ x: 1050 }}
          locale={{
            emptyText: (
              <Flex vertical align="center" justify="center" style={{ padding: '48px 0' }} gap={8}>
                <HistoryOutlined style={{ fontSize: 32, color: '#d4d4d8' }} />
                <Text type="secondary">Belum ada riwayat mutasi stok barang tercatat</Text>
                <Paragraph type="secondary" style={{ fontSize: 12, margin: 0, maxWidth: 420, textAlign: 'center' }}>
                  Riwayat kartu stok akan terisi otomatis saat Anda mencatat Penerimaan barang atau Penjualan kasir POS.
                </Paragraph>
              </Flex>
            ),
          }}
        />
      </Card>
    </Flex>
  );
}
