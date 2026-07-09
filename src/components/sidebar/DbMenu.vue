<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcons.vue'

const props = defineProps({
  anchor: { type: Object, required: true }, // { top, left }
  dbId: { type: String, required: true },
  connected: { type: Boolean, default: true }
})

const emit = defineEmits(['action', 'close'])
const { t } = useI18n()

const items = computed(() => props.connected ? [
  { id: 'add-collection', label: t('dbMenu.addCollection'), icon: 'Plus' },
  { id: 'rename',         label: t('dbMenu.renameDb'),      icon: 'Rename' },
  { id: 'duplicate',      label: t('dbMenu.duplicateDb'),   icon: 'Copy' },
  { id: 'compact',        label: t('dbMenu.compactDb'),     icon: 'Compact' },
  { sep: true },
  { id: 'close-tabs',     label: t('dbMenu.closeTabs'),     icon: 'CloseTabs' },
  { id: 'disconnect',     label: t('dbMenu.disconnectDb'),  icon: 'PlugOff' },
  { sep: true },
  { id: 'close',          label: t('dbMenu.closeDb'),       icon: 'Close', danger: true },
] : [
  { id: 'reconnect',      label: t('dbMenu.reconnectDb'),   icon: 'Plug' },
  { id: 'rename',         label: t('dbMenu.renameDb'),      icon: 'Rename' },
  { sep: true },
  { id: 'close',          label: t('dbMenu.closeDb'),       icon: 'Close', danger: true },
])

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
