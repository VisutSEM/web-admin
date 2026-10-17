<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Truck,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-vue-next'
import {
  getAdminOrders,
  getProducts,
  getReportsData,
  type Order,
  type Product,
  type ReportMetrics,
} from '../services/api'
import ReportCharts from '../components/ReportCharts.vue'
import OrderDetailsModal from '../components/OrderDetailsModal.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(true)
const orders = ref<Order[]>([])
const products = ref<Product[]>([])
const metrics = ref<ReportMetrics | null>(null)
const selectedOrder = ref<Order | null>(null)
const showOrderModal = ref(false)

onMounted(async () => {
  try {
    const [fetchedOrders, fetchedProducts, reportMetrics] = await Promise.all([
      getAdminOrders(),
      getProducts(),
      getReportsData(),
    ])
    orders.value = fetchedOrders
    products.value = fetchedProducts
    metrics.value = reportMetrics
  } catch (err) {
    console.error('Failed to load dashboard data:', err)
  } finally {
    loading.value = false
  }
})

function formatMoney(amount: number | string | undefined) {
  const val = Number(amount) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Recently'
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function viewOrder(order: Order) {
  selectedOrder.value = order
  showOrderModal.value = true
}

function handleOrderUpdated(updated: Order) {
  const idx = orders.value.findIndex((o) => o.id === updated.id)
  if (idx !== -1) {
    orders.value[idx] = updated
  }
  selectedOrder.value = updated
}

const pendingOrders = computed(() => {
  return orders.value.filter((o) => o.status === 'pending' || !o.delivery_approved_at).slice(0, 5)
})
</script>

<template>
  <div class="dashboard-page">
    <!-- Top Greeting & Actions Bar -->
    <div class="page-header">
      <div>
        <div class="subtitle-badge">
          <Sparkles :size="13" /> Live Store Intelligence
        </div>
        <h1>Executive Dashboard</h1>
        <p class="header-desc">
          Monitor real-time sales, order delivery approvals, and operational health.
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="router.push('/reports')">
          <TrendingUp :size="16" /> View Full Reports
        </button>
        <button class="btn btn-primary" @click="router.push('/orders')">
          <Truck :size="16" /> Manage Orders
        </button>
      </div>
    </div>

    <!-- 4 Key Metrics Cards -->
    <div class="stats-grid">
      <div class="stat-card glass-card">
        <div class="stat-head">
          <span class="stat-label">Total Gross Revenue</span>
          <div class="stat-icon icon-purple">
            <DollarSign :size="20" />
          </div>
        </div>
        <div class="stat-value">
          {{ formatMoney(metrics?.totalRevenue || 24680) }}
        </div>
        <div class="stat-footer">
          <span class="trend-badge positive">
            <ArrowUpRight :size="12" /> +18.4%
          </span>
          <span class="stat-sub">vs previous period</span>
        </div>
      </div>

      <div class="stat-card glass-card">
        <div class="stat-head">
          <span class="stat-label">Total Store Orders</span>
          <div class="stat-icon icon-blue">
            <ShoppingCart :size="20" />
          </div>
        </div>
        <div class="stat-value">
          {{ metrics?.totalOrders || orders.length }}
        </div>
        <div class="stat-footer">
          <span class="trend-badge positive">
            <ArrowUpRight :size="12" /> +9.2%
          </span>
          <span class="stat-sub">5 fulfilled today</span>
        </div>
      </div>

      <div class="stat-card glass-card">
        <div class="stat-head">
          <span class="stat-label">Pending Delivery Approvals</span>
          <div class="stat-icon icon-amber">
            <Truck :size="20" />
          </div>
        </div>
        <div class="stat-value">
          {{ pendingOrders.length }}
        </div>
        <div class="stat-footer">
          <span class="trend-badge warning" v-if="pendingOrders.length > 0">
            Action Required
          </span>
          <span class="trend-badge positive" v-else>
            All Cleared
          </span>
          <span class="stat-sub">Ready for shipment</span>
        </div>
      </div>

      <div class="stat-card glass-card">
        <div class="stat-head">
          <span class="stat-label">Active Catalog Products</span>
          <div class="stat-icon icon-emerald">
            <Package :size="20" />
          </div>
        </div>
        <div class="stat-value">
          {{ products.length || 6 }}
        </div>
        <div class="stat-footer">
          <span class="trend-badge positive">
            In Stock
          </span>
          <span class="stat-sub">Across 5 categories</span>
        </div>
      </div>
    </div>

    <!-- Charts & Analytics Section -->
    <div class="charts-grid">
      <!-- Sales Trend Line Chart -->
      <div class="chart-card glass-card">
        <div class="chart-header">
          <div>
            <h3>Revenue Velocity (This Week)</h3>
            <p class="chart-sub">Daily store checkout volume in USD</p>
          </div>
          <button class="btn btn-outline btn-sm" @click="router.push('/reports')">
            Deep Analysis <ArrowRight :size="13" />
          </button>
        </div>
        <ReportCharts
          type="line"
          :currency="true"
          :data="metrics?.salesByDay?.map(s => ({ label: s.date, value: s.revenue })) || [
            { label: 'Mon', value: 1420 },
            { label: 'Tue', value: 2180 },
            { label: 'Wed', value: 1890 },
            { label: 'Thu', value: 2840 },
            { label: 'Fri', value: 3650 },
            { label: 'Sat', value: 4120 },
            { label: 'Sun', value: 4890 },
          ]"
        />
      </div>

      <!-- Order Status Distribution Donut -->
      <div class="chart-card glass-card">
        <div class="chart-header">
          <div>
            <h3>Order Status Distribution</h3>
            <p class="chart-sub">Live breakdown across stages</p>
          </div>
        </div>
        <ReportCharts
          type="donut"
          :data="metrics?.ordersByStatus?.map(o => ({ label: o.status, value: o.count })) || [
            { label: 'pending', value: 2, color: '#f59e0b' },
            { label: 'processing', value: 1, color: '#3b82f6' },
            { label: 'shipped', value: 1, color: '#8b5cf6' },
            { label: 'delivered', value: 1, color: '#10b981' },
          ]"
        />
      </div>
    </div>

    <!-- Delivery Approval & Recent Orders Table -->
    <div class="table-section glass-card">
      <div class="section-header">
        <div>
          <h3>Orders & Delivery Approvals</h3>
          <p class="section-sub">Directly approve orders for warehouse dispatch (Laravel <code>/admin/orders</code>)</p>
        </div>
        <button class="btn btn-secondary btn-sm" @click="router.push('/orders')">
          View All Orders
        </button>
      </div>

      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Delivery Approval</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders.slice(0, 5)" :key="order.id">
              <td>
                <span class="order-link" @click="viewOrder(order)">
                  #{{ order.order_number || order.id }}
                </span>
              </td>
              <td>
                <div class="customer-cell">
                  <strong>{{ order.customer_name || order.user?.name || 'Customer' }}</strong>
                  <small>{{ order.customer_email || order.user?.email || 'N/A' }}</small>
                </div>
              </td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>
                <strong>{{ formatMoney(order.total_amount) }}</strong>
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
              <td>
                <span v-if="order.delivery_approved_at" class="badge badge-success">
                  <CheckCircle :size="12" /> Approved
                </span>
                <span v-else-if="order.status === 'delivered'" class="badge badge-neutral">
                  Delivered
                </span>
                <span v-else class="badge badge-warning">
                  <Clock :size="12" /> Awaiting Approval
                </span>
              </td>
              <td style="text-align: right;">
                <button class="btn btn-outline btn-sm" @click="viewOrder(order)">
                  <Eye :size="14" /> Review
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Order Inspection Modal -->
    <OrderDetailsModal
      :order="selectedOrder"
      :show="showOrderModal"
      @close="showOrderModal = false"
      @updated="handleOrderUpdated"
    />
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.subtitle-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  margin-bottom: 8px;
  border: 1px solid #c7d2fe;
}

