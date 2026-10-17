<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { AlertCircle, ImagePlus, Pencil, Plus, RefreshCw, Save, Trash2, X } from 'lucide-vue-next'
import {
  createResource,
  deleteResource,
  listResource,
  updateResource,
  type ApiRecord,
  type ResourceName,
} from '../services/api'

type FieldType = 'text' | 'number' | 'textarea' | 'file'
type Field = { key: string; label: string; type: FieldType; required?: boolean }

const route = useRoute()
const resource = computed(() => route.name as ResourceName)

const configs: Record<ResourceName, { title: string; singular: string; fields: Field[] }> = {
  categories: {
    title: 'Categories',
    singular: 'category',
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true }],
  },
  products: {
    title: 'Products',
    singular: 'product',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'category_id', label: 'Category ID', type: 'number' },
      { key: 'image', label: 'Image', type: 'file' },
    ],
  },
  banners: {
    title: 'Banners',
    singular: 'banner',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'image', label: 'Image', type: 'file', required: true },
    ],
  },
}

const defaultConfig: { title: string; singular: string; fields: Field[] } = {
  title: 'Products',
  singular: 'product',
  fields: [],
}

const config = computed(() => configs[resource.value] ?? defaultConfig)
const records = ref<ApiRecord[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const editingId = ref<number | string | null>(null)
const slugManuallyEdited = ref(false)
const form = reactive<Record<string, string | number | File | null>>({})

function resetForm() {
  editingId.value = null
  slugManuallyEdited.value = false
  for (const field of config.value.fields) form[field.key] = field.type === 'file' ? null : ''
}

function openEdit(record: ApiRecord) {
  editingId.value = record.id
  slugManuallyEdited.value = true
  for (const field of config.value.fields) {
    form[field.key] = field.type === 'file' ? null : ((record[field.key] as string | number) ?? '')
  }
}

function handleFile(event: Event, key: string) {
  const input = event.target as HTMLInputElement
  form[key] = input.files?.[0] ?? null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function handleNameInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  form.name = value
  if (resource.value === 'products' && !slugManuallyEdited.value) {
    form.slug = slugify(value)
  }
}

function handleSlugInput(event: Event) {
  slugManuallyEdited.value = true
  form.slug = (event.target as HTMLInputElement).value
}

function payload() {
  if (resource.value === 'products' || resource.value === 'banners') {
    const data = new FormData()
    for (const field of config.value.fields) {
      const value = form[field.key]
      if (value !== null && value !== '') data.append(field.key, value instanceof File ? value : String(value))
    }
    return data
  }

  return Object.fromEntries(
    config.value.fields
      .filter((field) => form[field.key] !== null && form[field.key] !== '')
      .map((field) => [field.key, form[field.key]]),
  )
}

async function loadRecords() {
  loading.value = true
  error.value = ''
  try {
    records.value = await listResource(resource.value)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (editingId.value === null) {
      await createResource(resource.value, payload())
    } else {
      await updateResource(resource.value, editingId.value, payload())
    }
    resetForm()
    await loadRecords()
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    saving.value = false
  }
}

async function remove(record: ApiRecord) {
  if (!window.confirm(`Delete this ${config.value.singular}?`)) return
  error.value = ''
  try {
    await deleteResource(resource.value, record.id)
    if (editingId.value === record.id) resetForm()
    await loadRecords()
  } catch (err) {
    error.value = getErrorMessage(err)
  }
}

function getErrorMessage(err: unknown) {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response
    return response?.data?.message || 'The API request failed.'
  }
  return err instanceof Error ? err.message : 'The API request failed.'
}

onMounted(() => {
  resetForm()
  loadRecords()
})
</script>

