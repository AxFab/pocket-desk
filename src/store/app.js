import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// ---- Helpers ----------------------------------------------------------------

let __counter = Math.floor(Math.random() * 0xffffff)
export function oid() {
  const ts = Math.floor(Date.now() / 1000)
  const tsHex = ts.toString(16).padStart(8, '0')
  let rnd = ''
  for (let i = 0; i < 10; i++) rnd += Math.floor(Math.random() * 16).toString(16)
  __counter = (__counter + 1) % 0xffffff
  const cnt = __counter.toString(16).padStart(6, '0')
  return (tsHex + rnd + cnt).slice(0, 24)
}

export function sizeStr(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export function approxDocSize(doc) {
  return JSON.stringify(doc).length + 8
}

// ---- Constants --------------------------------------------------------------

export const DB_COLORS = [
  { id: 'clay',   hex: '#b06b4f', label: 'Argile' },
  { id: 'moss',   hex: '#7d8c4e', label: 'Mousse' },
  { id: 'slate',  hex: '#5f7585', label: 'Ardoise' },
  { id: 'ochre',  hex: '#c0954c', label: 'Ocre' },
  { id: 'plum',   hex: '#8a5d72', label: 'Prune' },
  { id: 'pine',   hex: '#4f8c7d', label: 'Pin' },
  { id: 'rust',   hex: '#a8553f', label: 'Rouille' },
  { id: 'indigo', hex: '#5e6699', label: 'Indigo' },
]

export const TIPS = [
  { t: 'Compactez régulièrement', d: 'Chaque update ou delete laisse un enregistrement mort. db.compact() réécrit le fichier en une passe et récupère l\'espace.' },
  { t: 'Indexez avant de trier', d: 'Le tri est toujours eager. Réduisez d\'abord l\'ensemble candidat avec une requête indexée avant de trier de grandes collections.' },
  { t: 'Un fichier, une base', d: 'Une instance pocket-db est un unique fichier .pdb — copiez-le pour sauvegarder, déplacez-le pour migrer. Pas de serveur, pas de démon.' },
  { t: 'Les _id sont immuables', d: 'Le champ _id (24 caractères hex) ne peut être modifié par aucun opérateur d\'update. Fournissez le vôtre à l\'insertion si besoin.' },
  { t: 'Le planificateur choisit l\'index', d: 'Pour chaque requête, pocket-db sélectionne automatiquement l\'index le plus sélectif disponible. NumberIndex gère aussi les scans de plage.' },
]

export const ACCENT_OPTIONS = ['#3f9a4f', '#3c7d8a', '#9a6a3f', '#7a5aa0']

// ---- Prefs helpers ----------------------------------------------------------

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem('pocket-desk-prefs') || '{}')
  } catch { return {} }
}

function savePrefs(prefs) {
  try { localStorage.setItem('pocket-desk-prefs', JSON.stringify(prefs)) } catch {}
}

/** Strips Electron's IPC prefix from error messages. */
export function ipcError(e) {
  const msg = e?.message || String(e)
  return msg.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '')
}

// ---- Store ------------------------------------------------------------------

