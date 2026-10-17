<script setup lang="ts">
import { ref } from 'vue'
import {
  Settings,
  Server,
  Globe,
  Key,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Save,
  RefreshCw,
} from 'lucide-vue-next'
import {
  apiConfig,
  setApiBaseUrl,
  setApiToken,
  testApiConnection,
  toggleDemoMode,
} from '../services/api'
import { useToastStore } from '../stores/toast'

const toast = useToastStore()
const urlInput = ref(apiConfig.baseUrl)
const tokenInput = ref(apiConfig.token)
const isTesting = ref(false)
const testResult = ref<{ ok: boolean; message: string } | null>(null)

async function handleTest() {
  isTesting.value = true
  testResult.value = null
  setApiBaseUrl(urlInput.value)
  setApiToken(tokenInput.value)
  try {
    const res = await testApiConnection()
    testResult.value = res
    if (res.ok) {
      toast.success('Connection Successful', res.message)
    } else {
      toast.warning('Connection Status', res.message)
    }
  } catch (err: unknown) {
    testResult.value = { ok: false, message: (err as Error).message }
    toast.error('Connection Failed', (err as Error).message)
  } finally {
    isTesting.value = false
  }
}

function handleSave() {
  setApiBaseUrl(urlInput.value)
  setApiToken(tokenInput.value)
  toast.success('Settings Saved', 'API backend endpoint configuration saved.')
}

