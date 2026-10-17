import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  title: string
  message?: string
  type: ToastType
  duration?: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function show(title: string, message = '', type: ToastType = 'info', duration = 3500) {
    const id = Date.now() + Math.random()
    const item: Toast = { id, title, message, type, duration }
    toasts.value.push(item)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
  }

  function success(title: string, message = '') {
    show(title, message, 'success')
  }

  function error(title: string, message = '') {
    show(title, message, 'error', 4500)
  }

  function warning(title: string, message = '') {
    show(title, message, 'warning', 4000)
  }

  function info(title: string, message = '') {
    show(title, message, 'info')
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, show, success, error, warning, info, remove }
})
