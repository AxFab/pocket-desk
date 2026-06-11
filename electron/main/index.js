import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import PocketDbBridge from './pocket-db-bridge.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const bridge = new PocketDbBridge()
const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    backgroundColor: '#121a22',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => bridge.closeAll())

function registerIpcHandlers() {
  ipcMain.handle('system:platform', () => process.platform)

  // Window controls (Windows/Linux title bar)
  ipcMain.handle('window:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })
  ipcMain.handle('window:maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win) return
    win.isMaximized() ? win.unmaximize() : win.maximize()
  })
  ipcMain.handle('window:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })

  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Ouvrir une base pocket-db',
      filters: [{ name: 'Bases pocket-db', extensions: ['pdb'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('db:open',            (_, a) => bridge.openDb(a.id, a.path))
  ipcMain.handle('db:close',           (_, a) => bridge.closeDb(a.id))
  ipcMain.handle('db:compact',         (_, a) => bridge.compact(a.id))
  ipcMain.handle('db:listCollections', (_, a) => bridge.listCollections(a.id))
  ipcMain.handle('db:lockStatus',      (_, a) => bridge.lockStatus(a.id))
  ipcMain.handle('db:duplicateFile',   (_, a) => bridge.duplicateFile(a.srcPath, a.destPath))

  ipcMain.handle('collection:create',    (_, a) => bridge.createCollection(a.dbId, a.name))
  ipcMain.handle('collection:drop',      (_, a) => bridge.dropCollection(a.dbId, a.name))
  ipcMain.handle('collection:find',      (_, a) => bridge.find(a.dbId, a.name, a.query))
  ipcMain.handle('collection:insertOne', (_, a) => bridge.insertOne(a.dbId, a.name, a.doc))
  ipcMain.handle('collection:replaceOne',(_, a) => bridge.replaceOne(a.dbId, a.name, a.doc))
  ipcMain.handle('collection:deleteOne', (_, a) => bridge.deleteOne(a.dbId, a.name, a.id))
  ipcMain.handle('collection:createIndex',(_, a) => bridge.createIndex(a.dbId, a.name, a.field, a.type))
  ipcMain.handle('collection:dropIndex', (_, a) => bridge.dropIndex(a.dbId, a.name, a.field))
  ipcMain.handle('collection:stats',     (_, a) => bridge.collectionStats(a.dbId, a.name))
}
