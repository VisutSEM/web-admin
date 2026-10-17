<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-vue-next'
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  type Banner,
} from '../services/api'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
const loading = ref(true)
const banners = ref<Banner[]>([])

const showModal = ref(false)
const isEditing = ref(false)
const currentId = ref<string | number | null>(null)
const isSaving = ref(false)

const form = reactive({
  title: '',
  image_url: '',
  image_file: null as File | null,
  link: '/products',
  is_active: true,
})

async function loadData() {
  loading.value = true
  try {
    banners.value = await getBanners()
  } catch (err: unknown) {
    toast.error('Failed to load banners', (err as Error).message)
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
  form.title = ''
  form.image_url = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80'
  form.image_file = null
  form.link = '/products'
  form.is_active = true
  showModal.value = true
}

function openEditModal(banner: Banner) {
  isEditing.value = true
  currentId.value = banner.id
  form.title = banner.title
  form.image_url = banner.image || banner.image_url || ''
  form.image_file = null
  form.link = banner.link || '/products'
  form.is_active = banner.is_active !== false
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
  if (!form.title.trim()) {
    toast.warning('Validation Error', 'Banner title is required')
    return
  }

  isSaving.value = true
  try {
    const data = new FormData()
    data.append('title', form.title)
    data.append('link', form.link)
    if (form.image_file) {
      data.append('image', form.image_file)
    }

    if (isEditing.value && currentId.value) {
      await updateBanner(currentId.value, data)
      toast.success('Banner Updated', `"${form.title}" updated.`)
    } else {
      await createBanner(data)
      toast.success('Banner Created', `"${form.title}" added to showcase.`)
    }
    showModal.value = false
    await loadData()
  } catch (err: unknown) {
    toast.error('Save Failed', (err as Error).message)
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(banner: Banner) {
  if (!confirm(`Delete banner "${banner.title}"?`)) return
  try {
    await deleteBanner(banner.id)
    toast.success('Banner Removed', `"${banner.title}" deleted.`)
    await loadData()
  } catch (err: unknown) {
    toast.error('Delete Failed', (err as Error).message)
  }
}
</script>

<template>
  <div class="banners-page">
    <div class="banners-header">
      <div>
        <h1>Promotional Banners</h1>
        <p class="subtitle">
          Showcase hero marketing sliders and mobile app campaign banners (<code>/admin/banners</code>).
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadData">
          <RefreshCw :size="15" :class="{ 'animate-spin': loading }" /> Refresh
        </button>
        <button class="btn btn-primary" @click="openCreateModal">
          <Plus :size="16" /> Add New Banner
        </button>
      </div>
    </div>

    <!-- Banners Grid Visual Showcase -->
    <div class="banners-grid">
      <div v-for="banner in banners" :key="banner.id" class="banner-card glass-card">
        <div class="banner-preview">
          <img
            :src="banner.image || banner.image_url"
            :alt="banner.title"
            class="banner-img"
          />
          <div class="banner-badge-pos">
            <span class="badge" :class="banner.is_active !== false ? 'badge-success' : 'badge-neutral'">
              {{ banner.is_active !== false ? 'Active Hero' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="banner-content">
          <h4>{{ banner.title }}</h4>
          <div class="banner-link-row">
            <span class="link-label">Target Route:</span>
            <code class="link-code">{{ banner.link || '/products' }}</code>
          </div>

          <div class="banner-footer">
            <button class="btn btn-sm btn-secondary" @click="openEditModal(banner)">
              <Pencil :size="13" /> Edit
            </button>
            <button class="btn btn-sm btn-danger" @click="handleDelete(banner)">
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="banners.length === 0" class="empty-banner-box glass-card">
        <ImageIcon :size="40" class="empty-icon" />
        <h4>No promotional banners</h4>
        <p>Create banners to feature sales and seasonal releases.</p>
        <button class="btn btn-primary mt-3" @click="openCreateModal">
          <Plus :size="15" /> Create First Banner
        </button>
      </div>
    </div>

    <!-- Banner Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ isEditing ? 'Edit Promotional Banner' : 'Create Hero Banner' }}
          </h3>
          <button class="btn-icon btn-secondary" @click="showModal = false">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Banner Title *</label>
            <input
              v-model="form.title"
              type="text"
              class="form-input"
              placeholder="e.g. Cyber Tech Gala - 40% Off"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Target Deep Link / Route</label>
            <input
              v-model="form.link"
              type="text"
              class="form-input"
              placeholder="/products?category=1"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Banner Image Upload</label>
            <div class="banner-upload-box">
              <img
                v-if="form.image_url"
                :src="form.image_url"
                alt="Preview"
                class="banner-preview-img"
              />
              <div class="upload-actions">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleFileSelect"
                />
                <small class="upload-hint">Recommended aspect ratio: 16:9 or 21:9 ultra-wide (1200x500)</small>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="handleSave">
            {{ isSaving ? 'Saving...' : isEditing ? 'Update Banner' : 'Create Banner' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banners-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.banners-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.banners-header h1 {
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

.banners-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.banner-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.banner-preview {
  position: relative;
  width: 100%;
  height: 160px;
  background: #0f172a;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-badge-pos {
  position: absolute;
  top: 12px;
  right: 12px;
}

.banner-content {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.banner-content h4 {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
}

.banner-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.link-label {
  color: #64748b;
}

.link-code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #4f46e5;
}

.banner-footer {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.banner-upload-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f8fafc;
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-light);
}

.banner-preview-img {
  width: 100%;
  height: 130px;
  object-fit: cover;
  border-radius: 8px;
}

.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-hint {
  font-size: 11px;
  color: #94a3b8;
}

.empty-banner-box {
  grid-column: 1 / -1;
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  color: #cbd5e1;
}

.mt-3 {
  margin-top: 12px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1100px) {
  .banners-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 650px) {
  .banners-grid {
    grid-template-columns: 1fr;
  }
  .banners-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
