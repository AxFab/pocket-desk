<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ModalBase from './ModalBase.vue'

const emit = defineEmits(['close', 'confirm'])
const { t } = useI18n()

const field = ref('')
const type  = ref('string')
const valid = computed(() => field.value.trim().length > 0)

function confirm() {
  if (!valid.value) return
  emit('confirm', { field: field.value.trim(), type: type.value })
}
</script>

<template>
  <ModalBase :title="t('modals.createIndex.title')" icon="Index" @close="emit('close')">
    <label class="field">
      <span class="flabel">{{ t('modals.createIndex.field') }}</span>
      <input
        class="inp mono"
        autofocus
        :placeholder="t('modals.createIndex.fieldPlaceholder')"
        v-model="field"
        @keydown.enter="confirm"
      />
    </label>

    <div class="field">
      <span class="flabel">{{ t('modals.createIndex.type') }}</span>
      <div class="seg">
        <button
          v-for="t in ['string', 'number']"
          :key="t"
          class="seg-btn"
          :class="{ on: type === t }"
          @click="type = t"
        >{{ t }}</button>
      </div>
      <span class="field-note">
        <template v-if="type === 'number'">{{ $t('modals.createIndex.noteNumber') }}</template>
        <template v-else>{{ $t('modals.createIndex.noteString') }}</template>
      </span>
    </div>

    <template #footer>
      <button class="btn ghost" @click="emit('close')">{{ $t('modals.cancel') }}</button>
      <button class="btn primary" :disabled="!valid" @click="confirm">{{ $t('modals.createIndex.confirm') }}</button>
    </template>
  </ModalBase>
</template>
