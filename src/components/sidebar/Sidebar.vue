<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/store/app.js'
import AppIcon from '@/components/AppIcons.vue'
import DbMenu from './DbMenu.vue'

const store = useAppStore()
const { t } = useI18n()
const menu = ref(null) // { dbId, top, left }

function openMenu(e, dbId) {
  e.stopPropagation()
  const r = e.currentTarget.getBoundingClientRect()
  menu.value = { dbId, top: r.bottom + 4, left: Math.max(8, r.left - 180) }
}

async function handleDbMenuAction(action, dbId) {
  const db = store.dbById(dbId)
  if (!db) return

  switch (action) {
    case 'add-collection':
      store.openModal({
        type: 'prompt',
        data: {
          title: t('modals.addCollection.title'),
          label: t('modals.addCollection.label'),
          placeholder: t('modals.addCollection.placeholder'),
          icon: 'Collection',
          confirm: t('modals.addCollection.confirm')
        },
        onConfirm: (val) => {
          store.addCollection(dbId, val)
          store.closeModal()
        }
      })
      break

    case 'rename':
      store.openModal({
        type: 'prompt',
        data: {
          title: t('modals.renameDb.title'),
          label: t('modals.renameDb.label'),
          value: db.name,
          confirm: t('modals.renameDb.confirm')
        },
        onConfirm: (val) => {
          store.renameDatabase(dbId, val)
          store.closeModal()
        }
      })
      break

    case 'duplicate':
      store.duplicateDatabase(dbId)
      break

    case 'compact':
      await store.compactDatabase(dbId)
      break

    case 'close-tabs':
      store.closeDbTabs(dbId)
      store.flash(t('store.tabsClosed', { name: db.name }))
      break

    case 'disconnect':
      store.openModal({
        type: 'confirm',
        data: {
          title: t('modals.disconnectDb.title'),
          body: t('modals.disconnectDb.body', { name: db.name }),
          confirm: t('modals.disconnectDb.confirm'),
          danger: true
        },
        onConfirm: () => {
          store.disconnectDatabase(dbId)
          store.closeModal()
        }
      })
      break

    case 'reconnect':
      store.reconnectDatabase(dbId)
      break

    case 'close':
      store.openModal({
        type: 'confirm',
        data: {
          title: t('modals.closeDb.title'),
          body: t('modals.closeDb.body', { name: db.name }),
          confirm: t('modals.closeDb.confirm'),
          danger: true
        },
        onConfirm: () => {
          store.closeDatabase(dbId)
          store.closeModal()
        }
      })
      break
  }
}

function handleDeleteCollection(dbId, colId) {
  const db = store.dbById(dbId)
  const c = db && db.collections.find(x => x.id === colId)
  if (!c) return
  store.openModal({
    type: 'confirm',
    data: {
      title: t('modals.deleteCollection.title'),
      body: t('modals.deleteCollection.body', { name: c.name, count: c.docs.length }),
      confirm: t('modals.deleteCollection.confirm'),
      danger: true
    },
    onConfirm: () => {
      store.deleteCollection(dbId, colId)
      store.closeModal()
    }
  })
}

function isDbActive(dbId) {
  return store.activeTab?.type === 'db' && store.activeTab?.dbId === dbId
}
function isColActive(dbId, colId) {
  return store.activeTab?.type === 'collection' &&
    store.activeTab?.dbId === dbId &&
    store.activeTab?.collectionId === colId
}
</script>

<template>
  <aside class="sidebar" style="width: 264px">
    <div class="side-head">
      <button class="open-db" @click="store.openModal({ type: 'new-connection' })">
        <AppIcon name="Plus" :size="16" />
        <span>{{ t('sidebar.openDb') }}</span>
      </button>
    </div>

    <div class="side-scroll">
      <div class="side-label">{{ t('sidebar.openedDbs') }}</div>

      <div v-if="store.databases.length === 0" class="side-empty">
        {{ t('sidebar.noDbs') }}<br />{{ t('sidebar.noDbsHint') }}
      </div>

      <div v-for="db in store.databases" :key="db.id" class="db-block">
        <div class="db-row" :class="{ active: isDbActive(db.id), disconnected: db.connected === false }">
          <!-- Caret: expand/collapse (disabled while disconnected) -->
          <button
            class="db-caret"
            :disabled="db.connected === false"
            @click="store.toggleExpand(db.id)"
            :title="db.connected === false ? t('sidebar.disconnectedHint') : (db.expanded ? t('sidebar.collapse') : t('sidebar.expand'))"
          >
            <AppIcon :name="db.expanded ? 'ChevronDown' : 'ChevronRight'" :size="15" />
          </button>
          <!-- Main: open db tab -->
          <button class="db-main" @click="store.openDbTab(db.id)">
            <span class="dot" :style="{ background: db.color }" />
            <span class="db-name">{{ db.name }}</span>
            <span v-if="db.connected === false" class="db-badge">{{ t('sidebar.disconnected') }}</span>
            <span v-else class="db-meta">{{ db.collections.length }}</span>
          </button>
          <!-- Quick reconnect -->
          <button
            v-if="db.connected === false"
            class="db-reconnect"
            :title="t('sidebar.reconnect')"
            @click="store.reconnectDatabase(db.id)"
          >
            <AppIcon name="Plug" :size="15" />
          </button>
          <!-- Options menu -->
          <button class="db-dots" @click="openMenu($event, db.id)" :title="t('sidebar.options')">
            <AppIcon name="Dots" :size="16" />
          </button>
        </div>

        <!-- Collections list -->
        <div v-if="db.expanded && db.connected !== false" class="col-list">
          <div v-if="db.collections.length === 0" class="col-empty">{{ t('sidebar.noCollections') }}</div>
          <div
            v-for="col in db.collections"
            :key="col.id"
            class="col-row"
            :class="{ active: isColActive(db.id, col.id) }"
            @click="store.openCollectionTab(db.id, col.id)"
          >
            <span class="col-rail" :style="{ background: db.color }" />
            <AppIcon name="Collection" :size="15" />
            <span class="col-name">{{ col.name }}</span>
            <span class="col-count">{{ col.docs.length }}</span>
            <button
              class="col-del"
              :title="t('sidebar.deleteCollection')"
              @click.stop="handleDeleteCollection(db.id, col.id)"
            >
              <AppIcon name="Trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Context menu -->
    <DbMenu
      v-if="menu"
      :anchor="menu"
      :db-id="menu.dbId"
      :connected="store.dbById(menu.dbId)?.connected !== false"
      @action="(a) => handleDbMenuAction(a, menu.dbId)"
      @close="menu = null"
    />
  </aside>
</template>
