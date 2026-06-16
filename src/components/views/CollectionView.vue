<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore, sizeStr, oid } from '@/store/app.js'
import AppIcon from '@/components/AppIcons.vue'
import JsonView from '@/components/JsonView.vue'

const props = defineProps({
  dbId:   { type: String, required: true },
  colId:  { type: String, required: true }
})

const store = useAppStore()
const { t } = useI18n()

const db  = computed(() => store.dbById(props.dbId))
const col = computed(() => db.value?.collections.find(c => c.id === props.colId))

const queryState = computed(() => store.queries[props.colId] || { draft: '', committed: '' })
const runToken   = computed(() => store.runTokens[props.colId] || 0)

// ---- Query execution (IPC — the query runs in pocket-db, main process) -----
const result = ref({ docs: [], error: null, ms: 0 })

async function execute() {
  if (!col.value) { result.value = { docs: [], error: null, ms: 0 }; return }
  const s = (queryState.value.committed || '').trim()
  if (!s || s === '{}') {
    result.value = { docs: [...col.value.docs], error: null, ms: 0 }
    return
  }
  let q
  try { q = JSON.parse(s) } catch (e) {
    result.value = { docs: [], error: t('errors.invalidJson', { error: e.message }), ms: 0 }
    return
  }
  try {
    const r = await store.findDocuments(props.dbId, props.colId, q)
    result.value = { docs: r.docs, error: null, ms: r.ms }
  } catch (e) {
    result.value = { docs: [], error: t('errors.invalidQuery', { error: e?.message || e }), ms: 0 }
  }
}

watch(
  [() => queryState.value.committed, runToken, col],
  execute,
  { immediate: true }
)

// ---- Query bar -------------------------------------------------------------
function setDraft(v) { store.setQuery(props.colId, { draft: v }) }
function runNow() {
  store.setQuery(props.colId, { committed: queryState.value.draft })
  store.bumpRun(props.colId)
}
function clearQuery() {
  store.setQuery(props.colId, { draft: '', committed: '' })
  store.bumpRun(props.colId)
}
async function refresh() {
  try {
    await store.fetchCollection(props.dbId, props.colId)
    store.flash(t('store.refreshed'))
  } catch (e) {
    store.flash(t('store.refreshFailed', { error: e?.message || e }))
  }
}

// ---- Tabs: Documents / Indexes ---------------------------------------------
const activeTab = ref('docs') // 'docs' | 'indexes'

// ---- Document actions ------------------------------------------------------
const openCards = ref({}) // docId -> bool

function toggleCard(id) {
  openCards.value = { ...openCards.value, [id]: !openCards.value[id] }
}
function isOpen(id) {
  return openCards.value[id] !== false // open by default
}

function editDoc(doc) {
  store.openModal({
    type: 'edit-doc',
    data: { isNew: false, doc },
    onConfirm: (obj) => {
      obj._id = doc._id
      store.updateDocument(props.dbId, props.colId, obj)
      store.closeModal()
    }
  })
}

function deleteDoc(doc) {
  store.openModal({
    type: 'confirm',
    data: {
      title: t('modals.deleteDoc.title'),
      body: t('modals.deleteDoc.body'),
      detail: '_id: ' + doc._id,
      confirm: t('modals.deleteDoc.confirm'),
      danger: true
    },
    onConfirm: () => {
      store.deleteDocument(props.dbId, props.colId, doc._id)
      store.closeModal()
    }
  })
}

function addDocument() {
  store.openModal({
    type: 'edit-doc',
    data: { isNew: true, doc: { _id: oid() } },
    onConfirm: (obj) => {
      store.insertDocument(props.dbId, props.colId, obj)
      store.closeModal()
    }
  })
}

function createIndexModal() {
  store.openModal({
    type: 'create-index',
    onConfirm: ({ field, type }) => {
      store.createIndex(props.dbId, props.colId, field, type)
      store.closeModal()
    }
  })
}

// ---- Index management -------------------------------------------------------
function dropIndex(field) {
  store.openModal({
    type: 'confirm',
    data: {
      title: t('modals.dropIndex.title'),
      body: t('modals.dropIndex.body', { field }),
      confirm: t('modals.dropIndex.confirm'),
      danger: true
    },
    onConfirm: () => {
      store.dropIndex(props.dbId, props.colId, field)
      store.closeModal()
    }
  })
}

const secondaryIndexes = computed(() => col.value?.indexes.filter(i => i.type !== 'primary') ?? [])

// Result count label (pluralisation simple)
const resultLabel = computed(() => {
  const n = result.value.docs.length
  const hasFilter = queryState.value.committed && queryState.value.committed !== '{}'
  const docWord = n > 1 ? t('collectionView.toolbar.documents').toLowerCase() : 'document'
  const matchWord = n > 1 ? 'correspondants' : 'correspondant'
  return hasFilter ? `${n} ${docWord} ${matchWord}` : `${n} ${docWord}`
})
</script>

