import { contextBridge, ipcRenderer } from "electron";

console.log("preload.js carregado");  // Verifique se isso aparece no console do Electron

contextBridge.exposeInMainWorld("electronAPI", {
  getVideoInfo: (url) => ipcRenderer.invoke("get-video-info", url),
  downloadVideo: (options) => ipcRenderer.invoke("download-video", options),
});
