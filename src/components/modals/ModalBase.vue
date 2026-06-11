<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcons.vue'

const props = defineProps({
  title:   { type: String, required: true },
  icon:    { type: String, default: null },
  wide:    { type: Boolean, default: false },
  accent:  { type: String, default: null }
})

const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="overlay" @mousedown.self="emit('close')">
    <div
      class="modal"
      :class="{ wide }"
      :style="accent ? { '--accent': accent } : undefined"
      @mousedown.stop
    >
      <div class="modal-head">
        <AppIcon v-if="icon" :name="icon" :size="18" />
        <h3>{{ title }}</h3>
        <button class="modal-x" @click="emit('close')">
          <AppIcon name="Close" :size="16" />
        </button>
      </div>

      <div class="modal-body">
        <slot />
      </div>

      <div v-if="$slots.footer" class="modal-foot">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
