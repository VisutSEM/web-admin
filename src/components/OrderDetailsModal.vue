<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  type Order,
  type OrderStatus,
  approveOrderDelivery,
  markOrderDelivered,
  updateAdminOrderStatus,
} from '../services/api'
import { useToastStore } from '../stores/toast'
import {
  X,
  Package,
  Truck,
  CheckCircle,
  Clock,
  User as UserIcon,
  MapPin,
  CreditCard,
  AlertCircle,
  FileText,
  Phone,
  Mail,
} from 'lucide-vue-next'

const props = defineProps<{
  order: Order | null
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated', order: Order): void
}>()

const toast = useToastStore()
const isProcessing = ref(false)

function formatMoney(amount: number | string | undefined) {
  const val = Number(amount) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function formatPaymentMethod(method?: string) {
  if (!method) return 'Cash On Delivery'
  if (method === 'aba_pay') return 'ABA Pay (KHQR)'
  if (method === 'cash_on_delivery') return 'Cash On Delivery (COD)'
  if (method === 'wing') return 'Wing Bank'
  if (method === 'pipay') return 'Pi Pay'
  if (method === 'stripe') return 'Stripe Credit Card'
  return method.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

async function handleApproveDelivery() {
  if (!props.order) return
  isProcessing.value = true
  try {
    const updated = await approveOrderDelivery(props.order.id)
    toast.success('Delivery Approved!', `Order #${props.order.order_number || props.order.id} is now approved for dispatch.`)
    emit('updated', updated)
  } catch (err: unknown) {
    toast.error('Failed to approve delivery', (err as Error).message)
  } finally {
    isProcessing.value = false
  }
}

async function handleMarkDelivered() {
  if (!props.order) return
  isProcessing.value = true
  try {
    const updated = await markOrderDelivered(props.order.id)
    toast.success('Order Completed!', `Order #${props.order.order_number || props.order.id} marked as Delivered.`)
    emit('updated', updated)
  } catch (err: unknown) {
    toast.error('Failed to update status', (err as Error).message)
  } finally {
    isProcessing.value = false
  }
}

async function handleStatusChange(event: Event) {
  if (!props.order) return
  const select = event.target as HTMLSelectElement
  const newStatus = select.value as OrderStatus
  isProcessing.value = true
  try {
    const updated = await updateAdminOrderStatus(props.order.id, newStatus)
    toast.success('Status Updated', `Order status changed to ${newStatus}`)
    emit('updated', updated)
  } catch (err: unknown) {
    toast.error('Failed to update status', (err as Error).message)
  } finally {
    isProcessing.value = false
  }
}

const customerAvatar = computed(() => {
  return props.order?.user?.profile_picture || null
})

const customerInitial = computed(() => {
  const name = props.order?.customer_name || props.order?.user?.name || 'Customer'
  return name.charAt(0).toUpperCase()
})
</script>

<template>
  <div v-if="show && order" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-dialog order-modal">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="order-title-box">
          <div class="order-badge-row">
            <span class="order-id">#{{ order.order_number || order.id }}</span>
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
            <span v-if="order.delivery_approved_at || order.status === 'delivered'" class="badge badge-success">
              <CheckCircle :size="12" /> Delivery Approved
            </span>
          </div>
          <span class="order-date">Created on {{ formatDate(order.created_at) }}</span>
        </div>

        <button class="btn-icon btn-secondary" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <!-- Quick Delivery Actions Banner -->
        <div class="action-banner">
          <div class="action-info">
            <strong>Fulfillment & Delivery Action</strong>
            <p v-if="order.status === 'pending'">
              Order is awaiting warehouse confirmation. Click below to approve delivery and mark payment as confirmed.
            </p>
            <p v-else-if="order.status === 'delivered'">
              Order delivery has been confirmed and fulfilled.
            </p>
            <p v-else-if="order.status === 'cancelled'">
              This order has been cancelled.
            </p>
            <p v-else>
              Order is currently {{ order.status }}.
            </p>
          </div>

          <div class="action-btns">
            <button
              v-if="order.status === 'pending'"
              class="btn btn-primary btn-sm"
              :disabled="isProcessing"
              @click="handleApproveDelivery"
            >
              <Truck :size="15" /> Approve Delivery
            </button>
            <button
              v-if="order.status !== 'delivered' && order.status !== 'cancelled'"
              class="btn btn-success btn-sm"
              :disabled="isProcessing"
              @click="handleMarkDelivered"
            >
              <CheckCircle :size="15" /> Mark Delivered
            </button>
          </div>
        </div>

        <!-- 4 Key Info Cards Grid -->
        <div class="order-details-grid">
          <!-- Customer Info -->
          <div class="detail-card">
            <div class="card-title">
              <UserIcon :size="15" /> Customer Profile
            </div>
            <div class="customer-profile-cell">
              <img
                v-if="customerAvatar"
                :src="customerAvatar"
                alt="Avatar"
                class="customer-avatar-img"
              />
              <div v-else class="customer-avatar-fallback">
                {{ customerInitial }}
              </div>
              <div class="customer-text">
                <strong>{{ order.customer_name || order.user?.name || 'Customer' }}</strong>
                <span class="customer-email">
                  <Mail :size="12" /> {{ order.customer_email || order.user?.email || 'N/A' }}
                </span>
                <span v-if="order.customer_phone || order.user?.phone" class="customer-phone">
                  <Phone :size="12" /> {{ order.customer_phone || order.user?.phone }}
                </span>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="detail-card">
            <div class="card-title">
              <MapPin :size="15" /> Delivery Address
            </div>
            <div class="card-content">
              <p class="address-text">
                {{ typeof order.shipping_address === 'string' ? order.shipping_address : 'Daun Penh (Central), Phnom Penh, Cambodia' }}
              </p>
              <div v-if="order.notes" class="order-notes-box">
                <FileText :size="12" />
                <small>Notes: {{ order.notes }}</small>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="detail-card">
            <div class="card-title">
              <CreditCard :size="15" /> Payment Method & Status
            </div>
            <div class="card-content">
              <div class="badge-status-row">
                <span class="badge" :class="order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'">
                  {{ order.payment_status === 'paid' ? 'Paid' : 'Unpaid' }}
                </span>
                <span class="payment-method-tag">{{ formatPaymentMethod(order.payment_method) }}</span>
              </div>
              <p class="mt-2 text-total">
                Total Billed: <strong>{{ formatMoney(order.total_amount) }}</strong>
              </p>
            </div>
          </div>

          <!-- Status Control -->
          <div class="detail-card">
            <div class="card-title">
              <Clock :size="15" /> Manage Status
            </div>
            <div class="card-content">
              <label class="form-label">Order Stage:</label>
              <select
                class="form-select"
                :value="order.status"
                :disabled="isProcessing"
                @change="handleStatusChange"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Items Table with Real Images -->
        <div class="order-items-section">
          <h4>Order Items ({{ (order.items || []).length }})</h4>
          <div class="table-container">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items || []" :key="item.id">
                  <td>
                    <div class="product-item-cell">
                      <div class="product-thumb">
                        <img
                          v-if="item.product_image || item.image || item.product?.image"
                          :src="item.product_image || item.image || item.product?.image"
                          alt="Product thumbnail"
                          class="thumb-img"
                        />
                        <Package v-else :size="18" />
                      </div>
                      <div class="product-names">
                        <span class="item-name">{{ item.product_name }}</span>
                        <small v-if="item.product?.slug" class="item-slug">SKU: {{ item.product.slug }}</small>
                      </div>
                    </div>
                  </td>
                  <td>{{ formatMoney(item.price) }}</td>
                  <td>
                    <span class="qty-pill">{{ item.quantity }}x</span>
                  </td>
                  <td style="text-align: right; font-weight: 700;">
                    {{ formatMoney(item.subtotal || Number(item.price) * item.quantity) }}
                  </td>
                </tr>

                <tr v-if="!order.items || order.items.length === 0">
                  <td colspan="4" class="text-center text-muted" style="padding: 24px;">
                    No items in this order.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Total Calculation Breakdown -->
          <div class="order-summary-box">
            <div class="summary-line">
              <span>Items Subtotal:</span>
              <span>{{ formatMoney(Number(order.total_amount) - (Number(order.shipping_amount || order.shipping_fee) || 0)) }}</span>
            </div>
            <div class="summary-line">
              <span>Shipping Delivery Fee:</span>
              <span>{{ Number(order.shipping_amount || order.shipping_fee) > 0 ? formatMoney(order.shipping_amount || order.shipping_fee) : 'Free ($0.00)' }}</span>
            </div>
            <div class="summary-line total-line">
              <span>Grand Total:</span>
              <span class="grand-total-amount">{{ formatMoney(order.total_amount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-modal {
  max-width: 760px;
}

.order-title-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-id {
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
}

.order-date {
  font-size: 12.5px;
  color: #64748b;
}

.action-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-md);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.action-info strong {
  color: #166534;
  font-size: 13.5px;
  display: block;
}

.action-info p {
  color: #15803d;
  font-size: 12.5px;
  margin-top: 2px;
}

.action-btns {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.order-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-card {
  background: #f8fafc;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 14px;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.customer-profile-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-avatar-img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.customer-avatar-fallback {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
}

.customer-text {
  display: flex;
  flex-direction: column;
}

.customer-text strong {
  font-size: 14px;
  color: #0f172a;
}

.customer-email,
.customer-phone {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.address-text {
  font-size: 13px;
  color: #1e293b;
  line-height: 1.4;
}

.order-notes-box {
  margin-top: 8px;
  padding: 6px 10px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 6px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 6px;
}

.badge-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.payment-method-tag {
  font-size: 12.5px;
  font-weight: 600;
  color: #334155;
}

.text-total {
  font-size: 13px;
  color: #475569;
  margin-top: 6px;
}

.text-total strong {
  font-size: 15px;
  color: #0f172a;
}

.order-items-section h4 {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
}

.product-item-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #f1f5f9;
  border: 1px solid var(--border-light);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  flex-shrink: 0;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-names {
  display: flex;
  flex-direction: column;
}

.item-name {
  font-weight: 600;
  color: #0f172a;
  font-size: 13.5px;
}

.item-slug {
  font-size: 11px;
  color: #94a3b8;
}

.qty-pill {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.order-summary-box {
  margin-top: 16px;
  background: #f8fafc;
  border-radius: var(--radius-md);
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 340px;
  margin-left: auto;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
}

.total-line {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  border-top: 1px solid var(--border-light);
  padding-top: 8px;
  margin-top: 4px;
}

.grand-total-amount {
  font-size: 17px;
  font-weight: 800;
  color: #4f46e5;
}

@media (max-width: 650px) {
  .order-details-grid {
    grid-template-columns: 1fr;
  }
  .action-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