<template>
  <div v-if="col && db" class="view">
    <!-- Header -->
    <header class="view-head">
      <div class="vh-title">
        <span class="vh-dot" :style="{ background: db.color }" />
        <div>
          <h2>
            <span class="vh-dim">{{ db.name }}</span>
            <span class="vh-dim"> / </span>
            {{ col.name }}
          </h2>
          <div class="vh-sub">
            <AppIcon name="Collection" :size="13" />
            {{ col.docs.length }} {{ t('collectionView.toolbar.documents').toLowerCase() }} ·
            {{ col.indexes.length }} {{ t('collectionView.toolbar.indexes').toLowerCase() }} ·
            {{ sizeStr(col.estSize) }}
          </div>
        </div>
      </div>
      <div class="vh-indexes">
        <span v-if="secondaryIndexes.length === 0" class="ix-none">{{ t('collectionView.noSecondaryIndex') }}</span>
        <span
          v-for="ix in secondaryIndexes"
          :key="ix.field"
          class="ix-chip"
          :class="ix.type"
        >
          <AppIcon name="Index" :size="12" />
          {{ ix.field }}
          <em>{{ ix.type }}</em>
        </span>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <button class="tbtn primary" @click="addDocument">
        <AppIcon name="Plus" :size="15" />
        <span>{{ t('collectionView.toolbar.addDocument') }}</span>
      </button>
      <button class="tbtn" @click="createIndexModal">
        <AppIcon name="Index" :size="15" />
        <span>{{ t('collectionView.toolbar.createIndex') }}</span>
      </button>
      <!-- Tab switch -->
      <div class="seg" style="margin-left: 8px">
        <button class="seg-btn" :class="{ on: activeTab === 'docs' }" @click="activeTab = 'docs'">{{ t('collectionView.toolbar.documents') }}</button>
        <button class="seg-btn" :class="{ on: activeTab === 'indexes' }" @click="activeTab = 'indexes'">{{ t('collectionView.toolbar.indexes') }}</button>
      </div>
      <span class="tb-spacer" />
      <button class="tbtn" @click="refresh">
        <AppIcon name="Refresh" :size="15" />
        <span>{{ t('collectionView.toolbar.refresh') }}</span>
      </button>
    </div>

    <!-- ====== Documents tab ====== -->
    <template v-if="activeTab === 'docs'">
      <!-- Query bar -->
      <div class="querybar">
        <div class="qfield">
          <span class="q-prefix"><AppIcon name="Search" :size="15" /></span>
          <input
            class="q-input"
            spellcheck="false"
            :value="queryState.draft"
            :placeholder="t('collectionView.query.placeholder')"
            @input="setDraft($event.target.value)"
            @keydown.enter="runNow"
          />
          <button v-if="queryState.draft" class="q-clear" :title="t('collectionView.query.clear')" @click="clearQuery">
            <AppIcon name="Close" :size="14" />
          </button>
        </div>
        <button class="q-run" @click="runNow">
          <AppIcon name="Play" :size="14" />
          <span>{{ t('collectionView.query.run') }}</span>
        </button>
      </div>

      <!-- Result bar -->
      <div class="result-bar">
        <span v-if="result.error" class="result-err">
          <AppIcon name="Warning" :size="13" /> {{ result.error }}
        </span>
        <span v-else class="result-count">
          <strong>{{ result.docs.length }}</strong>
          {{ resultLabel.replace(/^\d+\s*/, '') }}
          <span class="result-time"> · {{ result.ms }} ms</span>
        </span>
      </div>

      <!-- Document cards -->
      <div class="docs-scroll">
        <div v-if="!result.error && result.docs.length === 0" class="docs-empty">
          <AppIcon name="Search" :size="22" />
          <p>{{ t('collectionView.result.noMatch') }}</p>
        </div>

        <div v-for="(doc, i) in result.docs" :key="doc._id" class="doccard">
          <div class="doc-head">
            <button class="doc-fold" @click="toggleCard(doc._id)">
              <AppIcon :name="isOpen(doc._id) ? 'ChevronDown' : 'ChevronRight'" :size="14" />
            </button>
            <span class="doc-idx">{{ i + 1 }}</span>
            <code class="doc-id" :style="{ '--c': db.color }">{{ doc._id }}</code>
            <div class="doc-actions">
              <button class="doc-btn" :title="t('collectionView.doc.edit')" @click="editDoc(doc)">
                <AppIcon name="Edit" :size="15" />
              </button>
              <button class="doc-btn danger" :title="t('collectionView.doc.delete')" @click="deleteDoc(doc)">
                <AppIcon name="Trash" :size="15" />
              </button>
            </div>
          </div>
          <div v-if="isOpen(doc._id)" class="doc-body">
            <JsonView :value="doc" :depth="0" :last="true" :is-root="true" />
          </div>
        </div>
      </div>
    </template>

    <!-- ====== Indexes tab ====== -->
    <template v-else>
      <div class="table-wrap">
        <table class="dtable">
          <thead>
            <tr>
              <th>{{ t('collectionView.indexTable.field') }}</th>
              <th>{{ t('collectionView.indexTable.type') }}</th>
              <th class="num">{{ t('collectionView.indexTable.documents') }}</th>
              <th class="act"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="col.indexes.length === 0" class="empty-row">
              <td colspan="4">{{ t('collectionView.indexTable.noIndexes') }}</td>
            </tr>
            <tr v-for="ix in col.indexes" :key="ix.field">
              <td>
                <div class="cname">
                  <AppIcon name="Index" :size="16" />
                  <span>{{ ix.field }}</span>
                </div>
              </td>
              <td>
                <span class="ix-chip" :class="ix.type" style="font-size: 11px">
                  <em>{{ ix.type }}</em>
                </span>
              </td>
              <td class="num">{{ col.docs.length }}</td>
              <td class="act">
                <button
                  v-if="ix.type !== 'primary'"
                  class="row-icon"
                  :title="t('collectionView.indexTable.deleteIndex')"
                  @click="dropIndex(ix.field)"
                >
                  <AppIcon name="Trash" :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="toolbar" style="padding: 12px 0 0">
          <button class="tbtn primary" @click="createIndexModal">
            <AppIcon name="Plus" :size="15" />
            <span>{{ t('collectionView.indexTable.createIndex') }}</span>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
