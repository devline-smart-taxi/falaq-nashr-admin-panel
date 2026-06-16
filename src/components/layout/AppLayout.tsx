import { Suspense, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Layout, Menu, Dropdown, Avatar, Typography, Space, Grid, Spin } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  UserOutlined,
  TagsOutlined,
  AppstoreOutlined,
  PictureOutlined,
  CrownOutlined,
  StarOutlined,
  BellOutlined,
  TeamOutlined,
  DollarOutlined,
  SafetyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import { useLogout } from '@/features/auth/useLogout'
import { PATHS } from '@/router/paths'

const { Header, Sider, Content } = Layout

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  superAdminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: PATHS.dashboard, label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: PATHS.books, label: 'Kitoblar', icon: <BookOutlined /> },
  { key: PATHS.authors, label: 'Mualliflar', icon: <UserOutlined /> },
  { key: PATHS.categories, label: 'Kategoriyalar', icon: <TagsOutlined /> },
  { key: PATHS.collections, label: 'Kolleksiyalar', icon: <AppstoreOutlined /> },
  { key: PATHS.banners, label: 'Bannerlar', icon: <PictureOutlined /> },
  { key: PATHS.subscriptionPlans, label: 'Obuna tariflari', icon: <CrownOutlined /> },
  { key: PATHS.reviews, label: 'Sharhlar', icon: <StarOutlined /> },
  { key: PATHS.notifications, label: 'Bildirishnomalar', icon: <BellOutlined /> },
  { key: PATHS.users, label: 'Foydalanuvchilar', icon: <TeamOutlined /> },
  { key: PATHS.sales, label: 'Sotuvlar', icon: <DollarOutlined /> },
  { key: PATHS.admins, label: 'Adminlar', icon: <SafetyOutlined />, superAdminOnly: true },
]

export function AppLayout() {
  const location = useLocation()
  const screens = Grid.useBreakpoint()
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const visibleItems = NAV_ITEMS.filter((i) => !i.superAdminOnly || isSuperAdmin)

  // Eng aniq mos keluvchi marshrutni belgilaymiz (masalan /books/123 → /books).
  const selectedKey =
    visibleItems
      .map((i) => i.key)
      .filter((k) => k === '/' ? location.pathname === '/' : location.pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0] ?? PATHS.dashboard

  const menuItems: MenuProps['items'] = visibleItems.map((i) => ({
    key: i.key,
    icon: i.icon,
    label: <Link to={i.key}>{i.label}</Link>,
  }))

  const userMenu: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Chiqish',
      danger: true,
      onClick: () => void logout(),
    },
  ]

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        breakpoint="lg"
        collapsedWidth={screens.lg ? 80 : 0}
        theme="dark"
        width={232}
        style={{ height: '100vh', position: 'sticky', top: 0, insetInlineStart: 0 }}
      >
        <div
          style={{
            height: 56,
            margin: 16,
            color: '#fff',
            fontSize: collapsed ? 18 : 20,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? 'F' : 'Falaq Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ height: 'calc(100vh - 88px)', overflowY: 'auto', borderInlineEnd: 0 }}
        />
      </Sider>

      <Layout style={{ height: '100vh', overflow: 'hidden' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div
            onClick={() => setCollapsed((c) => !c)}
            style={{ cursor: 'pointer', fontSize: 18 }}
            role="button"
            aria-label="Menyu"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Space size="middle">
            <Dropdown menu={{ items: userMenu }} trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                {screens.sm && (
                  <Typography.Text>{user?.fullName ?? 'Admin'}</Typography.Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 16, overflow: 'auto' }}>
          <Suspense
            fallback={
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin size="large" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  )
}