<template>
  <section class="resource-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Admin API</p>
        <h1>{{ config.title }}</h1>
        <p>Manage {{ config.title.toLowerCase() }} from your Laravel API.</p>
      </div>
      <button class="button secondary" type="button" :disabled="loading" @click="loadRecords">
        <RefreshCw :size="16" /> Refresh
      </button>
    </header>

    <div v-if="error" class="alert"><AlertCircle :size="18" /> {{ error }}</div>

    <div class="resource-grid">
      <form class="panel form-panel" @submit.prevent="save">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">{{ editingId === null ? 'New record' : 'Editing record' }}</p>
            <h2>{{ editingId === null ? `Add ${config.singular}` : `Edit ${config.singular}` }}</h2>
          </div>
          <button v-if="editingId !== null" class="icon-button" type="button" title="Cancel editing" @click="resetForm"><X :size="17" /></button>
        </div>

        <label v-for="field in config.fields" :key="field.key">
          <span>{{ field.label }}<b v-if="field.required"> *</b></span>
          <textarea
            v-if="field.type === 'textarea'"
            :value="String(form[field.key] ?? '')"
            rows="4"
            :required="field.required"
            @input="form[field.key] = ($event.target as HTMLTextAreaElement).value"
          />
          <input v-else-if="field.type === 'file'" type="file" accept="image/*" :required="field.required && editingId === null" @change="handleFile($event, field.key)" />
          <input
            v-else-if="resource === 'products' && field.key === 'name'"
            :value="String(form[field.key] ?? '')"
            :type="field.type"
            :required="field.required"
            @input="handleNameInput"
          />
          <input
            v-else-if="resource === 'products' && field.key === 'slug'"
            :value="String(form[field.key] ?? '')"
            :type="field.type"
            :required="field.required"
            @input="handleSlugInput"
          />
          <input v-else v-model="form[field.key]" :type="field.type" :required="field.required" />
        </label>

        <p v-if="resource === 'products' || resource === 'banners'" class="hint"><ImagePlus :size="15" /> Images upload with the record.</p>
        <button class="button primary" type="submit" :disabled="saving">
          <Save :size="16" /> {{ saving ? 'Saving...' : editingId === null ? 'Create' : 'Save changes' }}
        </button>
      </form>

      <div class="panel table-panel">
        <div class="panel-heading">
          <div><p class="eyebrow">Live data</p><h2>{{ records.length }} {{ config.title.toLowerCase() }}</h2></div>
          <Plus :size="20" class="heading-icon" />
        </div>
        <div v-if="loading" class="state">Loading {{ config.title.toLowerCase() }}...</div>
        <div v-else-if="records.length === 0" class="state">No {{ config.title.toLowerCase() }} found.</div>
        <div v-else class="table-wrap">
          <table>
            <thead><tr><th v-for="field in config.fields" :key="field.key">{{ field.label }}</th><th>Actions</th></tr></thead>
            <tbody>
              <tr v-for="record in records" :key="record.id">
                <td v-for="field in config.fields" :key="field.key">
                  <img v-if="field.type === 'file' && record[field.key]" class="thumbnail" :src="String(record[field.key])" :alt="String(record.title || 'Banner')" />
                  <span v-else>{{ record[field.key] ?? '-' }}</span>
                </td>
                <td class="actions"><button class="icon-button" type="button" title="Edit" @click="openEdit(record)"><Pencil :size="16" /></button><button class="icon-button danger" type="button" title="Delete" @click="remove(record)"><Trash2 :size="16" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.resource-page { max-width: 1440px; margin: 0 auto; }
.page-header, .panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; }
.page-header { margin-bottom: 24px; }
.page-header h1, .panel-heading h2 { margin: 0; color: #111827; }
.page-header h1 { font-size: 28px; }
.page-header p:not(.eyebrow) { margin: 7px 0 0; color: #6b7280; }
.eyebrow { margin: 0 0 6px; color: #2563eb; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.resource-grid { display: grid; grid-template-columns: minmax(280px, 340px) minmax(0, 1fr); gap: 20px; align-items: start; }
.panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 22px; }
.form-panel { display: grid; gap: 18px; }
.panel-heading { align-items: center; margin-bottom: 4px; }
.panel-heading h2 { font-size: 18px; }
label { display: grid; gap: 7px; color: #374151; font-size: 13px; font-weight: 700; }
label b { color: #dc2626; }
input, textarea { box-sizing: border-box; width: 100%; border: 1px solid #d1d5db; border-radius: 7px; padding: 10px 11px; color: #111827; font: inherit; font-weight: 400; background: #fff; }
input:focus, textarea:focus { outline: 2px solid #bfdbfe; border-color: #2563eb; }
.button, .icon-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; cursor: pointer; }
.button { min-height: 38px; padding: 0 14px; border-radius: 7px; font-weight: 700; }
.button:disabled { cursor: wait; opacity: .6; }
.primary { background: #2563eb; color: white; }
.secondary { background: #fff; border: 1px solid #d1d5db; color: #374151; }
.icon-button { width: 32px; height: 32px; border-radius: 6px; background: #f3f4f6; color: #4b5563; }
.icon-button:hover { background: #dbeafe; color: #1d4ed8; }
.icon-button.danger:hover { background: #fee2e2; color: #b91c1c; }
.heading-icon { color: #2563eb; }
.hint, .state { color: #6b7280; font-size: 13px; }
.hint { display: flex; align-items: center; gap: 6px; margin: -6px 0 0; }
.alert { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; padding: 12px 14px; border: 1px solid #fecaca; border-radius: 7px; background: #fef2f2; color: #b91c1c; }
.table-wrap { overflow-x: auto; margin-top: 18px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 13px 10px; border-bottom: 1px solid #f3f4f6; text-align: left; vertical-align: middle; }
th { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
.actions { display: flex; gap: 6px; white-space: nowrap; }
.thumbnail { width: 64px; height: 38px; border-radius: 5px; object-fit: cover; }
@media (max-width: 900px) { .resource-grid { grid-template-columns: 1fr; } .form-panel { max-width: none; } }
@media (max-width: 600px) { .page-header { flex-direction: column; } .panel { padding: 16px; } }
</style>
