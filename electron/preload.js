import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('galaxy', {
  secure: {
    get: (key) => ipcRenderer.invoke('secure:get', key),
    set: (key, value) => ipcRenderer.invoke('secure:set', key, value),
    remove: (key) => ipcRenderer.invoke('secure:remove', key)
  },
  httpGet: (url, headers) => ipcRenderer.invoke('http:get', url, headers),
  openExternal: (url) => ipcRenderer.invoke('open:external', url)
});
