<script setup>
import { computed } from 'vue'
import { useAppStore, sizeStr } from '@/store/app.js'
import AppIcon from '@/components/AppIcons.vue'

const props = defineProps({
  dbId: { type: String, required: true }
})

const store = useAppStore()
const db = computed(() => store.dbById(props.dbId))

const totalDocs = computed(() => db.value?.collections.reduce((s, c) => s + c.docs.length, 0) ?? 0)
const totalSize = computed(() => db.value?.collections.reduce((s, c) => s + c.estSize, 0) ?? 0)
const totalDead = computed(() => db.value?.collections.reduce((s, c) => s + c.dead, 0) ?? 0)

const toolbarActions = [
  { id: 'add-collection', label: 'Ajouter une collection', icon: 'Plus', primary: true },
  { id: 'rename',         label: 'Renommer',               icon: 'Rename' },
  { id: 'duplicate',      label: 'Dupliquer',              icon: 'Copy' },
  { id: 'compact',        label: 'Compacter',              icon: 'Compact' },
  { id: 'close-tabs',     label: 'Fermer les onglets',     icon: 'CloseTabs' },
]

function handleAction(id) {
  const dbId = props.dbId
  const db = store.dbById(dbId)

  switch (id) {
    case 'add-collection':
      store.openModal({
        type: 'prompt',
        data: { title: 'Ajouter une collection', label: 'Nom', placeholder: 'ex : sessions', icon: 'Collection', confirm: 'Créer' },
        onConfirm: (val) => { store.addCollection(dbId, val); store.closeModal() }
      })
      break
    case 'rename':
      store.openModal({
        type: 'prompt',
        data: { title: 'Renommer la base', label: 'Nom de la connexion', value: db.name, confirm: 'Renommer' },
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
      store.flash('Onglets fermés')
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
      title: 'Supprimer la collection',
      body: `Supprimer définitivement « ${col.name} » et ses ${col.docs.length} documents ?`,
      confirm: 'Supprimer',
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
          <span class="stat-l">collections</span>
        </div>
        <div class="stat">
          <span class="stat-n">{{ totalDocs }}</span>
          <span class="stat-l">documents</span>
        </div>
        <div class="stat">
          <span class="stat-n">{{ sizeStr(totalSize) }}</span>
          <span class="stat-l">sur disque</span>
        </div>
        <div class="stat">
          <span class="stat-n">{{ totalDead }}</span>
          <span class="stat-l">enreg. morts</span>
        </div>
      </div>
    </header>

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
            <th>Collection</th>
            <th class="num">Documents</th>
            <th class="num">Index</th>
            <th class="num">Taille est.</th>
            <th class="num">Morts</th>
            <th class="act"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="db.collections.length === 0" class="empty-row">
            <td colspan="6">Aucune collection. Utilisez « Ajouter une collection ».</td>
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
              <button class="row-icon" title="Supprimer" @click.stop="deleteCollection(col.id)">
                <AppIcon name="Trash" :size="15" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
