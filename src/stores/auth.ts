import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  apiConfig,
  getAuthUser,
  login as apiLogin,
  logout as apiLogout,
  setApiBaseUrl,
  setApiToken,
  testApiConnection,
  toggleDemoMode,
  type User,
} from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(!!apiConfig.token)
  const isChecking = ref(false)

  async function init() {
    isChecking.value = true
    try {
      await testApiConnection()
      if (apiConfig.token || apiConfig.demoMode) {
        user.value = await getAuthUser()
        isAuthenticated.value = true
      }
    } catch {
      // keep default guest or demo
    } finally {
      isChecking.value = false
    }
  }

  async function login(credentials: { email: string; password: string }) {
    isChecking.value = true
    try {
      const res = await apiLogin(credentials)
      user.value = (res.user as User) || (await getAuthUser())
      isAuthenticated.value = true
      return res
    } finally {
      isChecking.value = false
    }
  }

  async function logout() {
    await apiLogout()
    user.value = null
    isAuthenticated.value = false
  }

  return {
    user,
    isAuthenticated,
    isChecking,
    apiConfig,
    init,
    login,
    logout,
    setApiBaseUrl,
    setApiToken,
    toggleDemoMode,
    testApiConnection,
  }
})
