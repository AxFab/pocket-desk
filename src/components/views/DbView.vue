<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore, sizeStr } from '@/store/app.js'
import AppIcon from '@/components/AppIcons.vue'

const props = defineProps({
  dbId: { type: String, required: true }
})

const store = useAppStore()
const { t } = useI18n()
const db = computed(() => store.dbById(props.dbId))

const totalDocs = computed(() => db.value?.collections.reduce((s, c) => s + c.docs.length, 0) ?? 0)
const totalSize = computed(() => db.value?.collections.reduce((s, c) => s + c.estSize, 0) ?? 0)
const totalDead = computed(() => db.value?.collections.reduce((s, c) => s + c.dead, 0) ?? 0)

const toolbarActions = computed(() => [
  { id: 'add-collection', label: t('dbView.toolbar.addCollection'), icon: 'Plus', primary: true },
  { id: 'rename',         label: t('dbView.toolbar.rename'),        icon: 'Rename' },
  { id: 'duplicate',      label: t('dbView.toolbar.duplicate'),     icon: 'Copy' },
  { id: 'compact',        label: t('dbView.toolbar.compact'),       icon: 'Compact' },
  { id: 'close-tabs',     label: t('dbView.toolbar.closeTabs'),     icon: 'CloseTabs' },
  { id: 'disconnect',     label: t('dbView.toolbar.disconnect'),    icon: 'PlugOff' },
])

function handleAction(id) {
  const dbId = props.dbId
  const db = store.dbById(dbId)

  switch (id) {
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
        onConfirm: (val) => { store.addCollection(dbId, val); store.closeModal() }
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
        onConfirm: (val) => { store.renameDatabase(dbId, val); store.closeModal() }
      })
      break
    case 'duplicate':
      store.duplicateDatabase(dbId)
      break
    case 'compact':
      store.compactDatabase(dbId)
      break
    case 'close-tabs':
      store.closeDbTabs(dbId)
      store.flash(t('store.tabsClosedShort'))
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
        onConfirm: () => { store.disconnectDatabase(dbId); store.closeModal() }
      })
      break
  }
}

function openCollection(colId) {
  store.openCollectionTab(props.dbId, colId)
}

function deleteCollection(colId) {
  const col = db.value?.collections.find(c => c.id === colId)
  if (!col) return
  store.openModal({
    type: 'confirm',
    data: {
      title: t('modals.deleteCollection.title'),
      body: t('modals.deleteCollection.body', { name: col.name, count: col.docs.length }),
      confirm: t('modals.deleteCollection.confirm'),
      danger: true
    },
    onConfirm: () => { store.deleteCollection(props.dbId, colId); store.closeModal() }
  })
}
</script>

<template>
  <div v-if="db" class="view">
    <!-- Header -->
    <header class="view-head">
      <div class="vh-title">
        <span class="vh-dot" :style="{ background: db.color }" />
        <div>
          <h2>{{ db.name }}</h2>
          <div class="vh-sub">
            <AppIcon name="Folder" :size="13" />
            <code>{{ db.path }}</code>
          </div>
        </div>
      </div>
      <div class="vh-stats">
        <div class="stat">
          <span class="stat-n">{{ db.collections.length }}</span>
          <span class="stat-l">{{ t('dbView.stats.collections') }}</span>
        </div>
        <div class="stat">
          <span class="stat-n">{{ totalDocs }}</span>
          <span class="stat-l">{{ t('dbView.stats.documents') }}</span>
        </div>
        <div class="stat">
          <span class="stat-n">{{ sizeStr(totalSize) }}</span>
          <span class="stat-l">{{ t('dbView.stats.onDisk') }}</span>
        </div>
        <div class="stat">
          <span class="stat-n">{{ totalDead }}</span>
          <span class="stat-l">{{ t('dbView.stats.deadRecords') }}</span>
        </div>
      </div>
    </header>

    <!-- Disconnected banner -->
    <div v-if="db.connected === false" class="disconnected-banner">
      <AppIcon name="PlugOff" :size="22" />
      <p>{{ t('dbView.disconnected.message') }}</p>
      <button class="tbtn primary" @click="store.reconnectDatabase(dbId)">
        <AppIcon name="Plug" :size="15" />
        <span>{{ t('dbView.disconnected.reconnect') }}</span>
      </button>
    </div>

    <template v-else>
      <!-- Toolbar -->
      <div class="toolbar">
        <button
          v-for="a in toolbarActions"
          :key="a.id"
          class="tbtn"
          :class="{ primary: a.primary }"
          @click="handleAction(a.id)"
        >
          <AppIcon :name="a.icon" :size="15" />
          <span>{{ a.label }}</span>
        </button>
      </div>

      <!-- Collections table -->
      <div class="table-wrap">
        <table class="dtable">
          <thead>
            <tr>
              <th>{{ t('dbView.table.collection') }}</th>
              <th class="num">{{ t('dbView.table.documents') }}</th>
              <th class="num">{{ t('dbView.table.index') }}</th>
              <th class="num">{{ t('dbView.table.estSize') }}</th>
              <th class="num">{{ t('dbView.table.dead') }}</th>
              <th class="act"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="db.collections.length === 0" class="empty-row">
              <td colspan="6">{{ t('dbView.table.noCollections') }}</td>
            </tr>
            <tr
              v-for="col in db.collections"
              :key="col.id"
              @click="openCollection(col.id)"
            >
              <td>
                <div class="cname">
                  <AppIcon name="Collection" :size="16" />
                  <span>{{ col.name }}</span>
                </div>
              </td>
              <td class="num">{{ col.docs.length }}</td>
              <td class="num">{{ col.indexes.length }}</td>
              <td class="num">{{ sizeStr(col.estSize) }}</td>
              <td class="num dead">{{ col.dead }}</td>
              <td class="act">
                <button class="row-icon" :title="t('dbView.table.delete')" @click.stop="deleteCollection(col.id)">
                  <AppIcon name="Trash" :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