export const useAppStore = defineStore('app', () => {
  // Preferences (persisted)
  const _prefs = loadPrefs()
  const themeMode = ref(_prefs.themeMode || 'system') // 'light' | 'dark' | 'system'
  const density = ref(_prefs.density || 'regular')    // 'compact' | 'regular' | 'comfy'
  const accent = ref(_prefs.accent || '#3f9a4f')

  function setPref(key, value) {
    const map = { themeMode, density, accent }
    if (map[key]) {
      map[key].value = value
      savePrefs({ themeMode: themeMode.value, density: density.value, accent: accent.value })
    }
  }

  // State
  /**
   * databases: Array<{
   *   id: string, name: string, fileName: string, path: string,
   *   color: string, colorId: string, expanded: boolean,
   *   collections: Array<{
   *     id: string, name: string, docs: any[], indexes: any[],
   *     estSize: number, dead: number
   *   }>
   * }>
   */
  const databases = ref([])

  /** tabs: Array<{ id, type:'db'|'collection', dbId, collectionId?, title, color }> */
  const tabs = ref([])
  const activeId = ref(null)

  /** modal: { type, data?, onConfirm? } | null */
  const modal = ref(null)

  /** queries: { [colId]: { draft: string, committed: string } } */
  const queries = ref({})

  /** runTokens: { [colId]: number } — bumped to force re-run */
  const runTokens = ref({})

  const toast = ref(null)
  let toastTimer = null

  const tipIndex = ref(Math.floor(Math.random() * TIPS.length))

  // Platform info (set after init)
  const platform = ref('darwin')

  // ---- Computed ---------------------------------------------------------------

  const activeTab = computed(() => tabs.value.find(t => t.id === activeId.value) || null)
  const activeDb = computed(() => activeTab.value ? databases.value.find(d => d.id === activeTab.value.dbId) : null)

  function dbById(id) { return databases.value.find(d => d.id === id) }
  function colById(dbId, colId) {
    const db = dbById(dbId)
    return db ? db.collections.find(c => c.id === colId) : null
  }

  // ---- Toast ------------------------------------------------------------------

  function flash(msg) {
    toast.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.value = null }, 2600)
  }

  // ---- Tab management ---------------------------------------------------------

  function focusOrOpen(tab) {
    if (!tabs.value.some(t => t.id === tab.id)) {
      tabs.value = [...tabs.value, tab]
    }
    activeId.value = tab.id
  }

  function openDbTab(dbId) {
    const db = dbById(dbId)
    if (!db) return
    focusOrOpen({ id: 't_db_' + dbId, type: 'db', dbId, title: db.name, color: db.color })
  }

  function openCollectionTab(dbId, colId) {
    const db = dbById(dbId)
    const c = db && db.collections.find(x => x.id === colId)
    if (!c) return
    focusOrOpen({ id: 't_col_' + colId, type: 'collection', dbId, collectionId: colId, title: c.name, color: db.color })
    if (!queries.value[colId]) {
      queries.value = { ...queries.value, [colId]: { draft: '', committed: '' } }
    }
  }

  function closeTab(id) {
    const idx = tabs.value.findIndex(t => t.id === id)
    const next = tabs.value.filter(t => t.id !== id)
    if (id === activeId.value) {
      activeId.value = next.length ? (next[Math.max(0, idx - 1)] || next[0]).id : null
    }
    tabs.value = next
  }

  function reorderTabs(from, to) {
    const arr = [...tabs.value]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    tabs.value = arr
  }

  function closeDbTabs(dbId) {
    const next = tabs.value.filter(t => t.dbId !== dbId)
    if (activeTab.value && activeTab.value.dbId === dbId) {
      activeId.value = next.length ? next[next.length - 1].id : null
    }
    tabs.value = next
  }

  // ---- Database mutations -----------------------------------------------------

  function toggleExpand(dbId) {
    databases.value = databases.value.map(d =>
      d.id === dbId ? { ...d, expanded: !d.expanded } : d
    )
  }

  function patchDb(dbId, fn) {
    databases.value = databases.value.map(d => d.id === dbId ? fn(d) : d)
  }

  function patchCol(dbId, colId, fn) {
    patchDb(dbId, d => ({ ...d, collections: d.collections.map(c => c.id === colId ? fn(c) : c) }))
  }

  function recalc(c) {
    const estSize = c.docs.reduce((s, x) => s + approxDocSize(x), 0) + 64
    return { ...c, estSize }
  }

  // ---- IPC data loop ------------------------------------------------------------
  // IPC (main process / pocket-db) is the source of truth: after every mutation
  // the affected collection is re-fetched and replaces the local state.

  /** Re-fetches docs + indexes of one collection from the main process. */
  async function fetchCollection(dbId, colId) {
    const c = colById(dbId, colId)
    if (!c) return
    const [stats, res] = await Promise.all([
      window.pocketDesk.collectionStats(dbId, c.name),
      window.pocketDesk.find(dbId, c.name, {})
    ])
    patchCol(dbId, colId, col => recalc({
      ...col,
      docs: res.docs,
      indexes: stats.indexes
    }))
    bumpRun(colId)
  }

  /** Runs a query via IPC. Returns { docs, ms }. */
  function findDocuments(dbId, colId, query) {
    const c = colById(dbId, colId)
    if (!c) return Promise.resolve({ docs: [], ms: 0 })
    return window.pocketDesk.find(dbId, c.name, query)
  }

  // Open a new database connection
  async function openDatabase({ path, name, color }) {
    const id = 'db_' + Math.random().toString(36).slice(2, 8)
    const colorId = (DB_COLORS.find(c => c.hex === color) || {}).id || ''

    let result
    try {
      result = await window.pocketDesk.openDb(id, path)
    } catch (e) {
      flash('Échec d\'ouverture : ' + ipcError(e))
      return null
    }

    const collections = (result?.collections || []).map(c => ({
      id: 'col_' + Math.random().toString(36).slice(2, 8),
      name: c.name,
      docs: [],
      indexes: c.indexes || [{ field: '_id', type: 'primary' }],
      estSize: 64,
      dead: 0
    }))

    const fileName = path.replace(/.*[/\\]/, '')
    const db = {
      id, name: name || fileName.replace(/\.pdb$/, ''),
      fileName, path, color, colorId, expanded: true, collections
    }
    databases.value = [...databases.value, db]

    // Load the documents of every collection (IPC = source of truth)
    try {
      await Promise.all(collections.map(c => fetchCollection(id, c.id)))
    } catch (e) {
      flash('Erreur de chargement : ' + ipcError(e))
    }

    setTimeout(() => openDbTab(id), 0)
    flash('Base « ' + db.name + ' » ouverte')
    return db
  }

  async function closeDatabase(dbId) {
    try { await window.pocketDesk.closeDb(dbId) } catch {}
    closeDbTabs(dbId)
    databases.value = databases.value.filter(d => d.id !== dbId)
  }

  async function compactDatabase(dbId) {
    const db = dbById(dbId)
    if (!db) return
    const before = db.collections.reduce((s, c) => s + c.dead, 0)
    try {
      await window.pocketDesk.compact(dbId)
    } catch (e) {
      flash('Échec du compactage : ' + ipcError(e))
      return
    }
    patchDb(dbId, d => ({ ...d, collections: d.collections.map(c => ({ ...c, dead: 0 })) }))
    await Promise.all(db.collections.map(c => fetchCollection(dbId, c.id).catch(() => {})))
    flash('Base compactée · ' + before + ' enregistrements morts récupérés')
  }

  function renameDatabase(dbId, name) {
    patchDb(dbId, d => ({ ...d, name }))
    tabs.value = tabs.value.map(t => t.type === 'db' && t.dbId === dbId ? { ...t, title: name } : t)
  }

  async function duplicateDatabase(dbId) {
    const db = dbById(dbId)
    if (!db) return
    const destPath = db.path.replace(/\.pdb$/, '-copie.pdb')
    try {
      await window.pocketDesk.duplicateFile(db.path, destPath)
    } catch (e) {
      flash('Échec de la duplication : ' + ipcError(e))
      return
    }
    const copy = await openDatabase({ path: destPath, name: db.name + '-copie', color: db.color })
    if (copy) flash('Base dupliquée → « ' + copy.name + ' »')
  }

  // ---- Collection mutations ---------------------------------------------------

  async function addCollection(dbId, name) {
    const id = 'col_' + Math.random().toString(36).slice(2, 8)
    let stats
    try {
      stats = await window.pocketDesk.createCollection(dbId, name)
    } catch (e) {
      flash('Échec de création : ' + ipcError(e))
      return
    }
    patchDb(dbId, d => ({
      ...d,
      expanded: true,
      collections: [...d.collections, {
        id, name,
        docs: [],
        indexes: stats?.indexes || [{ field: '_id', type: 'primary' }],
        estSize: 64, dead: 0
      }]
    }))
    flash('Collection « ' + name + ' » créée')
  }

  async function deleteCollection(dbId, colId) {
    const c = colById(dbId, colId)
    if (!c) return
    try {
      await window.pocketDesk.dropCollection(dbId, c.name)
    } catch (e) {
      flash('Échec de suppression : ' + ipcError(e))
      return
    }
    patchDb(dbId, d => ({ ...d, collections: d.collections.filter(x => x.id !== colId) }))
    closeTab('t_col_' + colId)
    flash('Collection « ' + c.name + ' » supprimée')
  }

  // ---- Document mutations (IPC first, then re-fetch) ---------------------------

  async function insertDocument(dbId, colId, doc) {
    if (!doc._id) doc._id = oid()
    const c = colById(dbId, colId)
    if (!c) return
    try {
      await window.pocketDesk.insertOne(dbId, c.name, doc)
    } catch (e) {
      flash('Échec de l\'insertion : ' + ipcError(e))
      return
    }
    await fetchCollection(dbId, colId)
    flash('Document inséré')
  }

  async function updateDocument(dbId, colId, doc) {
    const c = colById(dbId, colId)
    if (!c) return
    try {
      await window.pocketDesk.replaceOne(dbId, c.name, doc)
    } catch (e) {
      flash('Échec de la mise à jour : ' + ipcError(e))
      return
    }
    patchCol(dbId, colId, col => ({ ...col, dead: col.dead + 1 }))
    await fetchCollection(dbId, colId)
    flash('Document mis à jour')
  }

  async function deleteDocument(dbId, colId, docId) {
    const c = colById(dbId, colId)
    if (!c) return
    try {
      await window.pocketDesk.deleteOne(dbId, c.name, docId)
    } catch (e) {
      flash('Échec de la suppression : ' + ipcError(e))
      return
    }
    patchCol(dbId, colId, col => ({ ...col, dead: col.dead + 1 }))
    await fetchCollection(dbId, colId)
    flash('Document supprimé')
  }

  // ---- Index mutations ----------------------------------------------------------

  async function createIndex(dbId, colId, field, type) {
    const c = colById(dbId, colId)
    if (!c) return
    try {
      await window.pocketDesk.createIndex(dbId, c.name, field, type)
    } catch (e) {
      flash('Échec de création de l\'index : ' + ipcError(e))
      return
    }
    await fetchCollection(dbId, colId)
    flash('Index « ' + field + ' » créé')
  }

  async function dropIndex(dbId, colId, field) {
    const c = colById(dbId, colId)
    if (!c) return
    try {
      await window.pocketDesk.dropIndex(dbId, c.name, field)
    } catch (e) {
      flash('Échec de suppression de l\'index : ' + ipcError(e))
      return
    }
    await fetchCollection(dbId, colId)
    flash('Index « ' + field + ' » supprimé')
  }

  // ---- Query state ------------------------------------------------------------

  function setQuery(colId, patch) {
    queries.value = {
      ...queries.value,
      [colId]: { ...(queries.value[colId] || { draft: '', committed: '' }), ...patch }
    }
  }

  function bumpRun(colId) {
    runTokens.value = { ...runTokens.value, [colId]: (runTokens.value[colId] || 0) + 1 }
  }

  // ---- Modal helpers ----------------------------------------------------------

  function openModal(config) { modal.value = config }
  function closeModal() { modal.value = null }

  // ---- Tips -------------------------------------------------------------------

  function nextTip() { tipIndex.value = (tipIndex.value + 1) % TIPS.length }

  return {
    // prefs
    themeMode, density, accent, platform, setPref,
    // state
    databases, tabs, activeId, activeTab, activeDb, modal, queries, runTokens, toast, tipIndex,
    // helpers
    dbById, colById, flash,
    // tabs
    openDbTab, openCollectionTab, closeTab, reorderTabs, closeDbTabs,
    // db
    toggleExpand, openDatabase, closeDatabase, compactDatabase, renameDatabase, duplicateDatabase,
    // collections
    addCollection, deleteCollection, fetchCollection, findDocuments,
    // documents
    insertDocument, updateDocument, deleteDocument,
    // indexes
    createIndex, dropIndex,
    // queries
    setQuery, bumpRun,
    // modal
    openModal, closeModal,
    // tips
    nextTip
  }
})
