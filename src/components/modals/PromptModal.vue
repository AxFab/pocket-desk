<script setup>
import { ref, computed } from 'vue'
import ModalBase from './ModalBase.vue'

const props = defineProps({
  data: { type: Object, required: true }
})
const emit = defineEmits(['close', 'confirm'])

const val = ref(props.data.value || '')
const valid = computed(() => val.value.trim().length > 0)

function confirm() {
  if (!valid.value) return
  emit('confirm', val.value.trim())
}
</script>

<template>
  <ModalBase
    :title="data.title"
    :icon="data.icon || 'Rename'"
    @close="emit('close')"
  >
    <label class="field">
      <span class="flabel">{{ data.label }}</span>
      <input
        class="inp"
        autofocus
        v-model="val"
        :placeholder="data.placeholder"
        @keydown.enter="confirm"
      />
    </label>

    <template #footer>
      <button class="btn ghost" @click="emit('close')">Annuler</button>
      <button class="btn primary" :disabled="!valid" @click="confirm">
        {{ data.confirm || 'Valider' }}
      </button>
    </template>
  </ModalBase>
</template>
