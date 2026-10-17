import { createRouter, createWebHistory } from 'vue-router'

import AdminLayout from '../layouts/AdminLayout.vue'
import DashboardView from '../views/DashboardView.vue'
import ReportsView from '../views/ReportsView.vue'
import OrdersView from '../views/OrdersView.vue'
import ProductsView from '../views/ProductsView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import BannersView from '../views/BannersView.vue'
import AddressesView from '../views/AddressesView.vue'
import UsersView from '../views/UsersView.vue'
import SettingsView from '../views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {
          path: 'reports',
          name: 'reports',
          component: ReportsView,
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrdersView,
        },
        {
          path: 'products',
          name: 'products',
          component: ProductsView,
        },
        {
          path: 'categories',
          name: 'categories',
          component: CategoriesView,
        },
        {
          path: 'banners',
          name: 'banners',
          component: BannersView,
        },
        {
          path: 'addresses',
          name: 'addresses',
          component: AddressesView,
        },
        {
          path: 'users',
          name: 'users',
          component: UsersView,
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsView,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

export default router