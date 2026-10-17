<script setup lang="ts">
import { ref } from 'vue'
import { apiConfig, setApiBaseUrl, setApiToken, testApiConnection, toggleDemoMode } from '../services/api'
import { useToastStore } from '../stores/toast'
import { X, Server, CheckCircle2, AlertTriangle, Key, Globe, Sparkles } from 'lucide-vue-next'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

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
      toast.warning('Connection Failed', res.message)
    }
  } catch (err: unknown) {
    testResult.value = { ok: false, message: (err as Error).message }
    toast.error('Connection Error', (err as Error).message)
  } finally {
    isTesting.value = false
  }
}

function handleSave() {
  setApiBaseUrl(urlInput.value)
  setApiToken(tokenInput.value)
  toast.success('Settings Saved', 'API endpoint configuration updated')
  emit('close')
}

function handleToggleDemo() {
  toggleDemoMode()
  toast.info(
    apiConfig.demoMode ? 'Demo Mode Enabled' : 'Live API Mode Enabled',
    apiConfig.demoMode ? 'Using rich local seed data' : 'Sending requests to ' + apiConfig.baseUrl,
  )
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="flex items-center gap-2">
          <Server :size="20" style="color: #4f46e5" />
          <h3 class="modal-title">Laravel API Configuration</h3>
        </div>
        <button class="btn-icon btn-secondary" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="modal-body">
        <p class="config-desc">
          Configure connection to your Laravel backend (aligned with <code>routes/api.php</code>).
        </p>

        <div class="form-group">
          <label class="form-label">
            <span class="flex items-center gap-1">
              <Globe :size="14" /> API Base URL
            </span>
          </label>
          <input
            v-model="urlInput"
            type="text"
            class="form-input"
            placeholder="http://localhost:8000/api or https://your-backend.com/api"
          />
          <small class="hint">Includes standard Laravel <code>/api</code> prefix (e.g. <code>http://127.0.0.1:8000/api</code>)</small>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="flex items-center gap-1">
              <Key :size="14" /> Sanctum Bearer Token (Optional)
            </span>
          </label>
          <input
            v-model="tokenInput"
            type="password"
            class="form-input"
            placeholder="Optional: paste Bearer token for auth:sanctum routes"
          />
          <small class="hint">Sent in <code>Authorization: Bearer &lt;token&gt;</code> header</small>
        </div>

        <div class="demo-box">
          <div class="demo-info">
            <div class="demo-header">
              <Sparkles :size="16" style="color: #8b5cf6;" />
              <strong>Demo & Offline Resilience Mode</strong>
            </div>
            <p>
              When enabled or when the remote Laravel server is sleeping/offline, the panel loads instant realistic data for seamless preview.
            </p>
          </div>
          <button
            class="btn btn-sm"
            :class="apiConfig.demoMode ? 'btn-primary' : 'btn-secondary'"
            @click="handleToggleDemo"
          >
            {{ apiConfig.demoMode ? 'Demo Active' : 'Enable Demo' }}
          </button>
        </div>

        <div v-if="testResult" class="test-result-box" :class="testResult.ok ? 'test-ok' : 'test-err'">
          <component :is="testResult.ok ? CheckCircle2 : AlertTriangle" :size="18" />
          <span>{{ testResult.message }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="isTesting"
          @click="handleTest"
        >
          {{ isTesting ? 'Testing...' : 'Test Connection' }}
        </button>
        <button
          type="button"
          class="btn btn-primary"
          @click="handleSave"
        >
          Save & Apply
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-desc {
  font-size: 13.5px;
  color: #64748b;
  margin-bottom: 20px;
}
.config-desc code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #4f46e5;
  font-size: 12.5px;
}
.hint {
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 4px;
}
.demo-box {
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
.demo-header {
  display: flex;
  align-items: center;
  gap: 6px;
}
.demo-header strong {
  font-size: 13.5px;
  color: #5b21b6;
}
.demo-info p {
  font-size: 12px;
  color: #6d28d9;
  margin-top: 3px;
}
.test-result-box {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
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
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
</style>
