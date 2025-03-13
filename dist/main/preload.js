"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
console.log("preload.js carregado");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    getVideoInfo: (url) => electron_1.ipcRenderer.invoke("get-video-info", url),
    downloadVideo: (options) => electron_1.ipcRenderer.invoke("download-video", options),
    openExternalLink: (url) => electron_1.ipcRenderer.invoke("open-external-link", url),
    chooseDownloadDirectory: () => electron_1.ipcRenderer.invoke("choose-download-directory"),
    onDownloadProgress: (callback) => electron_1.ipcRenderer.on("download-progress", (_, progress) => callback(progress)),
    removeDownloadProgressListener: (callback) => electron_1.ipcRenderer.removeListener("download-progress", (_, progress) => callback(progress)),
    onUpdateStatus: (callback) => electron_1.ipcRenderer.on("update-status", (_, status) => callback(status)),
    onDirectoryUpdate: (callback) => electron_1.ipcRenderer.on("download-directory-updated", (_, dir) => callback(dir)),
    openDownloadsFolder: () => electron_1.ipcRenderer.invoke("open-downloads-folder"),
    removeDirectoryUpdateListener: (callback) => electron_1.ipcRenderer.removeListener("download-directory-updated", (_, dir) => callback(dir)),
    getDownloadDirectory: () => electron_1.ipcRenderer.invoke("get-download-directory"),
    downloadAudio: (url) => electron_1.ipcRenderer.invoke("download-audio", url),
});
