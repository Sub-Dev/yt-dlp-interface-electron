"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
console.log("preload.js carregado");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    getVideoInfo: (url) => electron_1.ipcRenderer.invoke("get-video-info", url),
    downloadVideo: (options) => electron_1.ipcRenderer.invoke("download-video", options),
    openExternalLink: (url) => electron_1.ipcRenderer.invoke("open-external-link", url),
    onDownloadProgress: (callback) => electron_1.ipcRenderer.on("download-progress", (_, progress) => callback(progress)),
    removeDownloadProgressListener: (callback) => electron_1.ipcRenderer.removeListener("download-progress", (_, progress) => callback(progress))
});
