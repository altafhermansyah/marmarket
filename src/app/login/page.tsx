'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Typography,
  Flex,
  message,
} from 'antd';

const { Title, Text } = Typography;

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [loading, setLoading] = useState<boolean>(false);
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const handleLoginFinish = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      messageApi.success(`Login berhasil: ${values.username}`);
      router.push('/dashboard');
    }, 500);
  };

  const handleRegisterFinish = (values: any) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      messageApi.success(`Register berhasil: ${values.username}`);
      registerForm.resetFields();
      setActiveTab('login');
    }, 500);
  };

  const LoginForm = (
    <Form
      form={loginForm}
      name="login_form"
      layout="vertical"
      onFinish={handleLoginFinish}
      autoComplete="off"
      requiredMark={false}
      style={{ marginTop: 8 }}
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
        label="Password"
        name="password"
        rules={[{ required: true, message: 'Password wajib diisi' }]}
      >
        <Input.Password placeholder="Masukkan password" size="large" />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          block
        >
          Login
        </Button>
      </Form.Item>
    </Form>
  );

  const RegisterForm = (
    <Form
      form={registerForm}
      name="register_form"
      layout="vertical"
      onFinish={handleRegisterFinish}
      autoComplete="off"
      requiredMark={false}
      style={{ marginTop: 8 }}
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
        label="Role"
        name="idrole"
        rules={[{ required: true, message: 'Role wajib dipilih' }]}
      >
        <Select
          placeholder="Pilih role"
          size="large"
          options={[
            { value: 1, label: 'Super Admin' },
            { value: 2, label: 'Admin Gudang' },
            { value: 3, label: 'Kasir' },
          ]}
        />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: 'Password wajib diisi' },
          { min: 6, message: 'Minimal 6 karakter' },
          { max: 100, message: 'Maksimal 100 karakter' },
        ]}
      >
        <Input.Password placeholder="Masukkan password" size="large" />
      </Form.Item>

      <Form.Item
        label="Konfirmasi Password"
        name="confirm_password"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Konfirmasi password wajib diisi' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Password tidak sama'));
            },
          }),
        ]}
      >
        <Input.Password placeholder="Ulangi password" size="large" />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          block
        >
          Register
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <Flex
      justify="center"
      align="center"
      style={{
        minHeight: '100vh',
        backgroundColor: '#fafafa',
        padding: 16,
      }}
    >
      {contextHolder}
      <Card
        style={{
          width: '100%',
          maxWidth: 380,
          border: '1px solid #e4e4e7',
          boxShadow: 'none',
          backgroundColor: '#ffffff',
        }}
        styles={{
          body: { padding: '32px 28px' },
        }}
      >
        <Flex vertical gap={2} style={{ marginBottom: 20 }}>
          <Title
            level={4}
            style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.02em' }}
          >
            Marmarket
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Sistem Manajemen Inventaris
          </Text>
        </Flex>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={[
            {
              key: 'login',
              label: 'Login',
              children: LoginForm,
            },
            {
              key: 'register',
              label: 'Register',
              children: RegisterForm,
            },
          ]}
        />
      </Card>
    </Flex>
  );
}