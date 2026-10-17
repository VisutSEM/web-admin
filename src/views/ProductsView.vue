<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import {
  Package,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  X,
  CheckCircle2,
  Eye,
  RefreshCw,
} from 'lucide-vue-next'
import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
  type Category,
} from '../services/api'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const searchQuery = ref('')
const selectedCategoryId = ref<string>('all')

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref<string | number | null>(null)
const isSaving = ref(false)

const form = reactive({
  name: '',
  slug: '',
  price: 99.99,
  description: '',
  category_id: '' as string | number,
  stock: 20,
  image_url: '',
  image_file: null as File | null,
})

async function loadData() {
  loading.value = true
  try {
    const [prods, cats] = await Promise.all([getProducts(), getCategories()])
    products.value = prods
    categories.value = cats
  } catch (err: unknown) {
    toast.error('Failed to load products', (err as Error).message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function formatMoney(amount: number | string | undefined) {
  const val = Number(amount) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
}

function handleNameInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  form.name = val
  if (!isEditing.value) {
    form.slug = slugify(val)
  }
}

function openCreateModal() {
  isEditing.value = false
  currentId.value = null
  form.name = ''
  form.slug = ''
  form.price = 99.99
  form.description = ''
  form.category_id = categories.value[0]?.id || ''
  form.stock = 25
  form.image_url = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
  form.image_file = null
  showModal.value = true
}

function openEditModal(prod: Product) {
  isEditing.value = true
  currentId.value = prod.id
  form.name = prod.name
  form.slug = prod.slug
  form.price = Number(prod.price)
  form.description = prod.description || ''
  form.category_id = prod.category_id || prod.category?.id || ''
  form.stock = prod.stock ?? 20
  form.image_url = prod.image || prod.image_url || ''
  form.image_file = null
  showModal.value = true
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    form.image_file = target.files[0]
    form.image_url = URL.createObjectURL(target.files[0])
  }
}

async function handleSave() {
  if (!form.name.trim()) {
    toast.warning('Validation Error', 'Product name is required')
    return
  }

  isSaving.value = true
  try {
    const data = new FormData()
    data.append('name', form.name)
    data.append('slug', form.slug || slugify(form.name))
    data.append('price', String(form.price))
    data.append('description', form.description)
    if (form.category_id) {
      data.append('category_id', String(form.category_id))
    }
    data.append('stock', String(form.stock))
    if (form.image_file) {
      data.append('image', form.image_file)
    }

    if (isEditing.value && currentId.value) {
      await updateProduct(currentId.value, data)
      toast.success('Product Updated', `"${form.name}" has been updated successfully.`)
    } else {
      await createProduct(data)
      toast.success('Product Created', `"${form.name}" has been added to catalog.`)
    }

    showModal.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error('Save Failed', (err as Error).message)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(prod: Product) {
  if (!confirm(`Are you sure you want to delete "${prod.name}"?`)) return
  try {
    await deleteProduct(prod.id)
    toast.success('Product Removed', `"${prod.name}" deleted.`)
    await loadData()
  } catch (err: unknown) {
    toast.error('Delete Failed', (err as Error).message)
  }
}

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    if (selectedCategoryId.value !== 'all' && String(p.category_id) !== String(selectedCategoryId.value)) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    }
    return true
  })
})
</script>

