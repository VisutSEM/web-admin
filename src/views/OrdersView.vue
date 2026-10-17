<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  ShoppingCart,
  Search,
  Truck,
  CheckCircle,
  Eye,
  Clock,
  RefreshCw,
  Package,
  MapPin,
  CreditCard,
} from 'lucide-vue-next'
import {
  getAdminOrders,
  approveOrderDelivery,
  type Order,
  type OrderStatus,
} from '../services/api'
import OrderDetailsModal from '../components/OrderDetailsModal.vue'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const orders = ref<Order[]>([])
const searchQuery = ref('')
const selectedTab = ref<'all' | OrderStatus>('all')
const selectedOrder = ref<Order | null>(null)
const showModal = ref(false)
const approvingId = ref<string | number | null>(null)

async function loadOrders() {
  loading.value = true
  try {
    orders.value = await getAdminOrders()
  } catch (err: unknown) {
    toast.error('Failed to load orders', (err as Error).message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})

function formatMoney(amount: number | string | undefined) {
  const val = Number(amount) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatPaymentMethod(method?: string) {
  if (!method) return 'Cash on Delivery'
  if (method === 'aba_pay') return 'ABA Pay'
  if (method === 'cash_on_delivery') return 'Cash on Delivery'
  if (method === 'stripe') return 'Stripe'
  return method.replace(/_/g, ' ')
}

const filteredOrders = computed(() => {
  return orders.value.filter((order) => {
    // Tab filter
    if (selectedTab.value !== 'all' && order.status !== selectedTab.value) {
      return false
    }
    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      const num = String(order.order_number || order.id).toLowerCase()
      const name = (order.customer_name || order.user?.name || '').toLowerCase()
      const email = (order.customer_email || order.user?.email || '').toLowerCase()
      const addr = (typeof order.shipping_address === 'string' ? order.shipping_address : '').toLowerCase()
      return num.includes(q) || name.includes(q) || email.includes(q) || addr.includes(q)
    }
    return true
  })
})

const tabCounts = computed(() => {
  const counts: Record<string, number> = {
    all: orders.value.length,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }
  orders.value.forEach((o) => {
    const curr = counts[o.status]
    if (typeof curr === 'number') {
      counts[o.status] = curr + 1
    }
  })
  return counts
})

function openDetails(order: Order) {
  selectedOrder.value = order
  showModal.value = true
}

async function quickApproveDelivery(order: Order) {
  approvingId.value = order.id
  try {
    const updated = await approveOrderDelivery(order.id)
    toast.success('Delivery Approved!', `Order #${order.order_number || order.id} marked as delivered & payment confirmed.`)
    const idx = orders.value.findIndex((o) => o.id === order.id)
    if (idx !== -1) orders.value[idx] = updated
  } catch (err: unknown) {
    toast.error('Approval Failed', (err as Error).message)
  } finally {
    approvingId.value = null
  }
}

function handleOrderUpdated(updated: Order) {
  const idx = orders.value.findIndex((o) => o.id === updated.id)
  if (idx !== -1) orders.value[idx] = updated
  selectedOrder.value = updated
}
</script>

<template>
  <div class="orders-page">
    <!-- Header -->
    <div class="orders-header">
      <div>
        <h1>Customer Orders & Delivery Management</h1>
        <p class="subtitle">
          Real live customer checkouts from your Laravel API (<code>https://laravel-blog-api-1.onrender.com/api/admin/orders</code>).
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadOrders">
          <RefreshCw :size="15" :class="{ 'animate-spin': loading }" /> Refresh Live Orders
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="orders-tabs glass-card">
      <div class="tabs-list">
        <button
          class="tab-btn"
          :class="{ active: selectedTab === 'all' }"
          @click="selectedTab = 'all'"
        >
          All Orders
          <span class="tab-count">{{ tabCounts.all }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: selectedTab === 'pending' }"
          @click="selectedTab = 'pending'"
        >
          Pending
          <span class="tab-count warning">{{ tabCounts.pending }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: selectedTab === 'processing' }"
          @click="selectedTab = 'processing'"
        >
          Processing
          <span class="tab-count info">{{ tabCounts.processing }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: selectedTab === 'shipped' }"
          @click="selectedTab = 'shipped'"
        >
          Shipped
          <span class="tab-count purple">{{ tabCounts.shipped }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: selectedTab === 'delivered' }"
          @click="selectedTab = 'delivered'"
        >
          Delivered
          <span class="tab-count success">{{ tabCounts.delivered }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: selectedTab === 'cancelled' }"
          @click="selectedTab = 'cancelled'"
        >
          Cancelled
          <span class="tab-count danger">{{ tabCounts.cancelled }}</span>
        </button>
      </div>

      <!-- Search in tabs bar -->
      <div class="filter-search-wrap">
        <Search :size="15" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by Order #, Customer, City..."
          class="tab-search-input"
        />
      </div>
    </div>

    <!-- Orders Table -->
    <div class="table-section glass-card">
      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Destination Address</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td>
                <span class="order-id-badge" @click="openDetails(order)">
                  #{{ order.order_number || order.id }}
                </span>
                <span class="date-micro">{{ formatDate(order.created_at) }}</span>
              </td>
              <td>
                <div class="customer-info-row">
                  <img
                    v-if="order.user?.profile_picture"
                    :src="order.user.profile_picture"
                    alt="Avatar"
                    class="avatar-mini"
                  />
                  <div v-else class="avatar-mini-fallback">
                    {{ (order.customer_name || order.user?.name || 'C').charAt(0).toUpperCase() }}
                  </div>
                  <div class="customer-info">
                    <strong>{{ order.customer_name || order.user?.name || 'Customer' }}</strong>
                    <small>{{ order.customer_email || order.user?.email || 'N/A' }}</small>
                  </div>
                </div>
              </td>
              <td>
                <div class="address-snippet">
                  <MapPin :size="13" class="text-muted" />
                  <span>{{ typeof order.shipping_address === 'string' ? order.shipping_address : 'Phnom Penh, Cambodia' }}</span>
                </div>
              </td>
              <td>
                <div class="items-summary">
                  <span class="items-count-badge">
                    <Package :size="12" /> {{ (order.items || []).length || 1 }} item
                  </span>
                </div>
              </td>
              <td>
                <span class="price-val">{{ formatMoney(order.total_amount) }}</span>
              </td>
              <td>
                <div class="payment-cell">
                  <span class="badge" :class="order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'">
                    {{ order.payment_status === 'paid' ? 'Paid' : 'Unpaid' }}
                  </span>
                  <small class="payment-method-text">{{ formatPaymentMethod(order.payment_method) }}</small>
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-warning': order.status === 'pending',
                    'badge-info': order.status === 'processing',
                    'badge-purple': order.status === 'shipped',
                    'badge-success': order.status === 'delivered',
                    'badge-danger': order.status === 'cancelled',
                  }"
                >
                  <span class="badge-dot"></span>
                  {{ order.status }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="row-actions">
                  <button
                    v-if="order.status === 'pending'"
                    class="btn btn-sm btn-primary"
                    :disabled="approvingId === order.id"
                    @click="quickApproveDelivery(order)"
                    title="Approve delivery and mark as paid"
                  >
                    <Truck :size="14" />
                    <span>{{ approvingId === order.id ? 'Approving...' : 'Approve' }}</span>
                  </button>

                  <button class="btn btn-sm btn-secondary" @click="openDetails(order)">
                    <Eye :size="14" /> Review
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredOrders.length === 0">
              <td colspan="8" class="empty-cell">
                <div class="empty-state">
                  <ShoppingCart :size="36" class="empty-icon" />
                  <h4>No orders found</h4>
                  <p>Try modifying your search or switching to another filter tab.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order Inspection Modal -->
    <OrderDetailsModal
      :order="selectedOrder"
      :show="showModal"
      @close="showModal = false"
      @updated="handleOrderUpdated"
    />
  </div>
</template>

<style scoped>
.orders-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.orders-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.orders-header h1 {
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
  font-size: 12px;
}

.orders-tabs {
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.tabs-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;
}

.tab-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.tab-btn.active {
  background: #eef2ff;
  color: #4f46e5;
}

.tab-count {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
}

.tab-count.warning { background: #fef3c7; color: #b45309; }
.tab-count.info { background: #e0f2fe; color: #0369a1; }
.tab-count.purple { background: #f3e8ff; color: #7e22ce; }
.tab-count.success { background: #dcfce7; color: #15803d; }
.tab-count.danger { background: #fee2e2; color: #b91c1c; }

.filter-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 6px 12px;
  width: 280px;
}

.search-icon {
  color: #94a3b8;
}

.tab-search-input {
  border: none;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: 12.5px;
  width: 100%;
}

.table-section {
  padding: 18px;
}

.order-id-badge {
  font-weight: 700;
  color: #4f46e5;
  cursor: pointer;
  font-size: 13.5px;
  display: block;
}
.order-id-badge:hover {
  text-decoration: underline;
}

.date-micro {
  font-size: 11px;
  color: #94a3b8;
  display: block;
  margin-top: 2px;
}

.customer-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-mini {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.avatar-mini-fallback {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
}

.customer-info {
  display: flex;
  flex-direction: column;
}
.customer-info strong {
  font-size: 13px;
  color: #1e293b;
}
.customer-info small {
  font-size: 11.5px;
  color: #64748b;
}

.address-snippet {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: #334155;
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.items-count-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #475569;
}

.price-val {
  font-weight: 700;
  color: #0f172a;
}

.payment-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.payment-method-text {
  font-size: 11px;
  color: #64748b;
  text-transform: capitalize;
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.empty-cell {
  padding: 60px 20px;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  color: #cbd5e1;
  margin-bottom: 6px;
}

.empty-state h4 {
  font-size: 16px;
  color: #1e293b;
}

.empty-state p {
  font-size: 13px;
  color: #64748b;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 800px) {
  .orders-tabs {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-search-wrap {
    width: 100%;
  }
}
</style>
