import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
    downloadVideo: (data) => ipcRenderer.invoke("yt-dlp:download", data),
});
