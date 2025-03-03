import { contextBridge, ipcRenderer } from "electron";

console.log("preload.js carregado");

contextBridge.exposeInMainWorld("electronAPI", {
  getVideoInfo: (url: string) => ipcRenderer.invoke("get-video-info", url),
  downloadVideo: (options: any) => ipcRenderer.invoke("download-video", options),
  openExternalLink: (url: string) => ipcRenderer.invoke("open-external-link", url),
});
