<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app.js'
import AppIcon from './AppIcons.vue'

const store = useAppStore()
const { t } = useI18n()

const isDark = computed(() => {
  if (store.themeMode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
  return store.themeMode === 'dark'
})

const themeIcon = computed(() => {
  if (store.themeMode === 'light') return 'Sun'
  if (store.themeMode === 'dark') return 'Moon'
  return 'Monitor'
})

const themeLabel = computed(() => t('prefs.' + store.themeMode))

const activeLabel = computed(() => {
  const tab = store.activeTab
  if (!tab) return null
  if (tab.type === 'collection') {
    const db = store.activeDb
    return db ? db.name + ' / ' + tab.title : tab.title
  }
  return tab.title
})

const isMac = computed(() => store.platform === 'darwin')

function cycleTheme() {
  const order = ['light', 'dark', 'system']
  const next = order[(order.indexOf(store.themeMode) + 1) % 3]
  store.setPref('themeMode', next)
}

function winClose() { window.pocketDesk?.winClose() }
function winMin() { window.pocketDesk?.winMinimize() }
function winMax() { window.pocketDesk?.winMaximize() }
</script>

<template>
  <div class="titlebar" :class="isMac ? 'chrome-mac' : 'chrome-windows'">
    <!-- macOS traffic lights -->
    <div v-if="isMac" class="traffic">
      <span class="tl close" @click="winClose" />
      <span class="tl min" @click="winMin" />
      <span class="tl max" @click="winMax" />
    </div>

    <div class="tb-brand">
      <span class="tb-logo">pocket<span class="accent">·desk</span></span>
      <span v-if="activeLabel" class="tb-context">{{ activeLabel }}</span>
    </div>

    <div class="tb-right">
      <button class="theme-btn" @click="cycleTheme" :title="t('titleBar.themeTitle', { label: themeLabel })">
        <AppIcon :name="themeIcon" :size="15" />
        <span>{{ themeLabel }}</span>
      </button>
    </div>

    <!-- Windows controls -->
    <div v-if="!isMac" class="winbtns">
      <button class="wb" @click="winMin" :title="t('titleBar.minimize')"><span class="wb-min" /></button>
      <button class="wb" @click="winMax" :title="t('titleBar.maximize')"><span class="wb-max" /></button>
      <button class="wb close" @click="winClose" :title="t('titleBar.close')">
        <AppIcon name="Close" :size="13" />
      </button>
    </div>
  </div>
</template>
