<script setup lang="ts">
import { ref } from 'vue'
import { Menu, Bell, Search, Server, Sparkles, CheckCircle2, ChevronDown, LogOut, Settings, UserCircle } from 'lucide-vue-next'
import { apiConfig } from '../services/api'
import ApiSettingsModal from './ApiSettingsModal.vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const authStore = useAuthStore()
const router = useRouter()
const showSettingsModal = ref(false)
const showProfileDropdown = ref(false)
const showNotifications = ref(false)

const notifications = ref([
  { id: 1, title: 'New order #ORD-2026-1001 placed', time: '10 min ago', unread: true },
  { id: 2, title: 'Delivery approval requested for Order #1002', time: '45 min ago', unread: true },
  { id: 3, title: 'Low inventory alert: AeroPulse Earbuds (3 remaining)', time: '2 hrs ago', unread: false },
])

function handleLogout() {
  authStore.logout()
  showProfileDropdown.value = false
  router.push('/dashboard')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-left">
      <button class="menu-btn" @click="$emit('toggle-sidebar')">
        <Menu :size="22" />
      </button>

      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          type="text"
          placeholder="Search products, orders, categories... (Ctrl+K)"
          class="search-input"
        />
      </div>
    </div>

    <div class="navbar-right">
      <!-- API Connection Status Badge -->
      <button class="api-status-btn" @click="showSettingsModal = true" title="Configure Laravel API Connection">
        <div class="status-indicator" :class="apiConfig.demoMode ? 'demo' : apiConfig.isConnected ? 'online' : 'checking'">
          <span class="status-pulse"></span>
        </div>
        <span class="status-text">
          {{ apiConfig.demoMode ? 'Demo Mode' : apiConfig.isConnected ? 'API Live' : 'Backend Connected' }}
        </span>
        <Server :size="14" style="color: #64748b;" />
      </button>

      <!-- Notifications -->
      <div class="dropdown-wrap">
        <button class="icon-btn" @click="showNotifications = !showNotifications">
          <Bell :size="19" />
          <span class="notification-dot"></span>
        </button>

        <div v-if="showNotifications" class="dropdown-menu notif-menu">
          <div class="notif-header">
            <strong>Notifications</strong>
            <span class="badge badge-info">{{ notifications.filter(n => n.unread).length }} new</span>
          </div>
          <div class="notif-list">
            <div
              v-for="item in notifications"
              :key="item.id"
              class="notif-item"
              :class="{ unread: item.unread }"
            >
              <div class="notif-dot" v-if="item.unread"></div>
              <div>
                <p class="notif-text">{{ item.title }}</p>
                <small class="notif-time">{{ item.time }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Profile Dropdown -->
      <div class="dropdown-wrap">
        <div class="admin-profile" @click="showProfileDropdown = !showProfileDropdown">
          <div class="avatar">
            {{ (authStore.user?.name || 'Visut').charAt(0).toUpperCase() }}
          </div>
          <div class="admin-info">
            <strong>{{ authStore.user?.name || 'Visut P.' }}</strong>
            <span>Admin</span>
          </div>
          <ChevronDown :size="14" class="text-muted" />
        </div>

        <div v-if="showProfileDropdown" class="dropdown-menu profile-menu">
          <div class="profile-menu-header">
            <strong>{{ authStore.user?.name || 'Visut' }}</strong>
            <small>{{ authStore.user?.email || 'admin@ecommerce.test' }}</small>
          </div>
          <div class="profile-menu-links">
            <button class="profile-menu-item" @click="showSettingsModal = true; showProfileDropdown = false">
              <Settings :size="16" /> API Settings
            </button>
            <button class="profile-menu-item" @click="router.push('/reports'); showProfileDropdown = false">
              <Sparkles :size="16" /> Analytics & Reports
            </button>
            <div class="divider"></div>
            <button class="profile-menu-item text-danger" @click="handleLogout">
              <LogOut :size="16" /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- API Settings Modal -->
    <ApiSettingsModal :show="showSettingsModal" @close="showSettingsModal = false" />
  </header>
</template>

<style scoped>
.navbar {
  height: var(--navbar-height);
  background: #ffffff;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  position: sticky;
  top: 0;
  z-index: 900;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.02);
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-box {
  width: 340px;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: #f8fafc;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: #64748b;
  transition: all 0.2s;
}

.search-box:focus-within {
  background: #ffffff;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-glow);
}

.search-icon {
  color: #94a3b8;
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13.5px;
  font-family: inherit;
  color: var(--text-main);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.api-status-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid var(--border-light);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.api-status-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: relative;
}

.status-indicator.online {
  background: #10b981;
}
.status-indicator.demo {
  background: #8b5cf6;
}
.status-indicator.checking {
  background: #f59e0b;
}

.status-pulse {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: inherit;
  opacity: 0.5;
  animation: pulseGlow 2s infinite;
}

.status-text {
  color: #334155;
}

.icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.notification-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
}

.dropdown-wrap {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  min-width: 240px;
  z-index: 1000;
  animation: slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.notif-menu {
  width: 320px;
}

.notif-header {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notif-list {
  max-height: 280px;
  overflow-y: auto;
}

.notif-item {
  padding: 12px 18px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  gap: 10px;
  transition: background 0.15s;
}

.notif-item:hover {
  background: #f8fafc;
}

.notif-item.unread {
  background: #f0fdf4;
}

.notif-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  margin-top: 6px;
}

.notif-text {
  font-size: 13px;
  color: #1e293b;
  margin: 0;
}

.notif-time {
  color: #94a3b8;
  font-size: 11.5px;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 4px 6px;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.admin-profile:hover {
  background: #f8fafc;
  border-color: var(--border-light);
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.admin-info {
  display: flex;
  flex-direction: column;
}

.admin-info strong {
  font-size: 13.5px;
  color: #0f172a;
}

.admin-info span {
  font-size: 11.5px;
  color: #64748b;
}

.profile-menu-header {
  padding: 14px 18px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
}

.profile-menu-header strong {
  font-size: 14px;
  color: #0f172a;
}

.profile-menu-header small {
  color: #64748b;
  font-size: 12px;
}

.profile-menu-links {
  padding: 6px 0;
}

.profile-menu-item {
  width: 100%;
  background: none;
  border: none;
  padding: 10px 18px;
  text-align: left;
  font-size: 13.5px;
  font-family: inherit;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.profile-menu-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.text-danger {
  color: #dc2626 !important;
}

.divider {
  height: 1px;
  background: var(--border-light);
  margin: 6px 0;
}

.menu-btn {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #334155;
}

@media (max-width: 900px) {
  .search-box {
    width: 200px;
  }
}

@media (max-width: 768px) {
  .menu-btn {
    display: block;
  }
  .search-box {
    display: none;
  }
  .admin-info {
    display: none;
  }
  .navbar {
    padding: 0 16px;
  }
}
</style>