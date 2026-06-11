<script setup>
import { computed } from 'vue'
import { useAppStore } from '@/store/app.js'
import { TIPS } from '@/store/app.js'
import AppIcon from '@/components/AppIcons.vue'

// Import logos
import logoLight from '@/assets/logo_light.png'
import logoDark from '@/assets/logo_dark.png'

const store = useAppStore()

const isDark = computed(() => {
  if (store.themeMode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
  return store.themeMode === 'dark'
})

const logo = computed(() => isDark.value ? logoDark : logoLight)
const tip = computed(() => TIPS[store.tipIndex % TIPS.length])
</script>

<template>
  <div class="empty-stage">
    <div class="empty-inner">
      <div class="logo-tile">
        <img :src="logo" alt="pocket-db" />
      </div>

      <h1 class="wordmark">pocket<span class="accent">·desk</span></h1>
      <p class="tagline">Explorateur de bases <code>.pdb</code> — un fichier, zéro serveur.</p>

      <button class="cta" @click="store.openModal({ type: 'new-connection' })">
        <AppIcon name="Plus" :size="16" />
        <span>Ouvrir une base</span>
      </button>

      <div class="tip-card">
        <div class="tip-head">
          <span class="tip-kicker">Astuce du jour</span>
          <button class="tip-refresh" @click="store.nextTip()" title="Autre astuce">
            <AppIcon name="Refresh" :size="14" />
          </button>
        </div>
        <div class="tip-title">{{ tip.t }}</div>
        <div class="tip-body">{{ tip.d }}</div>
      </div>
    </div>
  </div>
</template>
