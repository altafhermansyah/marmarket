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
  Select,
  InputNumber,
  Tag,
  message,
  Divider,
  Descriptions,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  InboxOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import {
  PenerimaanView,
  DetailPenerimaanView,
  PengadaanView,
} from '@/types/database';
import {
  getPenerimaanViewAction,
  getDetailPenerimaanViewAction,
  getPengadaanSiapTerimaAction,
  createPenerimaanAction,
} from '@/actions/penerimaan.actions';
import { getDetailPengadaanViewAction } from '@/actions/pengadaan.actions';
import { formatRupiah, formatTanggal } from '@/lib/format';

const { Title, Text } = Typography;

interface ReceiveItemRow {
  key: string;
  idbarang: number;
  nama_barang: string;
  nama_satuan: string;
  jumlah_pesan: number;
  jumlah_terima: number;
  harga_satuan_terima: number;
  sub_total_terima: number;
}

export default function PenerimaanPage() {
  const [data, setData] = useState<PenerimaanView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [readyPengadaan, setReadyPengadaan] = useState<PengadaanView[]>([]);
  const [selectedPengadaanId, setSelectedPengadaanId] = useState<number | null>(null);
  const [itemsToReceive, setItemsToReceive] = useState<ReceiveItemRow[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  // Modal Detail
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedPenerimaan, setSelectedPenerimaan] = useState<PenerimaanView | null>(null);
  const [detailItems, setDetailItems] = useState<DetailPenerimaanView[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchPenerimaanList = async () => {
    setLoading(true);
    const res = await getPenerimaanViewAction();
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchPenerimaanList();
  }, []);

  const handleOpenCreate = async () => {
    form.resetFields();
    setSelectedPengadaanId(null);
    setItemsToReceive([]);
    setIsCreateOpen(true);

    const pengadaanList = await getPengadaanSiapTerimaAction();
    setReadyPengadaan(pengadaanList);
  };

  const handleSelectPengadaan = async (idPengadaan: number) => {
    setSelectedPengadaanId(idPengadaan);
    setLoadingItems(true);
    const details = await getDetailPengadaanViewAction(idPengadaan);

    const formatted: ReceiveItemRow[] = details.map((d) => ({
      key: 'recv-' + d.id_detail_pengadaan,
      idbarang: d.id_barang,
      nama_barang: d.nama_barang,
      nama_satuan: d.nama_satuan,
      jumlah_pesan: d.jumlah,
      jumlah_terima: d.jumlah,
      harga_satuan_terima: d.harga_satuan,
      sub_total_terima: d.jumlah * d.harga_satuan,
    }));

    setItemsToReceive(formatted);
    setLoadingItems(false);
  };

  const handleQtyChange = (key: string, qty: number | null) => {
    const val = qty || 0;
    setItemsToReceive((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return {
            ...item,
            jumlah_terima: val,
            sub_total_terima: val * item.harga_satuan_terima,
          };
        }
        return item;
      })
    );
  };

  const handlePriceChange = (key: string, price: number | null) => {
    const val = price || 0;
    setItemsToReceive((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return {
            ...item,
            harga_satuan_terima: val,
            sub_total_terima: val * item.jumlah_terima,
          };
        }
        return item;
      })
    );
  };

  const calculateTotalTerima = () =>
    itemsToReceive.reduce((acc, curr) => acc + curr.sub_total_terima, 0);

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!itemsToReceive || itemsToReceive.length === 0) {
        messageApi.error('Tidak ada barang untuk diterima');
        return;
      }

      setSubmitting(true);
      const res = await createPenerimaanAction({
        idpengadaan: values.idpengadaan,
        items: itemsToReceive.map((i) => ({
          idbarang: i.idbarang,
          jumlah_terima: i.jumlah_terima,
          harga_satuan_terima: i.harga_satuan_terima,
        })),
      });
      setSubmitting(false);

      if (res.success) {
        messageApi.success(res.message);
        setIsCreateOpen(false);
        fetchPenerimaanList();
      } else {
        messageApi.error(res.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetail = async (record: PenerimaanView) => {
    setSelectedPenerimaan(record);
    setIsDetailOpen(true);
    setDetailLoading(true);
    const details = await getDetailPenerimaanViewAction(record.id_penerimaan);
    setDetailItems(details);
    setDetailLoading(false);
  };

  const columns: ColumnsType<PenerimaanView> = [
    {
      title: 'ID Penerimaan',
      dataIndex: 'id_penerimaan',
      key: 'id_penerimaan',
      width: 120,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Tanggal Penerimaan',
      dataIndex: 'tanggal_penerimaan',
      key: 'tanggal_penerimaan',
      width: 170,
      render: (tgl) => <Text>{formatTanggal(tgl)}</Text>,
    },
    {
      title: 'Ref Pengadaan',
      dataIndex: 'id_pengadaan',
      key: 'id_pengadaan',
      width: 130,
      render: (idPengadaan: number) => (
        <Tag color="blue">PO #{idPengadaan}</Tag>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'nama_vendor',
      key: 'nama_vendor',
      render: (vendor: string) => <Text strong>{vendor}</Text>,
    },
    {
      title: 'Diterima Oleh',
      dataIndex: 'diterima_oleh',
      key: 'diterima_oleh',
      width: 140,
      render: (user: string) => <Tag>{user}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color="success">
          {status === 'S' || status === '1' ? 'Selesai' : 'Diterima'}
        </Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Detail
        </Button>
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
            Transaksi Penerimaan Barang
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sumber Data: Database View <Text code>vu_penerimaan</Text> & <Text code>vu_detail_penerimaan</Text>
          </Text>
        </Flex>

        <Flex gap={8} align="center">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchPenerimaanList}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<InboxOutlined />}
            onClick={handleOpenCreate}
          >
            Catat Penerimaan
          </Button>
        </Flex>
      </Flex>

      {/* Tabel Penerimaan */}
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
          rowKey="id_penerimaan"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} data penerimaan`,
          }}
        />
      </Card>

      {/* Modal Detail Penerimaan */}
      <Modal
        title={
          <Flex align="center" gap={8}>
            <FileDoneOutlined />
            <span>Detail Penerimaan #{selectedPenerimaan?.id_penerimaan}</span>
          </Flex>
        }
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)}>
            Tutup
          </Button>,
        ]}
        width={750}
      >
        {selectedPenerimaan && (
          <Flex vertical gap={16} style={{ marginTop: 12 }}>
            <Descriptions
              size="small"
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: 'vendor',
                  label: 'Vendor',
                  children: selectedPenerimaan.nama_vendor,
                },
                {
                  key: 'id_pengadaan',
                  label: 'Nomor Pengadaan',
                  children: `Pengadaan #${selectedPenerimaan.id_pengadaan}`,
                },
                {
                  key: 'tanggal_penerimaan',
                  label: 'Tanggal Penerimaan',
                  children: formatTanggal(selectedPenerimaan.tanggal_penerimaan),
                },
                {
                  key: 'diterima_oleh',
                  label: 'Diterima Oleh',
                  children: selectedPenerimaan.diterima_oleh,
                },
                {
                  key: 'status',
                  label: 'Status',
                  children: <Tag color="success">Selesai</Tag>,
                },
              ]}
            />

            <Flex vertical gap={6}>
              <Text strong style={{ fontSize: 13 }}>
                Item Diterima (View: <Text code>vu_detail_penerimaan</Text>)
              </Text>
              <Table
                size="small"
                bordered
                loading={detailLoading}
                dataSource={detailItems}
                rowKey="id_detail_penerimaan"
                pagination={false}
                columns={[
                  {
                    title: 'No',
                    width: 50,
                    render: (_, __, idx) => idx + 1,
                  },
                  {
                    title: 'Nama Barang',
                    dataIndex: 'nama_barang',
                    key: 'nama_barang',
                    render: (nama) => <Text strong>{nama}</Text>,
                  },
                  {
                    title: 'Satuan',
                    dataIndex: 'nama_satuan',
                    key: 'nama_satuan',
                    width: 90,
                  },
                  {
                    title: 'Jumlah Terima',
                    dataIndex: 'jumlah_terima',
                    key: 'jumlah_terima',
                    width: 110,
                    align: 'center',
                    render: (val) => <Text strong>{val}</Text>,
                  },
                  {
                    title: 'Harga Satuan Terima',
                    dataIndex: 'harga_satuan_terima',
                    key: 'harga_satuan_terima',
                    width: 140,
                    render: (val) => formatRupiah(val),
                  },
                  {
                    title: 'Subtotal Terima',
                    dataIndex: 'sub_total_terima',
                    key: 'sub_total_terima',
                    width: 140,
                    render: (val) => <Text strong>{formatRupiah(val)}</Text>,
                  },
                ]}
              />
            </Flex>
          </Flex>
        )}
      </Modal>

      {/* Modal Catat Penerimaan Baru */}
      <Modal
        title="Catat Penerimaan Barang Masuk"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={handleCreateSubmit}
        confirmLoading={submitting}
        okText="Konfirmasi Terima Barang"
        cancelText="Batal"
        width={800}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Alert
            message="Penerimaan barang akan otomatis menambah stok pada kartu stok dan menandai pengadaan selesai."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="idpengadaan"
            label="Pilih Transaksi Pengadaan (PO Siap Diterima)"
            rules={[{ required: true, message: 'Pengadaan wajib dipilih' }]}
          >
            <Select
              placeholder="Pilih nomor pengadaan yang akan diterima"
              onChange={handleSelectPengadaan}
              options={readyPengadaan.map((p) => ({
                value: p.id_pengadaan,
                label: `PO #${p.id_pengadaan} - ${p.nama_vendor} (${formatRupiah(p.total_nilai)}) - ${formatTanggal(p.tanggal_pengadaan)}`,
              }))}
            />
          </Form.Item>

          {selectedPengadaanId && (
            <Flex vertical gap={12} style={{ marginTop: 8 }}>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong>Konfirmasi Barang & Jumlah Diterima</Text>

              <Table
                size="small"
                bordered
                loading={loadingItems}
                dataSource={itemsToReceive}
                rowKey="key"
                pagination={false}
                columns={[
                  {
                    title: 'Barang',
                    dataIndex: 'nama_barang',
                    key: 'nama_barang',
                    render: (nama, r) => (
                      <Flex vertical>
                        <Text strong>{nama}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Satuan: {r.nama_satuan} | Dipesan: {r.jumlah_pesan}
                        </Text>
                      </Flex>
                    ),
                  },
                  {
                    title: 'Jumlah Terima',
                    dataIndex: 'jumlah_terima',
                    key: 'jumlah_terima',
                    width: 120,
                    render: (_, r) => (
                      <InputNumber
                        min={1}
                        value={r.jumlah_terima}
                        onChange={(val) => handleQtyChange(r.key, val)}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: 'Harga Satuan',
                    dataIndex: 'harga_satuan_terima',
                    key: 'harga_satuan_terima',
                    width: 140,
                    render: (_, r) => (
                      <InputNumber
                        min={0}
                        value={r.harga_satuan_terima}
                        onChange={(val) => handlePriceChange(r.key, val)}
                        style={{ width: '100%' }}
                      />
                    ),
                  },
                  {
                    title: 'Subtotal',
                    dataIndex: 'sub_total_terima',
                    key: 'sub_total_terima',
                    width: 130,
                    render: (val) => <Text strong>{formatRupiah(val)}</Text>,
                  },
                ]}
              />

              <Flex justify="flex-end" align="center" gap={12} style={{ marginTop: 8 }}>
                <Text type="secondary">Total Nilai Diterima:</Text>
                <Text strong style={{ fontSize: 16, color: '#16a34a' }}>
                  {formatRupiah(calculateTotalTerima())}
                </Text>
              </Flex>
            </Flex>
          )}
        </Form>
      </Modal>
    </Flex>
  );
}