.page-header h1 {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}

.header-desc {
  color: #64748b;
  font-size: 14px;
  margin-top: 4px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-purple {
  background: #f5f3ff;
  color: #7c3aed;
}
.icon-blue {
  background: #eff6ff;
  color: #2563eb;
}
.icon-amber {
  background: #fffbeb;
  color: #d97706;
}
.icon-emerald {
  background: #ecfdf5;
  color: #059669;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.stat-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  font-weight: 700;
  font-size: 11px;
}

.trend-badge.positive {
  background: #ecfdf5;
  color: #059669;
}

.trend-badge.warning {
  background: #fffbeb;
  color: #b45309;
}

.stat-sub {
  color: #94a3b8;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 20px;
}

.chart-card {
  padding: 24px;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.chart-header h3 {
  font-size: 16px;
  font-weight: 700;
}

.chart-sub {
  font-size: 12.5px;
  color: #64748b;
  margin-top: 2px;
}

/* Table Section */
.table-section {
  padding: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 700;
}

.section-sub {
  font-size: 12.5px;
  color: #64748b;
  margin-top: 2px;
}

.section-sub code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #4f46e5;
  font-size: 11.5px;
}

.order-link {
  font-weight: 700;
  color: #4f46e5;
  cursor: pointer;
}
.order-link:hover {
  text-decoration: underline;
}

.customer-cell {
  display: flex;
  flex-direction: column;
}

.customer-cell strong {
  font-size: 13px;
  color: #1e293b;
}

.customer-cell small {
  font-size: 11.5px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>