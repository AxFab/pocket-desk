<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/store/app.js'
import AppIcon from './AppIcons.vue'

const store = useAppStore()
const dragIdx = ref(null)
const overIdx = ref(null)

function onDragStart(e, i) {
  dragIdx.value = i
  e.dataTransfer.effectAllowed = 'move'
}
function onDragOver(e, i) {
  e.preventDefault()
  overIdx.value = i
}
function onDrop(e, i) {
  e.preventDefault()
  if (dragIdx.value != null && dragIdx.value !== i) {
    store.reorderTabs(dragIdx.value, i)
  }
  dragIdx.value = null
  overIdx.value = null
}
function onDragEnd() {
  dragIdx.value = null
  overIdx.value = null
}
</script>

<template>
  <div class="tabstrip" :class="{ empty: store.tabs.length === 0 }">
    <div
      v-for="(tab, i) in store.tabs"
      :key="tab.id"
      class="tab"
      :class="{
        active: tab.id === store.activeId,
        dragover: overIdx === i
      }"
      :style="tab.id === store.activeId
        ? { borderTopColor: tab.color }
        : {}"
      draggable="true"
      @dragstart="onDragStart($event, i)"
      @dragover="onDragOver($event, i)"
      @drop="onDrop($event, i)"
      @dragend="onDragEnd"
      @click="store.activeId = tab.id"
      :title="tab.title"
    >
      <span class="tab-dot" :style="{ background: tab.color }" />
      <AppIcon :name="tab.type === 'db' ? 'Database' : 'Collection'" :size="14" />
      <span class="tab-title">{{ tab.title }}</span>
      <button
        class="tab-close"
        title="Fermer l'onglet"
        @click.stop="store.closeTab(tab.id)"
      >
        <AppIcon name="Close" :size="13" />
      </button>
    </div>
  </div>
</template>
