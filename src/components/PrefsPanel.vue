<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAppStore, ACCENT_OPTIONS } from '@/store/app.js'
import AppIcon from './AppIcons.vue'

const emit = defineEmits(['close'])
const store = useAppStore()

function onClickAway() { emit('close') }
onMounted(() => setTimeout(() => document.addEventListener('mousedown', onClickAway), 50))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickAway))
</script>

<template>
  <div class="prefs-panel" @mousedown.stop>
    <div class="prefs-section">Apparence</div>

    <div class="prefs-row">
      <span class="prefs-label">Thème</span>
      <div class="prefs-seg">
        <button
          v-for="t in ['light', 'dark', 'system']"
          :key="t"
          class="prefs-seg-btn"
          :class="{ on: store.themeMode === t }"
          @click="store.setPref('themeMode', t)"
        >{{ t === 'light' ? 'Clair' : t === 'dark' ? 'Sombre' : 'Système' }}</button>
      </div>
    </div>

    <div class="prefs-row">
      <span class="prefs-label">Densité</span>
      <div class="prefs-seg">
        <button
          v-for="d in ['compact', 'regular', 'comfy']"
          :key="d"
          class="prefs-seg-btn"
          :class="{ on: store.density === d }"
          @click="store.setPref('density', d)"
        >{{ d === 'compact' ? 'Dense' : d === 'regular' ? 'Normal' : 'Spacieux' }}</button>
      </div>
    </div>

    <div class="prefs-row">
      <span class="prefs-label">Accent</span>
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
