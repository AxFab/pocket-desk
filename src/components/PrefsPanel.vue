<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore, ACCENT_OPTIONS } from '@/store/app.js'
import AppIcon from './AppIcons.vue'

const emit = defineEmits(['close'])
const store = useAppStore()
const { t } = useI18n()

function onClickAway() { emit('close') }
onMounted(() => setTimeout(() => document.addEventListener('mousedown', onClickAway), 50))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickAway))
</script>

<template>
  <div class="prefs-panel" @mousedown.stop>
    <div class="prefs-section">{{ t('prefs.appearance') }}</div>

    <div class="prefs-row">
      <span class="prefs-label">{{ t('prefs.theme') }}</span>
      <div class="prefs-seg">
        <button
          v-for="mode in ['light', 'dark', 'system']"
          :key="mode"
          class="prefs-seg-btn"
          :class="{ on: store.themeMode === mode }"
          @click="store.setPref('themeMode', mode)"
        >{{ t('prefs.' + mode) }}</button>
      </div>
    </div>

    <div class="prefs-row">
      <span class="prefs-label">{{ t('prefs.density') }}</span>
      <div class="prefs-seg">
        <button
          v-for="d in ['compact', 'regular', 'comfy']"
          :key="d"
          class="prefs-seg-btn"
          :class="{ on: store.density === d }"
          @click="store.setPref('density', d)"
        >{{ t('prefs.' + d) }}</button>
      </div>
    </div>

    <div class="prefs-row">
      <span class="prefs-label">{{ t('prefs.accent') }}</span>
      <div style="display:flex;gap:5px">
        <button
          v-for="a in ACCENT_OPTIONS"
          :key="a"
          class="prefs-swatch"
          :class="{ on: store.accent === a }"
          :style="{ background: a }"
          @click="store.setPref('accent', a)"
          :title="a"
        />
      </div>
    </div>
  </div>
</template>