function handleToggleDemo() {
  toggleDemoMode()
  toast.info(
    apiConfig.demoMode ? 'Demo Mode Active' : 'Live API Active',
    apiConfig.demoMode ? 'Operating with realistic demo data' : 'Connecting to ' + apiConfig.baseUrl,
  )
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-header">
      <div>
        <h1>API Backend & System Settings</h1>
        <p class="subtitle">
          Configure connection endpoints, Sanctum tokens, and inspect route alignment with Laravel <code>routes/api.php</code>.
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn-primary" @click="handleSave">
          <Save :size="15" /> Save Configuration
        </button>
      </div>
    </div>

    <div class="settings-grid">
      <!-- Main Configuration Card -->
      <div class="settings-card glass-card">
        <div class="card-head">
          <Server :size="18" style="color: #4f46e5" />
          <h3>Backend Endpoint Configuration</h3>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span>API Base URL</span>
            <span class="badge" :class="apiConfig.isConnected ? 'badge-success' : 'badge-warning'">
              {{ apiConfig.isConnected ? 'Connected' : 'Offline / Demo' }}
            </span>
          </label>
          <div class="input-with-icon">
            <Globe :size="16" class="input-icon" />
            <input
              v-model="urlInput"
              type="text"
              class="form-input has-icon"
              placeholder="http://localhost:8000/api or https://laravel-blog-api-s7od.onrender.com/api"
            />
          </div>
          <small class="hint">Includes standard Laravel <code>/api</code> prefix (e.g. <code>http://localhost:8000/api</code>)</small>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span>Sanctum Bearer Token</span>
          </label>
          <div class="input-with-icon">
            <Key :size="16" class="input-icon" />
            <input
              v-model="tokenInput"
              type="password"
              class="form-input has-icon"
              placeholder="Paste Bearer token (optional for public routes)"
            />
          </div>
          <small class="hint">Passed automatically in <code>Authorization: Bearer &lt;token&gt;</code></small>
        </div>

        <div class="demo-card">
          <div class="demo-left">
            <Sparkles :size="20" style="color: #7c3aed" />
            <div>
              <strong>Instant Demo & Local Resilience</strong>
              <p>When remote server sleeps or local server is stopped, demo fallback preserves 100% interactive UI.</p>
            </div>
          </div>
          <button
            class="btn btn-sm"
            :class="apiConfig.demoMode ? 'btn-primary' : 'btn-secondary'"
            @click="handleToggleDemo"
          >
            {{ apiConfig.demoMode ? 'Active (Demo)' : 'Switch to Demo' }}
          </button>
        </div>

        <div v-if="testResult" class="test-result-box" :class="testResult.ok ? 'test-ok' : 'test-err'">
          <component :is="testResult.ok ? CheckCircle2 : AlertTriangle" :size="18" />
          <span>{{ testResult.message }}</span>
        </div>

        <div class="card-actions">
          <button class="btn btn-secondary" :disabled="isTesting" @click="handleTest">
            <RefreshCw :size="15" :class="{ 'animate-spin': isTesting }" />
            {{ isTesting ? 'Testing Endpoint...' : 'Test Connection' }}
          </button>
          <button class="btn btn-primary" @click="handleSave">
            Apply Changes
          </button>
        </div>
      </div>

      <!-- Route Mapping Reference Card -->
      <div class="settings-card glass-card">
        <div class="card-head">
          <Code2 :size="18" style="color: #059669" />
          <h3>Laravel Route Mapping Verification</h3>
        </div>

        <p class="route-desc">
          Verified alignment with your Laravel <code>routes/api.php</code> controller endpoints:
        </p>

        <div class="route-list">
          <div class="route-item">
            <span class="http-badge get">GET</span>
            <code>/admin/orders</code>
            <span class="route-arrow">→</span>
            <span class="route-ctrl">OrderController@adminIndex</span>
          </div>

          <div class="route-item">
            <span class="http-badge post">POST</span>
            <code>/admin/orders/{id}/approve-delivery</code>
            <span class="route-arrow">→</span>
            <span class="route-ctrl">OrderController@approveDelivery</span>
          </div>

          <div class="route-item">
            <span class="http-badge put">PUT</span>
            <code>/admin/orders/{id}/status</code>
            <span class="route-arrow">→</span>
            <span class="route-ctrl">OrderController@adminUpdateStatus</span>
          </div>

          <div class="route-item">
            <span class="http-badge crud">CRUD</span>
            <code>/admin/products</code>
            <span class="route-arrow">→</span>
            <span class="route-ctrl">ProductController (index, store, update, destroy)</span>
          </div>

          <div class="route-item">
            <span class="http-badge crud">CRUD</span>
            <code>/admin/categories</code>
            <span class="route-arrow">→</span>
            <span class="route-ctrl">CategoriesController (index, store, update, destroy)</span>
          </div>

          <div class="route-item">
            <span class="http-badge crud">CRUD</span>
            <code>/admin/banners</code>
            <span class="route-arrow">→</span>
            <span class="route-ctrl">BannerController (index, store, update, destroy)</span>
          </div>

          <div class="route-item">
            <span class="http-badge crud">CRUD</span>
            <code>/admin/address</code>
            <span class="route-arrow">→</span>
            <span class="route-ctrl">AddressController (index, store, update, destroy)</span>
          </div>

          <div class="route-item">
            <span class="http-badge get">GET</span>
            <code>/users</code>
            <span class="route-arrow">→</span>
            <span class="route-ctrl">UserController@show</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.settings-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.settings-header h1 {
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

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.settings-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.card-head h3 {
  font-size: 16px;
  font-weight: 700;
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  color: #94a3b8;
}

.has-icon {
  padding-left: 36px;
}

.hint {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 4px;
}

.demo-card {
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 18px 0;
}

.demo-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.demo-left strong {
  font-size: 13.5px;
  color: #5b21b6;
  display: block;
}

.demo-left p {
  font-size: 12px;
  color: #6d28d9;
  margin-top: 2px;
}

.test-result-box {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.test-ok {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}
.test-err {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

.route-desc {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 16px;
}

.route-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.route-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 12px;
}

.http-badge {
  font-size: 10.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.http-badge.get { background: #eff6ff; color: #1d4ed8; }
.http-badge.post { background: #ecfdf5; color: #047857; }
.http-badge.put { background: #fffbeb; color: #b45309; }
.http-badge.crud { background: #f5f3ff; color: #6d28d9; }

.route-arrow {
  color: #94a3b8;
}

.route-ctrl {
  color: #475569;
  font-weight: 600;
  margin-left: auto;
  white-space: nowrap;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1000px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
