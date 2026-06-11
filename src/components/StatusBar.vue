<script setup>
import { computed, ref, watch } from 'vue'
import { useAppStore } from '@/store/app.js'
import AppIcon from './AppIcons.vue'

const store = useAppStore()
const tab = computed(() => store.activeTab)
const db = computed(() => store.activeDb)

// Real state of the <path>.lock file, queried via IPC
const lock = ref(null)

watch(db, async (d) => {
  if (!d) { lock.value = null; return }
  try {
    lock.value = await window.pocketDesk.lockStatus(d.id)
  } catch {
    lock.value = null
  }
}, { immediate: true })

const lockLabel = computed(() => {
  if (!db.value) return 'pocket-desk · prêt'
  if (!lock.value) return 'verrou · inconnu'
  if (lock.value.own) return 'verrou OK · 1 process'
  if (lock.value.exists && lock.value.alive) return `verrou tenu par PID ${lock.value.pid}`
  if (lock.value.exists) return 'verrou orphelin'
  return 'verrou absent'
})

const lockOk = computed(() => !db.value || (lock.value && lock.value.own))
</script>

<template>
  <div class="statusbar">
    <template v-if="tab && db">
      <span class="sb-item">
        <span class="dot sm" :style="{ background: db.color }" />
        {{ db.fileName }}
      </span>
      <span class="sb-item mono">{{ db.path }}</span>
      <span class="sb-spacer" />
      <span class="sb-item">{{ tab.type === 'collection' ? 'collection' : 'base' }}</span>
    </template>
    <span class="sb-spacer" v-else />
    <span class="sb-lock" :class="{ warn: !lockOk }">
      <AppIcon :name="lockOk ? 'Check' : 'Warning'" :size="12" />
      {{ lockLabel }}
    </span>
  </div>
</template>
