import React from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import './globals.css';

export const metadata = {
  title: 'Sistem Informasi Manajemen Barang',
  description: 'Praktikum Pemrograman Basis Data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}