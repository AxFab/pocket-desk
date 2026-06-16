<script setup>
import { useI18n } from 'vue-i18n'
import ModalBase from './ModalBase.vue'

const props = defineProps({
  data: { type: Object, required: true }
})

const emit = defineEmits(['close', 'confirm'])
const { t } = useI18n()
</script>

<template>
  <ModalBase :title="data.title" icon="Warning" @close="emit('close')">
    <p class="confirm-text">{{ data.body }}</p>
    <div v-if="data.detail" class="confirm-detail mono">{{ data.detail }}</div>

    <template #footer>
      <button class="btn ghost" @click="emit('close')">{{ t('modals.cancel') }}</button>
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
