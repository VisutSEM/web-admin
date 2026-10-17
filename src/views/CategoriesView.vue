<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Package,
  FolderTree,
  RefreshCw,
} from 'lucide-vue-next'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '../services/api'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const categories = ref<Category[]>([])
const searchQuery = ref('')

const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref<string | number | null>(null)
const isSaving = ref(false)

const form = reactive({
  name: '',
  slug: '',
})

async function loadData() {
  loading.value = true
  try {
    categories.value = await getCategories()
  } catch (err: unknown) {
    toast.error('Failed to load categories', (err as Error).message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

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
  showModal.value = true
}

function openEditModal(cat: Category) {
  isEditing.value = true
  currentId.value = cat.id
  form.name = cat.name
  form.slug = cat.slug || slugify(cat.name)
  showModal.value = true
}

async function handleSave() {
  if (!form.name.trim()) {
    toast.warning('Validation Error', 'Category name is required')
    return
  }

  isSaving.value = true
  try {
    if (isEditing.value && currentId.value) {
      await updateCategory(currentId.value, { name: form.name, slug: form.slug })
      toast.success('Category Updated', `Category "${form.name}" has been updated.`)
    } else {
      await createCategory({ name: form.name, slug: form.slug })
      toast.success('Category Created', `Category "${form.name}" added successfully.`)
    }
    showModal.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error('Save Failed', (err as Error).message)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(cat: Category) {
  if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return
  try {
    await deleteCategory(cat.id)
    toast.success('Category Deleted', `"${cat.name}" removed.`)
    await loadData()
  } catch (err: unknown) {
    toast.error('Delete Failed', (err as Error).message)
  }
}

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter((c) => c.name.toLowerCase().includes(q) || (c.slug && c.slug.toLowerCase().includes(q)))
})
</script>

<template>
  <div class="categories-page">
    <div class="categories-header">
      <div>
        <h1>Categories Management</h1>
        <p class="subtitle">
          Organize store product hierarchy and taxonomy (<code>/admin/categories</code>).
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadData">
          <RefreshCw :size="15" :class="{ 'animate-spin': loading }" /> Refresh
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="16" /> Add Category
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
          placeholder="Search categories..."
          class="filter-input"
        />
      </div>
      <span class="count-tag">{{ filteredCategories.length }} Categories</span>
    </div>

    <!-- Table -->
    <div class="table-section glass-card">
      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Slug</th>
              <th>Items Linked</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in filteredCategories" :key="cat.id">
              <td>
                <div class="cat-cell">
                  <div class="cat-icon-box">
                    <Tags :size="16" />
                  </div>
                  <strong>{{ cat.name }}</strong>
                </div>
              </td>
              <td>
                <code class="slug-code">/{{ cat.slug || slugify(cat.name) }}</code>
              </td>
              <td>
                <span class="badge badge-neutral">
                  <Package :size="12" /> {{ cat.products_count ?? 6 }} Products
                </span>
              </td>
              <td>
                <span class="badge badge-success">
                  <span class="badge-dot"></span> Active
                </span>
              </td>
              <td style="text-align: right;">
                <div class="row-actions">
                  <button class="btn btn-sm btn-secondary" @click="openEditModal(cat)">
                    <Pencil :size="13" /> Edit
                  </button>
                  <button class="btn btn-sm btn-danger" @click="handleDelete(cat)">
                    <Trash2 :size="13" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredCategories.length === 0">
              <td colspan="5" class="empty-cell">
                <FolderTree :size="36" class="empty-icon" />
                <h4>No categories found</h4>
                <p>Create your first product category using the button above.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditing ? 'Edit Category' : 'Create New Category' }}
          </h3>
          <button class="btn-icon btn-secondary" @click="showModal = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Category Name *</label>
            <input
              type="text"
              class="form-input"
              :value="form.name"
              placeholder="e.g. Smartphones & Audio"
              @input="handleNameInput"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Slug</label>
            <input
              v-model="form.slug"
              type="text"
              class="form-input"
              placeholder="smartphones-audio"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="handleSave">
            {{ isSaving ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.categories-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.categories-header h1 {
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

.count-tag {
  font-size: 12.5px;
  color: #64748b;
  font-weight: 600;
}

.table-section {
  padding: 18px;
}

.cat-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cat-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-cell strong {
  font-size: 13.5px;
  color: #0f172a;
}

.slug-code {
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 4px;
  color: #475569;
  font-size: 12px;
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

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 650px) {
  .categories-header {
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
