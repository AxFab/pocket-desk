<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcons.vue'

const props = defineProps({
  anchor: { type: Object, required: true }, // { top, left }
  dbId: { type: String, required: true }
})

const emit = defineEmits(['action', 'close'])

const items = [
  { id: 'add-collection', label: 'Ajouter une collection', icon: 'Plus' },
  { id: 'rename',         label: 'Renommer la base',       icon: 'Rename' },
  { id: 'duplicate',      label: 'Dupliquer la base',       icon: 'Copy' },
  { id: 'compact',        label: 'Compacter la base',       icon: 'Compact' },
  { sep: true },
  { id: 'close-tabs',     label: 'Fermer les onglets',      icon: 'CloseTabs' },
  { id: 'close',          label: 'Fermer la base',          icon: 'Close', danger: true },
]

function onClickAway(e) {
  emit('close')
}

onMounted(() => {
  // slight delay so the opening click doesn't immediately close
  setTimeout(() => document.addEventListener('mousedown', onClickAway), 50)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickAway)
})
</script>

<template>
  <div
    class="menu"
    :style="{ top: anchor.top + 'px', left: anchor.left + 'px' }"
    @mousedown.stop
    role="menu"
  >
    <template v-for="(item, i) in items" :key="i">
      <div v-if="item.sep" class="menu-sep" />
      <button
        v-else
        class="menu-item"
        :class="{ danger: item.danger }"
        @click="emit('action', item.id); emit('close')"
      >
        <AppIcon :name="item.icon" :size="15" />
        <span>{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>
