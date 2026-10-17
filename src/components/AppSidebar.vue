<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Tags,
  Image as ImageIcon,
  ShoppingCart,
  Users,
  MapPin,
  Settings,
  LogOut,
  X,
  Truck,
  Sparkles,
} from 'lucide-vue-next'
import { getAdminOrders } from '../services/api'
import { useAuthStore } from '../stores/auth'

defineProps<{
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()
const pendingOrdersCount = ref(0)

onMounted(async () => {
  try {
    const orders = await getAdminOrders()
    pendingOrdersCount.value = orders.filter((o) => o.status === 'pending' || !o.delivery_approved_at).length
  } catch {
    pendingOrdersCount.value = 1
  }
})
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-mobile-open': mobileOpen }">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">
          <Sparkles :size="20" />
        </div>
        <div class="logo-text">
          <span class="brand-name">ShopAdmin</span>
          <span class="brand-badge">PRO</span>
        </div>
      </div>

      <button class="close-btn" @click="emit('close')">
        <X :size="20" />
      </button>
    </div>

    <nav class="sidebar-nav">
      <p class="nav-title">OVERVIEW</p>

      <RouterLink to="/dashboard" class="nav-item" @click="emit('close')">
        <LayoutDashboard :size="18" />
        <span>Dashboard</span>
      </RouterLink>

      <RouterLink to="/reports" class="nav-item" @click="emit('close')">
        <BarChart3 :size="18" />
        <span>Reports & Analytics</span>
        <span class="nav-badge new">New</span>
      </RouterLink>

      <p class="nav-title">STORE & OPERATIONS</p>

      <RouterLink to="/orders" class="nav-item" @click="emit('close')">
        <ShoppingCart :size="18" />
        <span>Orders</span>
        <span v-if="pendingOrdersCount > 0" class="nav-badge alert">
          {{ pendingOrdersCount }}
        </span>
      </RouterLink>

      <RouterLink to="/products" class="nav-item" @click="emit('close')">
        <Package :size="18" />
        <span>Products</span>
      </RouterLink>

      <RouterLink to="/categories" class="nav-item" @click="emit('close')">
        <Tags :size="18" />
        <span>Categories</span>
      </RouterLink>

      <RouterLink to="/banners" class="nav-item" @click="emit('close')">
        <ImageIcon :size="18" />
        <span>Banners</span>
      </RouterLink>

      <RouterLink to="/addresses" class="nav-item" @click="emit('close')">
        <MapPin :size="18" />
        <span>Addresses</span>
      </RouterLink>

      <p class="nav-title">RELATIONSHIPS & SYSTEM</p>

      <RouterLink to="/users" class="nav-item" @click="emit('close')">
        <Users :size="18" />
        <span>Customers & Users</span>
      </RouterLink>

      <RouterLink to="/settings" class="nav-item" @click="emit('close')">
        <Settings :size="18" />
        <span>API & Settings</span>
      </RouterLink>
    </nav>

    <div class="sidebar-bottom">
      <div class="api-indicator-box">
        <div class="api-meta">
          <span class="api-label">LARAVEL BACKEND</span>
          <span class="api-url">{{ authStore.apiConfig.baseUrl.replace(/^https?:\/\//, '') }}</span>
        </div>
      </div>

      <button class="logout-btn" @click="authStore.logout()">
        <LogOut :size="18" />
        <span>Logout Session</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  z-index: 1000;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-header {
  height: var(--navbar-height);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
}

.logo-text {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-name {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
}

.brand-badge {
  background: rgba(99, 102, 241, 0.2);
  color: #818cf8;
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(129, 140, 248, 0.3);
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-title {
  margin: 18px 12px 8px;
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.06em;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 3px;
  border-radius: var(--radius-md);
  color: #94a3b8;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
}

.nav-badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
}

.nav-badge.new {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.nav-badge.alert {
  background: #ef4444;
  color: #ffffff;
}

.sidebar-bottom {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.api-indicator-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 10px 12px;
  border-radius: 8px;
}

.api-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.api-label {
  font-size: 9.5px;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.api-url {
  font-size: 11.5px;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn {
  width: 100%;
  border: none;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.close-btn {
  display: none;
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .sidebar-mobile-open {
    transform: translateX(0);
  }

  .close-btn {
    display: block;
  }
}
</style>