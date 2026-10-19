import React from 'react';
import { Poppins } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'Marmarket — Sistem Manajemen Inventaris',
  description: 'Praktikum Pemrograman Basis Data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={poppins.className}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#18181b',
                borderRadius: 6,
                fontFamily: poppins.style.fontFamily,
              },
              components: {
                Menu: {
                  itemBg: '#ffffff',
                  subMenuItemBg: '#ffffff',
                  itemColor: '#52525b',
                  itemHoverBg: '#f4f4f5',
                  itemHoverColor: '#18181b',
                  itemSelectedBg: '#18181b',
                  itemSelectedColor: '#ffffff',
                  subMenuItemSelectedColor: '#18181b',
                  itemActiveBg: '#27272a',
                  itemBorderRadius: 6,
                  itemMarginInline: 12,
                  itemMarginBlock: 4,
                },
                Select: {
                  optionSelectedBg: '#18181b',
                  optionSelectedColor: '#ffffff',
                  optionSelectedFontWeight: 500,
                  optionActiveBg: '#f4f4f5',
                },
                Segmented: {
                  trackBg: '#f4f4f5',
                  itemColor: '#52525b',
                  itemHoverColor: '#18181b',
                  itemHoverBg: 'transparent',
                  itemSelectedBg: '#ffffff',
                  itemSelectedColor: '#18181b',
                },
              },
            }}
          >
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}