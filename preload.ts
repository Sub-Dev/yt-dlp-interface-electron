import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  downloadVideo: (data: { url: string; options?: { format?: string } }) =>
    ipcRenderer.invoke("yt-dlp:download", data),
});
