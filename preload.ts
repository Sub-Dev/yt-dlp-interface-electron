import { contextBridge, ipcRenderer } from "electron";

console.log("preload.js carregado");

contextBridge.exposeInMainWorld("electronAPI", {
  getVideoInfo: (url: string) => ipcRenderer.invoke("get-video-info", url),
  downloadVideo: (options: any) => ipcRenderer.invoke("download-video", options),
  openExternalLink: (url: string) => ipcRenderer.invoke("open-external-link", url),
  onDownloadProgress: (callback: (progress: number) => void) => 
    ipcRenderer.on("download-progress", (_, progress) => callback(progress)),
  removeDownloadProgressListener: (callback: (progress: number) => void) => 
    ipcRenderer.removeListener("download-progress", (_, progress) => callback(progress))
});
