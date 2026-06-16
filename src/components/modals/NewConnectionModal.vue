<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DB_COLORS } from '@/store/app.js'
import ModalBase from './ModalBase.vue'
import AppIcon from '@/components/AppIcons.vue'

const emit = defineEmits(['close', 'confirm'])
const { t } = useI18n()

const path  = ref('')
const name  = ref('')
const color = ref(DB_COLORS[2].hex) // default: Ardoise

const valid = computed(() => path.value && name.value.trim())

async function browse() {
  try {
    const selected = await window.pocketDesk.openFileDialog()
    if (selected) {
      path.value = selected
      if (!name.value) {
        const m = selected.match(/([^/\\]+)\.pdb$/i)
        if (m) name.value = m[1]
      }
    }
  } catch {
    // If IPC not available (e.g. running outside Electron)
    const p = prompt(t('modals.newConnection.filePlaceholder'))
    if (p) {
      path.value = p
      if (!name.value) {
        const m = p.match(/([^/\\]+)\.pdb$/i)
        if (m) name.value = m[1]
      }
    }
  }
}

function onPathInput(v) {
  path.value = v
  if (!name.value) {
    const m = v.match(/([^/\\]+)\.pdb$/i)
    if (m) name.value = m[1]
  }
}

function confirm() {
  if (!valid.value) return
  emit('confirm', { path: path.value, name: name.value.trim(), color: color.value })
}
</script>

<template>
  <ModalBase :title="t('modals.newConnection.title')" icon="Database" :accent="color" @close="emit('close')">
    <!-- File field -->
    <label class="field">
      <span class="flabel">{{ t('modals.newConnection.file') }}</span>
      <div class="file-pick">
        <input
          class="inp mono"
          :placeholder="t('modals.newConnection.filePlaceholder')"
          :value="path"
          @input="onPathInput($event.target.value)"
        />
        <button class="btn ghost sm" @click="browse">
          <AppIcon name="Folder" :size="15" />
          {{ t('modals.newConnection.browse') }}
        </button>
      </div>
    </label>

    <!-- Connection name -->
    <label class="field">
      <span class="flabel">{{ t('modals.newConnection.connectionName') }}</span>
      <input class="inp" :placeholder="t('modals.newConnection.namePlaceholder')" v-model="name" />
    </label>

    <!-- Color picker -->
    <div class="field">
      <span class="flabel">{{ t('modals.newConnection.color') }} <em class="flabel-hint">{{ t('modals.newConnection.colorHint') }}</em></span>
      <div class="swatches">
        <button
          v-for="c in DB_COLORS"
          :key="c.id"
          :title="t('colors.' + c.id)"
          class="swatch"
          :class="{ on: color === c.hex }"
          :style="{ background: c.hex }"
          @click="color = c.hex"
        >
          <AppIcon v-if="color === c.hex" name="Check" :size="14" />
        </button>
      </div>
    </div>

    <template #footer>
      <button class="btn ghost" @click="emit('close')">{{ t('modals.cancel') }}</button>
      <button class="btn primary" :disabled="!valid" @click="confirm">{{ t('modals.newConnection.open') }}</button>
    </template>
  </ModalBase>
</template>
