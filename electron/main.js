import { app, BrowserWindow, ipcMain, safeStorage, shell } from 'electron';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
let mainWindow;
app.setName('Galaxy AI');
if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
const secretsFile = () => path.join(app.getPath('userData'), 'secure-secrets.json');
async function readSecrets() { try { return JSON.parse(await readFile(secretsFile(), 'utf8')); } catch { return {}; } }
ipcMain.handle('secure:get', async (_event, key) => { const value = (await readSecrets())[key]; return value && safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(Buffer.from(value, 'base64')) : null; });
ipcMain.handle('secure:set', async (_event, key, value) => { if (!safeStorage.isEncryptionAvailable()) throw new Error('OS encryption is not available.'); const data = await readSecrets(); data[key] = safeStorage.encryptString(value).toString('base64'); await mkdir(path.dirname(secretsFile()), { recursive: true }); await writeFile(secretsFile(), JSON.stringify(data), { mode: 0o600 }); return true; });
ipcMain.handle('secure:remove', async (_event, key) => { const data = await readSecrets(); delete data[key]; await writeFile(secretsFile(), JSON.stringify(data), { mode: 0o600 }); return true; });
ipcMain.handle('http:get', async (_event, url, headers = {}) => { const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) }); return { body: await response.text(), status: response.status, headers: Object.fromEntries(response.headers) }; });
ipcMain.handle('open:external', async (_event, url) => { const parsed = new URL(url); if (parsed.protocol === 'https:' || parsed.protocol === 'http:') await shell.openExternal(url); });
function createWindow() {
  mainWindow = new BrowserWindow({ width: 1100, height: 760, minWidth: 900, minHeight: 650, title: 'Galaxy AI', autoHideMenuBar: true, webPreferences: { preload: path.join(here, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  if (app.isPackaged) mainWindow.loadFile(path.join(here, '..', 'dist', 'index.html')); else mainWindow.loadURL('http://127.0.0.1:5173');
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { void shell.openExternal(url); return { action: 'deny' }; });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
