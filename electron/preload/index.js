import { contextBridge, ipcRenderer } from 'electron'

/**
 * Exposes a typed API to the renderer (window.pocketDesk).
 * The renderer never touches the filesystem or Node APIs directly.
 */
contextBridge.exposeInMainWorld('pocketDesk', {
  // System
  platform: () => ipcRenderer.invoke('system:platform'),

  // Window controls
  winMinimize: () => ipcRenderer.invoke('window:minimize'),
  winMaximize: () => ipcRenderer.invoke('window:maximize'),
  winClose: () => ipcRenderer.invoke('window:close'),

  // File dialog
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),

  // Database lifecycle
  openDb: (id, path) => ipcRenderer.invoke('db:open', { id, path }),
  closeDb: (id) => ipcRenderer.invoke('db:close', { id }),
  compact: (id) => ipcRenderer.invoke('db:compact', { id }),
  listCollections: (id) => ipcRenderer.invoke('db:listCollections', { id }),
  lockStatus: (id) => ipcRenderer.invoke('db:lockStatus', { id }),
  duplicateFile: (srcPath, destPath) => ipcRenderer.invoke('db:duplicateFile', { srcPath, destPath }),

  // Collection CRUD
  createCollection: (dbId, name) => ipcRenderer.invoke('collection:create', { dbId, name }),
  dropCollection: (dbId, name) => ipcRenderer.invoke('collection:drop', { dbId, name }),
  find: (dbId, name, query) => ipcRenderer.invoke('collection:find', { dbId, name, query }),
  insertOne: (dbId, name, doc) => ipcRenderer.invoke('collection:insertOne', { dbId, name, doc }),
  replaceOne: (dbId, name, doc) => ipcRenderer.invoke('collection:replaceOne', { dbId, name, doc }),
  deleteOne: (dbId, name, id) => ipcRenderer.invoke('collection:deleteOne', { dbId, name, id }),

  // Index management
  createIndex: (dbId, name, field, type) => ipcRenderer.invoke('collection:createIndex', { dbId, name, field, type }),
  dropIndex: (dbId, name, field) => ipcRenderer.invoke('collection:dropIndex', { dbId, name, field }),
  collectionStats: (dbId, name) => ipcRenderer.invoke('collection:stats', { dbId, name })
})
