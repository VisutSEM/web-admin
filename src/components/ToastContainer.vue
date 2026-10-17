<script setup lang="ts">
import { useToastStore } from '../stores/toast'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-vue-next'

const toastStore = useToastStore()
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast-anim">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast-item"
        :class="`toast-${toast.type}`"
      >
        <div class="toast-icon">
          <CheckCircle2 v-if="toast.type === 'success'" :size="18" />
          <AlertTriangle v-else-if="toast.type === 'warning'" :size="18" />
          <XCircle v-else-if="toast.type === 'error'" :size="18" />
          <Info v-else :size="18" />
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ toast.title }}</div>
          <div v-if="toast.message" class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click="toastStore.remove(toast.id)">
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: #ffffff;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-lg);
  font-size: 13.5px;
}

.toast-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  color: #0f172a;
}

.toast-message {
  color: #64748b;
  font-size: 12.5px;
  margin-top: 2px;
}

.toast-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.15s;
}

.toast-close:hover {
  color: #0f172a;
}

.toast-success {
  border-left: 4px solid #10b981;
}
.toast-success .toast-icon {
  color: #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
}
.toast-error .toast-icon {
  color: #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
}
.toast-warning .toast-icon {
  color: #f59e0b;
}

.toast-info {
  border-left: 4px solid #3b82f6;
}
.toast-info .toast-icon {
  color: #3b82f6;
}

/* Animations */
.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-anim-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
.toast-anim-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
</style>
