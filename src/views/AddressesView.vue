<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Phone,
  User,
  RefreshCw,
  CheckCircle,
} from 'lucide-vue-next'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  type Address,
} from '../services/api'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const addresses = ref<Address[]>([])
const searchQuery = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref<string | number | null>(null)
const isSaving = ref(false)

const form = reactive({
  customer_name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'United States',
  phone: '',
  is_default: false,
})

async function loadData() {
  loading.value = true
  try {
    addresses.value = await getAddresses()
  } catch (err: unknown) {
    toast.error('Failed to load addresses', (err as Error).message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function openCreateModal() {
  isEditing.value = false
  currentId.value = null
  form.customer_name = ''
  form.address_line1 = ''
  form.address_line2 = ''
  form.city = ''
  form.state = ''
  form.postal_code = ''
  form.country = 'United States'
  form.phone = ''
  form.is_default = false
  showModal.value = true
}

function openEditModal(addr: Address) {
  isEditing.value = true
  currentId.value = addr.id
  form.customer_name = addr.customer_name || ''
  form.address_line1 = addr.address_line1
  form.address_line2 = addr.address_line2 || ''
  form.city = addr.city
  form.state = addr.state || ''
  form.postal_code = addr.postal_code
  form.country = addr.country || 'United States'
  form.phone = addr.phone || ''
  form.is_default = !!addr.is_default
  showModal.value = true
}

async function handleSave() {
  if (!form.address_line1.trim() || !form.city.trim()) {
    toast.warning('Validation Error', 'Address line 1 and City are required')
    return
  }

  isSaving.value = true
  try {
    const payload: Partial<Address> = { ...form }
    if (isEditing.value && currentId.value) {
      await updateAddress(currentId.value, payload)
      toast.success('Address Updated', 'Customer shipping address has been updated.')
    } else {
      await createAddress(payload)
      toast.success('Address Added', 'New customer shipping destination added.')
    }
    showModal.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error('Save Failed', (err as Error).message)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(addr: Address) {
  if (!confirm(`Delete address "${addr.address_line1}"?`)) return
  try {
    await deleteAddress(addr.id)
    toast.success('Address Deleted', 'Address record removed.')
    await loadData()
  } catch (err: unknown) {
    toast.error('Delete Failed', (err as Error).message)
  }
}

const filteredAddresses = computed(() => {
  if (!searchQuery.value.trim()) return addresses.value
  const q = searchQuery.value.toLowerCase()
  return addresses.value.filter(
    (a) =>
      a.address_line1.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      (a.customer_name && a.customer_name.toLowerCase().includes(q)) ||
      a.postal_code.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="addresses-page">
    <div class="addresses-header">
      <div>
        <h1>Shipping & Customer Addresses</h1>
        <p class="subtitle">
          Manage fulfillment destination records and default customer addresses (<code>/admin/address</code>).
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadData">
          <RefreshCw :size="15" :class="{ 'animate-spin': loading }" /> Refresh
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="16" /> Add Address
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="filters-bar glass-card">
      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by customer name, city, street, postal code..."
          class="filter-input"
        />
      </div>
      <span class="count-tag">{{ filteredAddresses.length }} Addresses</span>
    </div>

    <!-- Table -->
    <div class="table-section glass-card">
      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Street Address</th>
              <th>City & State</th>
              <th>Postal & Country</th>
              <th>Contact Phone</th>
              <th>Default</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="addr in filteredAddresses" :key="addr.id">
              <td>
                <div class="customer-cell">
                  <strong>{{ addr.customer_name || 'Valued Customer' }}</strong>
                  <small>ID #{{ addr.id }}</small>
                </div>
              </td>
              <td>
                <div class="street-cell">
                  <MapPin :size="15" class="pin-icon" />
                  <span>{{ addr.address_line1 }}</span>
                  <small v-if="addr.address_line2" class="line2">{{ addr.address_line2 }}</small>
                </div>
              </td>
              <td>
                <strong>{{ addr.city }}</strong><span v-if="addr.state">, {{ addr.state }}</span>
              </td>
              <td>
                <code>{{ addr.postal_code }}</code> ({{ addr.country }})
              </td>
              <td>
                <span v-if="addr.phone" class="phone-tag">
                  <Phone :size="12" /> {{ addr.phone }}
                </span>
                <span v-else class="text-muted">None</span>
              </td>
              <td>
                <span v-if="addr.is_default" class="badge badge-success">
                  <CheckCircle :size="12" /> Default
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td style="text-align: right;">
                <div class="row-actions">
                  <button class="btn btn-sm btn-secondary" @click="openEditModal(addr)">
                    <Pencil :size="13" /> Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="handleDelete(addr)">
                    <Trash2 :size="13" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredAddresses.length === 0">
              <td colspan="7" class="empty-cell">
                <MapPin :size="36" class="empty-icon" />
                <h4>No addresses recorded</h4>
                <p>Add a new address record to manage customer delivery destinations.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Address Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditing ? 'Edit Address Record' : 'Add New Address Record' }}
          </h3>
          <button class="btn-icon btn-secondary" @click="showModal = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Customer / Recipient Name</label>
            <input
              v-model="form.customer_name"
              type="text"
              class="form-input"
              placeholder="e.g. Elena Rostova"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Address Line 1 *</label>
            <input
              v-model="form.address_line1"
              type="text"
              class="form-input"
              placeholder="e.g. 742 Evergreen Terrace"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Address Line 2 (Apartment, Suite, Unit)</label>
            <input
              v-model="form.address_line2"
              type="text"
              class="form-input"
              placeholder="Suite 400"
            />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">City *</label>
              <input
                v-model="form.city"
                type="text"
                class="form-input"
                placeholder="San Francisco"
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">State / Province</label>
              <input
                v-model="form.state"
                type="text"
                class="form-input"
                placeholder="CA"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Postal / Zip Code *</label>
              <input
                v-model="form.postal_code"
                type="text"
                class="form-input"
                placeholder="94107"
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Country</label>
              <input
                v-model="form.country"
                type="text"
                class="form-input"
                placeholder="United States"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Contact Phone</label>
            <input
              v-model="form.phone"
              type="text"
              class="form-input"
              placeholder="+1 415 555 2671"
            />
          </div>

          <div class="checkbox-row">
            <label class="checkbox-label">
              <input v-model="form.is_default" type="checkbox" />
              <span>Set as default primary shipping address</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="handleSave">
            {{ isSaving ? 'Saving...' : isEditing ? 'Update Address' : 'Save Address' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.addresses-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.addresses-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.addresses-header h1 {
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

.customer-cell {
  display: flex;
  flex-direction: column;
}
.customer-cell strong {
  font-size: 13.5px;
  color: #0f172a;
}
.customer-cell small {
  font-size: 11px;
  color: #94a3b8;
}

.street-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.pin-icon {
  color: #6366f1;
  flex-shrink: 0;
}

.line2 {
  color: #64748b;
  margin-left: 4px;
}

.phone-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #334155;
}

.row-actions {
  display: inline-flex;
  gap: 6px;
  justify-content: flex-end;
}

.form-row {
  display: flex;
  gap: 14px;
}

.flex-1 {
  flex: 1;
}

.checkbox-row {
  margin-top: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
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
  .addresses-header {
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
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
