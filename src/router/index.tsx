/* eslint-disable react-refresh/only-export-components -- marshrut konfiguratsiyasi fayli (lazy sahifalar) */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { RequireSuperAdmin } from '@/components/layout/RequireSuperAdmin'
import { ErrorPage } from '@/components/ErrorPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { PATHS } from './paths'

// Sahifalar route bo'yicha lazy yuklanadi — boshlang'ich bundle kichik bo'ladi.
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const BooksPage = lazy(() =>
  import('@/features/books/BooksPage').then((m) => ({ default: m.BooksPage })),
)
const AuthorsPage = lazy(() =>
  import('@/features/authors/AuthorsPage').then((m) => ({ default: m.AuthorsPage })),
)
const CategoriesPage = lazy(() =>
  import('@/features/categories/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
)
const CollectionsPage = lazy(() =>
  import('@/features/collections/CollectionsPage').then((m) => ({ default: m.CollectionsPage })),
)
const BannersPage = lazy(() =>
  import('@/features/banners/BannersPage').then((m) => ({ default: m.BannersPage })),
)
const PlansPage = lazy(() =>
  import('@/features/plans/PlansPage').then((m) => ({ default: m.PlansPage })),
)
const ReviewsPage = lazy(() =>
  import('@/features/reviews/ReviewsPage').then((m) => ({ default: m.ReviewsPage })),
)
const NotificationsPage = lazy(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
)
const UsersPage = lazy(() =>
  import('@/features/users/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const SalesPage = lazy(() =>
  import('@/features/sales/SalesPage').then((m) => ({ default: m.SalesPage })),
)
const AdminsPage = lazy(() =>
  import('@/features/admins/AdminsPage').then((m) => ({ default: m.AdminsPage })),
)

export const router = createBrowserRouter([
  { path: PATHS.login, element: <LoginPage />, errorElement: <ErrorPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <ErrorPage />,
        children: [
          { path: PATHS.dashboard, element: <DashboardPage /> },
          { path: PATHS.books, element: <BooksPage /> },
          { path: PATHS.authors, element: <AuthorsPage /> },
          { path: PATHS.categories, element: <CategoriesPage /> },
          { path: PATHS.collections, element: <CollectionsPage /> },
          { path: PATHS.banners, element: <BannersPage /> },
          { path: PATHS.subscriptionPlans, element: <PlansPage /> },
          { path: PATHS.reviews, element: <ReviewsPage /> },
          { path: PATHS.notifications, element: <NotificationsPage /> },
          { path: PATHS.users, element: <UsersPage /> },
          { path: PATHS.sales, element: <SalesPage /> },
          {
            path: PATHS.admins,
            element: (
              <RequireSuperAdmin>
                <AdminsPage />
              </RequireSuperAdmin>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={PATHS.dashboard} replace /> },
])
