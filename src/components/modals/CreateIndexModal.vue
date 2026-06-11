<script setup>
import { ref, computed } from 'vue'
import ModalBase from './ModalBase.vue'

const emit = defineEmits(['close', 'confirm'])

const field = ref('')
const type  = ref('string')
const valid = computed(() => field.value.trim().length > 0)

function confirm() {
  if (!valid.value) return
  emit('confirm', { field: field.value.trim(), type: type.value })
}
</script>

<template>
  <ModalBase title="Créer un index" icon="Index" @close="emit('close')">
    <label class="field">
      <span class="flabel">Champ</span>
      <input
        class="inp mono"
        autofocus
        placeholder="ex : category"
        v-model="field"
        @keydown.enter="confirm"
      />
    </label>

    <div class="field">
      <span class="flabel">Type</span>
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
        <template v-if="type === 'number'">Supporte $eq, $in et les scans de plage ($gt, $lte…).</template>
        <template v-else>Supporte les recherches $eq et $in.</template>
      </span>
    </div>

    <template #footer>
      <button class="btn ghost" @click="emit('close')">Annuler</button>
      <button class="btn primary" :disabled="!valid" @click="confirm">Créer l'index</button>
    </template>
  </ModalBase>
</template>
