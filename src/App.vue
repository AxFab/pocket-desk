<script setup>
import { computed, watch, onMounted, ref } from 'vue'
import { useAppStore } from '@/store/app.js'

import TitleBar      from '@/components/TitleBar.vue'
import StatusBar     from '@/components/StatusBar.vue'
import Sidebar       from '@/components/sidebar/Sidebar.vue'
import TabStrip      from '@/components/TabStrip.vue'
import PrefsPanel    from '@/components/PrefsPanel.vue'
import AppIcon       from '@/components/AppIcons.vue'

import EmptyState      from '@/components/views/EmptyState.vue'
import DbView          from '@/components/views/DbView.vue'
import CollectionView  from '@/components/views/CollectionView.vue'

import NewConnectionModal from '@/components/modals/NewConnectionModal.vue'
import ConfirmModal       from '@/components/modals/ConfirmModal.vue'
import PromptModal        from '@/components/modals/PromptModal.vue'
import CreateIndexModal   from '@/components/modals/CreateIndexModal.vue'
import EditDocModal       from '@/components/modals/EditDocModal.vue'

const store = useAppStore()
const showPrefs = ref(false)

// ---- Theme / density / accent effect ---------------------------------------
const sysDark = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)

onMounted(async () => {
  // Listen for system theme changes
  window.matchMedia?.('(prefers-color-scheme: dark)')
    .addEventListener('change', e => { sysDark.value = e.matches })

  // Detect platform via IPC
  try {
    store.platform = await window.pocketDesk.platform()
  } catch {
    // Fallback: detect via userAgent
    store.platform = navigator.platform.toLowerCase().includes('mac') ? 'darwin' : 'win32'
  }
})

const isDark = computed(() => {
  if (store.themeMode === 'system') return sysDark.value
  return store.themeMode === 'dark'
})

watch([isDark, () => store.density, () => store.accent], ([dark, density, accent]) => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  document.documentElement.setAttribute('data-density', density)
  document.documentElement.style.setProperty('--accent', accent)
}, { immediate: true })

// ---- Active view -----------------------------------------------------------
const activeTab = computed(() => store.activeTab)

// ---- Modal handlers --------------------------------------------------------
function handleNewConnection(data) {
  store.openDatabase(data)
  store.closeModal()
}
</script>

<template>
  <div class="app">
    <TitleBar />

    <div class="body">
      <Sidebar />

      <main class="main">
        <TabStrip />

        <div class="content">
          <!-- Empty state: no tabs open -->
          <EmptyState v-if="!activeTab" />

          <!-- DB view -->
          <DbView
            v-else-if="activeTab.type === 'db'"
            :db-id="activeTab.dbId"
          />

          <!-- Collection view -->
          <CollectionView
            v-else-if="activeTab.type === 'collection'"
            :db-id="activeTab.dbId"
            :col-id="activeTab.collectionId"
          />
        </div>
      </main>
    </div>

    <StatusBar />

    <!-- ===== Modals ===== -->
    <NewConnectionModal
      v-if="store.modal?.type === 'new-connection'"
      @close="store.closeModal()"
      @confirm="handleNewConnection"
    />

    <ConfirmModal
      v-if="store.modal?.type === 'confirm'"
      :data="store.modal.data"
      @close="store.closeModal()"
      @confirm="store.modal.onConfirm?.()"
    />

    <PromptModal
      v-if="store.modal?.type === 'prompt'"
      :data="store.modal.data"
      @close="store.closeModal()"
      @confirm="store.modal.onConfirm?.($event)"
    />

    <CreateIndexModal
      v-if="store.modal?.type === 'create-index'"
      @close="store.closeModal()"
      @confirm="store.modal.onConfirm?.($event)"
    />

    <EditDocModal
      v-if="store.modal?.type === 'edit-doc'"
      :data="store.modal.data"
      @close="store.closeModal()"
      @confirm="store.modal.onConfirm?.($event)"
    />

    <!-- ===== Toast ===== -->
    <div v-if="store.toast" class="toast">
      <AppIcon name="Check" :size="15" />
      {{ store.toast }}
    </div>
  </div>
</template>
