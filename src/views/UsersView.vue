<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Users,
  Search,
  Mail,
  Phone,
  Shield,
  Calendar,
  RefreshCw,
  UserCheck,
} from 'lucide-vue-next'
import { getUsers, type User } from '../services/api'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const users = ref<User[]>([])
const searchQuery = ref('')

async function loadData() {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (err: unknown) {
    toast.error('Failed to load users', (err as Error).message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Active'
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)),
  )
})
</script>

<template>
  <div class="users-page">
    <div class="users-header">
      <div>
        <h1>Registered Users & Customers</h1>
        <p class="subtitle">
          View customer accounts, roles, contact details, and account lifecycles (<code>/users</code>).
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadData">
          <RefreshCw :size="15" :class="{ 'animate-spin': loading }" /> Refresh
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar glass-card">
      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by customer name, email, phone..."
          class="filter-input"
        />
      </div>
      <span class="count-tag">{{ filteredUsers.length }} Users Registered</span>
    </div>

    <!-- Users Table -->
    <div class="table-section glass-card">
      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Contact Phone</th>
              <th>Role</th>
              <th>Member Since</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar" :class="{ 'is-admin': user.role === 'admin' }">
                    {{ user.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <strong>{{ user.name }}</strong>
                    <small class="id-tag">UID #{{ user.id }}</small>
                  </div>
                </div>
              </td>
              <td>
                <div class="email-cell">
                  <Mail :size="14" class="text-muted" />
                  <span>{{ user.email }}</span>
                </div>
              </td>
              <td>
                <div class="phone-cell">
                  <Phone :size="14" class="text-muted" />
                  <span>{{ user.phone || '—' }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="user.role === 'admin' ? 'badge-purple' : 'badge-neutral'">
                  <Shield :size="12" /> {{ user.role || 'Customer' }}
                </span>
              </td>
              <td>
                <span class="date-cell">
                  {{ formatDate(user.created_at) }}
                </span>
              </td>
              <td>
                <span class="badge badge-success">
                  <span class="badge-dot"></span> Active
                </span>
              </td>
            </tr>

            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="empty-cell">
                <Users :size="36" class="empty-icon" />
                <h4>No users found</h4>
                <p>No customer records match your search criteria.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.users-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.users-header h1 {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  font-size: 14px;
  margin-top: 4px;
}

.subtitle code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #4f46e5;
  font-size: 12.5px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filters-bar {
  padding: 12px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 6px 14px;
  width: 360px;
}

.search-icon {
  color: #94a3b8;
}

.filter-input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  font-size: 13px;
  font-family: inherit;
}

.count-tag {
  font-size: 12.5px;
  color: #64748b;
  font-weight: 600;
}

.table-section {
  padding: 18px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13.5px;
}

.user-avatar.is-admin {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.id-tag {
  color: #94a3b8;
  font-size: 11px;
  display: block;
}

.email-cell,
.phone-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.date-cell {
  font-size: 12.5px;
  color: #475569;
}

.empty-cell {
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 8px;
}

.empty-cell h4 {
  font-size: 16px;
  color: #1e293b;
}

.empty-cell p {
  color: #64748b;
  font-size: 13px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 650px) {
  .users-header {
    flex-direction: column;
    align-items: stretch;
  }
  .filters-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box {
    width: 100%;
  }
}
</style>
