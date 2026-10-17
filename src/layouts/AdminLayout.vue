<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from '../components/AppSidebar.vue'
import AppNavbar from '../components/AppNavbar.vue'
import ToastContainer from '../components/ToastContainer.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="admin-layout">
    <AppSidebar
      :mobile-open="sidebarOpen"
      @close="sidebarOpen = false"
    />

    <div class="main-area">
      <AppNavbar
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      />

      <main class="content">
        <RouterView />
      </main>
    </div>

    <!-- Universal Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: var(--bg-page);
}

.main-area {
  min-height: 100vh;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
}

.content {
  padding: 30px;
  flex: 1;
}

@media (max-width: 768px) {
  .main-area {
    margin-left: 0;
  }
  .content {
    padding: 16px;
  }
}
</style>