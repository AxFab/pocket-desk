/**
 * pocket-db-bridge.js
 *
 * IPC bridge for @axfab/pocket-db.
 * Requires the real @axfab/pocket-db package — no in-memory stub.
 */

import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let PocketDb = null
let loadError = null
try {
  PocketDb = require('@axfab/pocket-db')
  console.log('[pocket-db-bridge] @axfab/pocket-db loaded')
} catch (ex) {
  loadError = ex
  console.error('[pocket-db-bridge] @axfab/pocket-db not found', ex)
}

function approxSize(doc) { return JSON.stringify(doc).length + 8 }

export default class PocketDbBridge {
  constructor() {
    /** Map<id, { db: Database, path: string }> */
    this._dbs = new Map()
  }

  _get(id) {
    const entry = this._dbs.get(id)
    if (!entry) throw new Error(`db id=${id} not open`)
    return entry
  }

  _col(dbId, name) {
    return this._get(dbId).db.collection(name)
  }

  _stats(db, name) {
    const col = db.collection(name)
    const docCount = col.countDocuments()
    const indexes = [
      { field: '_id', type: 'primary' },
      ...col.getIndexes().map(ix => ({ field: ix.name, type: ix.type }))
    ]
    return { name, docCount, indexCount: indexes.length, indexes }
  }

  async openDb(id, path) {
    if (!PocketDb) {
      throw new Error(
        "Le module @axfab/pocket-db est introuvable. Installez-le avec « npm install @axfab/pocket-db »." +
        (loadError ? ` (${loadError.message})` : '')
      )
    }
    const db = PocketDb.open({ path })
    this._dbs.set(id, { db, path })
    return { ok: true, collections: await this.listCollections(id) }
  }

  async closeDb(id) {
    const { db } = this._get(id)
    db.close()
    this._dbs.delete(id)
    return { ok: true }
  }

  async compact(id) {
    this._get(id).db.compact()
    return { ok: true }
  }

  async listCollections(id) {
    const { db } = this._get(id)
    return db.getCollections().map(name => this._stats(db, name))
  }

  /**
   * Reads the real state of the `<path>.lock` file created by pocket-db.
   * Returns { exists, pid, alive, own }.
   */
  async lockStatus(id) {
    const { path } = this._get(id)
    const lockPath = path + '.lock'
    try {
      const raw = fs.readFileSync(lockPath, 'utf8')
      const pid = parseInt(raw.trim(), 10) || null
      let alive = false
      if (pid) {
        try { process.kill(pid, 0); alive = true } catch { alive = false }
      }
      return { exists: true, pid, alive, own: pid === process.pid }
    } catch {
      return { exists: false, pid: null, alive: false, own: false }
    }
  }

  /** Copies the .pdb file on disk (used by « Dupliquer »). */
  async duplicateFile(srcPath, destPath) {
    await fs.promises.copyFile(srcPath, destPath, fs.constants.COPYFILE_EXCL)
    return { ok: true, path: destPath }
  }

  async createCollection(dbId, name) {
    const { db } = this._get(dbId)
    db.collection(name) // registers the collection
    return this._stats(db, name)
  }

  async dropCollection(dbId, name) {
    return this._col(dbId, name).drop()
  }

  async find(dbId, name, query) {
    const col = this._col(dbId, name)
    const t0 = performance.now()
    const docs = col.find(query || {}).toArray()
    const ms = +(performance.now() - t0).toFixed(1)
    return { docs, ms }
  }

  async insertOne(dbId, name, doc)  { return this._col(dbId, name).insertOne(doc) }
  async replaceOne(dbId, name, doc) { return this._col(dbId, name).replaceOne(doc) }
  async deleteOne(dbId, name, id)   { return this._col(dbId, name).deleteOne(id) }
  async createIndex(dbId, name, field, type) { return this._col(dbId, name).createIndex(field, { type }) }
  async dropIndex(dbId, name, field)         { return this._col(dbId, name).dropIndex(field) }

  async collectionStats(dbId, name) {
    const { db } = this._get(dbId)
    return this._stats(db, name)
  }

  closeAll() {
    for (const { db } of this._dbs.values()) {
      try { db.close() } catch {}
    }
    this._dbs.clear()
  }
}
