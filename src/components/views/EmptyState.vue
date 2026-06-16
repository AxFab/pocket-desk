<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app.js'
import AppIcon from '@/components/AppIcons.vue'

// Import logos
import logoLight from '@/assets/logo_light.png'
import logoDark from '@/assets/logo_dark.png'

const store = useAppStore()
const { t, tm } = useI18n()

const isDark = computed(() => {
  if (store.themeMode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
  return store.themeMode === 'dark'
})

const logo = computed(() => isDark.value ? logoDark : logoLight)
const tips = computed(() => tm('tips'))
const tip = computed(() => tips.value[store.tipIndex % tips.value.length])
</script>

<template>
  <div class="empty-stage">
    <div class="empty-inner">
      <div class="logo-tile">
        <img :src="logo" alt="pocket-db" />
      </div>

      <h1 class="wordmark">pocket<span class="accent">·desk</span></h1>
      <p class="tagline">{{ t('emptyState.tagline') }}</p>

      <button class="cta" @click="store.openModal({ type: 'new-connection' })">
        <AppIcon name="Plus" :size="16" />
        <span>{{ t('emptyState.openDb') }}</span>
      </button>

      <div class="tip-card">
        <div class="tip-head">
          <span class="tip-kicker">{{ t('emptyState.tipOfDay') }}</span>
          <button class="tip-refresh" @click="store.nextTip()" :title="t('emptyState.nextTip')">
            <AppIcon name="Refresh" :size="14" />
          </button>
        </div>
        <div class="tip-title">{{ tip.t }}</div>
        <div class="tip-body">{{ tip.d }}</div>
      </div>
    </div>
  </div>
</template>
