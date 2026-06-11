<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/store/app.js'
import AppIcon from '@/components/AppIcons.vue'
import DbMenu from './DbMenu.vue'

const store = useAppStore()
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
          title: 'Ajouter une collection',
          label: 'Nom de la collection',
          placeholder: 'ex : sessions',
          icon: 'Collection',
          confirm: 'Créer'
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
          title: 'Renommer la base',
          label: 'Nom de la connexion',
          value: db.name,
          confirm: 'Renommer'
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
      store.flash('Onglets de « ' + db.name + ' » fermés')
      break

    case 'close':
      store.openModal({
        type: 'confirm',
        data: {
          title: 'Fermer la base',
          body: `Fermer « ${db.name} » ? La connexion sera retirée de la liste (le fichier n'est pas supprimé).`,
          confirm: 'Fermer la base',
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
      title: 'Supprimer la collection',
      body: `Supprimer définitivement « ${c.name} » et ses ${c.docs.length} documents ?`,
      confirm: 'Supprimer',
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
        <span>Ouvrir une base</span>
      </button>
    </div>

    <div class="side-scroll">
      <div class="side-label">Bases ouvertes</div>

      <div v-if="store.databases.length === 0" class="side-empty">
        Aucune base ouverte.<br />Ouvrez un fichier <code>.pdb</code>.
      </div>

      <div v-for="db in store.databases" :key="db.id" class="db-block">
        <div class="db-row" :class="{ active: isDbActive(db.id) }">
          <!-- Caret: expand/collapse -->
          <button class="db-caret" @click="store.toggleExpand(db.id)" :title="db.expanded ? 'Replier' : 'Déplier'">
            <AppIcon :name="db.expanded ? 'ChevronDown' : 'ChevronRight'" :size="15" />
          </button>
          <!-- Main: open db tab -->
          <button class="db-main" @click="store.openDbTab(db.id)">
            <span class="dot" :style="{ background: db.color }" />
            <span class="db-name">{{ db.name }}</span>
            <span class="db-meta">{{ db.collections.length }}</span>
          </button>
          <!-- Options menu -->
          <button class="db-dots" @click="openMenu($event, db.id)" title="Options">
            <AppIcon name="Dots" :size="16" />
          </button>
        </div>

        <!-- Collections list -->
        <div v-if="db.expanded" class="col-list">
          <div v-if="db.collections.length === 0" class="col-empty">— aucune collection —</div>
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
              title="Supprimer la collection"
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
      @action="(a) => handleDbMenuAction(a, menu.dbId)"
      @close="menu = null"
    />
  </aside>
</template>