<template>
  <div class="products-page">
    <!-- Header -->
    <div class="products-header">
      <div>
        <h1>Products Management</h1>
        <p class="subtitle">
          Manage catalog items, pricing, inventory stock, and categories (<code>/admin/products</code>).
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadData">
          <RefreshCw :size="15" :class="{ 'animate-spin': loading }" /> Refresh
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="16" /> Add Product
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
          placeholder="Search products by title, slug..."
          class="filter-input"
        />
      </div>

      <div class="category-filter">
        <select v-model="selectedCategoryId" class="form-select select-compact">
          <option value="all">All Categories ({{ products.length }})</option>
          <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">
            {{ cat.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Products Table -->
    <div class="table-section glass-card">
      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Inventory</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prod in filteredProducts" :key="prod.id">
              <td>
                <div class="product-cell">
                  <div class="product-thumb">
                    <img
                      v-if="prod.image || prod.image_url"
                      :src="prod.image || prod.image_url"
                      alt="Product thumbnail"
                      class="thumb-img"
                    />
                    <Package v-else :size="18" />
                  </div>
                  <div class="product-info">
                    <strong>{{ prod.name }}</strong>
                    <small class="slug-tag">/{{ prod.slug }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge badge-purple">
                  {{ prod.category?.name || categories.find(c => String(c.id) === String(prod.category_id))?.name || 'General' }}
                </span>
              </td>
              <td>
                <strong class="price-val">{{ formatMoney(prod.price) }}</strong>
              </td>
              <td>
                <span class="badge" :class="(prod.stock ?? 20) < 10 ? 'badge-danger' : 'badge-success'">
                  {{ prod.stock ?? 20 }} in stock
                </span>
              </td>
              <td>
                <span class="badge badge-success">
                  <span class="badge-dot"></span> Active
                </span>
              </td>
              <td style="text-align: right;">
                <div class="row-actions">
                  <button class="btn btn-sm btn-secondary" @click="openEditModal(prod)">
                    <Pencil :size="13" /> Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="handleDelete(prod)">
                    <Trash2 :size="13" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="empty-cell">
                <Package :size="36" class="empty-icon" />
                <h4>No products match your criteria</h4>
                <p>Adjust your search term or select another category filter.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Product Create/Edit Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditing ? 'Edit Catalog Product' : 'Add New Product' }}
          </h3>
          <button class="btn-icon btn-secondary" @click="showModal = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Product Name *</label>
            <input
              type="text"
              class="form-input"
              :value="form.name"
              placeholder="e.g. Wireless Noise-Cancelling Headphones"
              @input="handleNameInput"
            />
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">URL Slug</label>
              <input
                v-model="form.slug"
                type="text"
                class="form-input"
                placeholder="auto-generated-slug"
              />
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Price (USD) *</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label">Category</label>
              <select v-model="form.category_id" class="form-select">
                <option value="">Select Category</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label class="form-label">Inventory Stock</label>
              <input
                v-model.number="form.stock"
                type="number"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="form.description"
              class="form-textarea"
              placeholder="Detailed description and specifications..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Product Image</label>
            <div class="image-upload-box">
              <img
                v-if="form.image_url"
                :src="form.image_url"
                alt="Preview"
                class="img-preview"
              />
              <div class="upload-controls">
                <input
                  type="file"
                  accept="image/*"
                  class="file-input"
                  @change="handleFileSelect"
                />
                <span class="file-hint">Upload high-res product photo (PNG, JPG, WebP)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="handleSave">
            {{ isSaving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.products-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.products-header h1 {
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
  width: 320px;
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

.select-compact {
  width: 220px;
}

.table-section {
  padding: 18px;
}

.product-cell {
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

.product-info {
  display: flex;
  flex-direction: column;
}

.product-info strong {
  font-size: 13.5px;
  color: #0f172a;
}

.slug-tag {
  color: #94a3b8;
  font-size: 11.5px;
}

.price-val {
  color: #0f172a;
  font-size: 14px;
}

.row-actions {
  display: inline-flex;
  gap: 6px;
  justify-content: flex-end;
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

/* Modal Form Styles */
.form-row {
  display: flex;
  gap: 14px;
}

.flex-1 {
  flex: 1;
}

.image-upload-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  background: #f8fafc;
  border: 1px dashed var(--border-light);
  border-radius: var(--radius-md);
}

.img-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--border-light);
}

.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-hint {
  font-size: 11px;
  color: #94a3b8;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 700px) {
  .products-header {
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
  .select-compact {
    width: 100%;
  }
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
