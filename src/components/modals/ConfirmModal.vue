<script setup>
import ModalBase from './ModalBase.vue'

const props = defineProps({
  data: { type: Object, required: true }
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <ModalBase :title="data.title" icon="Warning" @close="emit('close')">
    <p class="confirm-text">{{ data.body }}</p>
    <div v-if="data.detail" class="confirm-detail mono">{{ data.detail }}</div>

    <template #footer>
      <button class="btn ghost" @click="emit('close')">Annuler</button>
      <button
        class="btn"
        :class="data.danger ? 'danger' : 'primary'"
        @click="emit('confirm')"
      >
        {{ data.confirm }}
      </button>
    </template>
  </ModalBase>
</template>
