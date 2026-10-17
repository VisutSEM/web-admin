<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Printer,
  DollarSign,
  ShoppingCart,
  Truck,
  CheckCircle2,
  Percent,
  Package,
  Layers,
  ArrowUpRight,
} from 'lucide-vue-next'
import { getReportsData, type ReportMetrics } from '../services/api'
import ReportCharts from '../components/ReportCharts.vue'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const selectedRange = ref<'7d' | '30d' | 'month' | 'all'>('30d')
const metrics = ref<ReportMetrics | null>(null)

onMounted(async () => {
  try {
    metrics.value = await getReportsData()
  } catch (err) {
    console.error('Failed to load reports:', err)
  } finally {
    loading.value = false
  }
})

function formatMoney(amount: number | string | undefined) {
  const val = Number(amount) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

// Multipliers based on date range selection
const rangeMultiplier = computed(() => {
  switch (selectedRange.value) {
    case '7d': return 0.28
    case '30d': return 1.0
    case 'month': return 0.92
    case 'all': return 3.4
  }
})

const adjustedTotalRevenue = computed(() => (metrics.value?.totalRevenue || 24680) * rangeMultiplier.value)
const adjustedNetRevenue = computed(() => (metrics.value?.netRevenue || 21700) * rangeMultiplier.value)
const adjustedOrders = computed(() => Math.round((metrics.value?.totalOrders || 84) * rangeMultiplier.value))
const adjustedAOV = computed(() => (adjustedOrders.value > 0 ? adjustedTotalRevenue.value / adjustedOrders.value : 145))

function handleExportCSV() {
  if (!metrics.value) return
  const headers = ['Category / Metric', 'Value', 'Details']
  const rows = [
    ['Gross Revenue', formatMoney(adjustedTotalRevenue.value), 'Selected Range: ' + selectedRange.value],
    ['Net Revenue', formatMoney(adjustedNetRevenue.value), 'Est. after carrier & processing costs'],
    ['Total Orders', String(adjustedOrders.value), 'Orders processed'],
    ['Average Order Value (AOV)', formatMoney(adjustedAOV.value), 'Revenue / Valid Orders'],
    ['Pending Deliveries', String(metrics.value.pendingDeliveries), 'Awaiting dispatch approval'],
    ['Top Product 1', metrics.value.topProducts[0]?.name || 'UltraBook', formatMoney(metrics.value.topProducts[0]?.revenue || 0)],
    ['Top Product 2', metrics.value.topProducts[1]?.name || 'Headphones', formatMoney(metrics.value.topProducts[1]?.revenue || 0)],
    ['Top Product 3', metrics.value.topProducts[2]?.name || 'Smartwatch', formatMoney(metrics.value.topProducts[2]?.revenue || 0)],
  ]

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `ecommerce_admin_report_${selectedRange.value}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.success('Report Exported!', 'CSV report has been downloaded successfully.')
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="reports-page">
    <!-- Header with Filters & Export Actions -->
    <div class="reports-header">
      <div>
        <div class="page-tag">
          <BarChart3 :size="14" /> Commercial Intelligence
        </div>
        <h1>Performance Reports & Analytics</h1>
        <p class="reports-subtitle">
          Detailed financial audit, delivery efficiency, and product revenue statistics.
        </p>
      </div>

      <div class="reports-toolbar">
        <!-- Date range pill selector -->
        <div class="range-selector">
          <button
            class="range-btn"
            :class="{ active: selectedRange === '7d' }"
            @click="selectedRange = '7d'"
          >
            Last 7 Days
          </button>
          <button
            class="range-btn"
            :class="{ active: selectedRange === '30d' }"
            @click="selectedRange = '30d'"
          >
            Last 30 Days
          </button>
          <button
            class="range-btn"
            :class="{ active: selectedRange === 'month' }"
            @click="selectedRange = 'month'"
          >
            This Month
          </button>
          <button
            class="range-btn"
            :class="{ active: selectedRange === 'all' }"
            @click="selectedRange = 'all'"
          >
            All Time
          </button>
        </div>

        <button class="btn btn-secondary" @click="handlePrint">
          <Printer :size="15" /> Print
        </button>

        <button class="btn btn-primary" @click="handleExportCSV">
          <Download :size="15" /> Export CSV
        </button>
      </div>
    </div>

    <!-- Executive Summary Cards -->
    <div class="metrics-grid">
      <div class="metric-card glass-card">
        <div class="metric-top">
          <span>Gross Store Revenue</span>
          <div class="metric-icon bg-indigo">
            <DollarSign :size="18" />
          </div>
        </div>
        <div class="metric-main">
          <h2>{{ formatMoney(adjustedTotalRevenue) }}</h2>
          <span class="pill-badge positive">
            <ArrowUpRight :size="11" /> +16.8%
          </span>
        </div>
        <p class="metric-note">Before deductions & fulfillment fees</p>
      </div>

      <div class="metric-card glass-card">
        <div class="metric-top">
          <span>Estimated Net Revenue</span>
          <div class="metric-icon bg-emerald">
            <TrendingUp :size="18" />
          </div>
        </div>
        <div class="metric-main">
          <h2>{{ formatMoney(adjustedNetRevenue) }}</h2>
          <span class="pill-badge positive">
            <ArrowUpRight :size="11" /> +14.2%
          </span>
        </div>
        <p class="metric-note">Operating profit after estimated costs</p>
      </div>

      <div class="metric-card glass-card">
        <div class="metric-top">
          <span>Total Paid Orders</span>
          <div class="metric-icon bg-blue">
            <ShoppingCart :size="18" />
          </div>
        </div>
        <div class="metric-main">
          <h2>{{ adjustedOrders }}</h2>
          <span class="pill-badge positive">
            <ArrowUpRight :size="11" /> +8.5%
          </span>
        </div>
        <p class="metric-note">96.4% fulfillment success rate</p>
      </div>

      <div class="metric-card glass-card">
        <div class="metric-top">
          <span>Average Order Value (AOV)</span>
          <div class="metric-icon bg-purple">
            <Percent :size="18" />
          </div>
        </div>
        <div class="metric-main">
          <h2>{{ formatMoney(adjustedAOV) }}</h2>
          <span class="pill-badge positive">
            <ArrowUpRight :size="11" /> +$12.50
          </span>
        </div>
        <p class="metric-note">Average customer basket size</p>
      </div>
    </div>

    <!-- Visual Analytics: Line + Donut -->
    <div class="charts-row">
      <div class="chart-panel glass-card">
        <div class="panel-header">
          <div>
            <h3>Revenue & Sales Trendline</h3>
            <p class="panel-sub">Paced revenue trajectory over selected duration</p>
          </div>
        </div>

        <ReportCharts
          type="line"
          :currency="true"
          :data="metrics?.salesByDay?.map(s => ({
            label: s.date,
            value: Math.round(s.revenue * rangeMultiplier),
          })) || []"
        />
      </div>

      <div class="chart-panel glass-card">
        <div class="panel-header">
          <div>
            <h3>Delivery & Fulfillment Status</h3>
            <p class="panel-sub">Pending approvals vs dispatched orders</p>
          </div>
        </div>

        <ReportCharts
          type="donut"
          :data="metrics?.ordersByStatus?.map(o => ({
            label: o.status,
            value: o.count,
          })) || []"
        />
      </div>
    </div>

    <!-- Category Breakdown & Top Products Row -->
    <div class="charts-row">
      <!-- Category Distribution Bar Chart -->
      <div class="chart-panel glass-card">
        <div class="panel-header">
          <div>
            <h3>Revenue by Category</h3>
            <p class="panel-sub">Share of volume generated by department</p>
          </div>
        </div>

        <ReportCharts
          type="bar"
          :currency="true"
          :data="metrics?.revenueByCategory?.map(c => ({
            label: c.category,
            value: Math.round(c.revenue * rangeMultiplier),
          })) || []"
        />
      </div>

      <!-- Top Selling Products Table -->
      <div class="chart-panel glass-card">
        <div class="panel-header">
          <div>
            <h3>Top Performing Products</h3>
            <p class="panel-sub">Highest revenue products in this cycle</p>
          </div>
        </div>

        <div class="table-container">
          <table class="modern-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Stock</th>
                <th style="text-align: right;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(prod, index) in metrics?.topProducts?.slice(0, 4) || []" :key="prod.id">
                <td>
                  <span class="rank-badge" :class="`rank-${index + 1}`">#{{ index + 1 }}</span>
                </td>
                <td>
                  <div class="prod-cell">
                    <strong>{{ prod.name }}</strong>
                  </div>
                </td>
                <td>{{ Math.round(prod.salesCount * rangeMultiplier) }} units</td>
                <td>
                  <span class="badge" :class="prod.stock < 10 ? 'badge-danger' : 'badge-success'">
                    {{ prod.stock }} left
                  </span>
                </td>
                <td style="text-align: right; font-weight: 700;">
                  {{ formatMoney(prod.revenue * rangeMultiplier) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.reports-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.page-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f3ff;
  color: #7c3aed;
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  margin-bottom: 8px;
  border: 1px solid #ddd6fe;
}

.reports-header h1 {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}

.reports-subtitle {
  color: #64748b;
  font-size: 14px;
  margin-top: 4px;
}

.reports-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-selector {
  display: flex;
  background: #f1f5f9;
  padding: 3px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.range-btn {
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.range-btn:hover {
  color: #0f172a;
}

.range-btn.active {
  background: #ffffff;
  color: #4f46e5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.metric-card {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
}

.metric-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-indigo { background: #eef2ff; color: #4f46e5; }
.bg-emerald { background: #ecfdf5; color: #059669; }
.bg-blue { background: #eff6ff; color: #2563eb; }
.bg-purple { background: #f5f3ff; color: #7c3aed; }

.metric-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.metric-main h2 {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}

.pill-badge {
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.pill-badge.positive {
  background: #ecfdf5;
  color: #059669;
}

.metric-note {
  font-size: 11.5px;
  color: #94a3b8;
}

/* Charts Row */
.charts-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.chart-panel {
  padding: 24px;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 700;
}

.panel-sub {
  font-size: 12.5px;
  color: #64748b;
  margin-top: 2px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
}
.rank-1 { background: #fef3c7; color: #b45309; }
.rank-2 { background: #f1f5f9; color: #475569; }
.rank-3 { background: #ffedd5; color: #c2410c; }
.rank-4 { background: #f8fafc; color: #64748b; }

.prod-cell strong {
  font-size: 13px;
  color: #1e293b;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .reports-header {
    flex-direction: column;
    align-items: stretch;
  }
  .reports-toolbar {
    flex-wrap: wrap;
  }
}

@media print {
  .reports-toolbar,
  :deep(.sidebar),
  :deep(.navbar) {
    display: none !important;
  }
  :deep(.main-area) {
    margin-left: 0 !important;
  }
  .glass-card {
    box-shadow: none !important;
    border: 1px solid #ccc !important;
  }
}
</style>
