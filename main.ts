/// <reference types="electron" />
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';  // Importando fileURLToPath
import { dirname } from 'path';  


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, 
      nodeIntegration: false,
    },
  });

  const devURL = 'http://localhost:3000';
  mainWindow.loadURL(devURL);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Manipulação do ipcMain para download com yt-dlp
ipcMain.handle('yt-dlp:download', async (_event: IpcMainInvokeEvent, { url, options }: { url: string; options?: any }) => {
  return new Promise((resolve, reject) => {
    if (!url) return reject('URL is required');

    const args = [url];
    if (options && options.format) {
      args.push('-f', options.format);
    }

    const ytDlp = spawn('yt-dlp', args);
    let output = '';

    ytDlp.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    ytDlp.stderr.on('data', (data: Buffer) => {
      console.error(`yt-dlp error: ${data}`);
    });

    ytDlp.on('close', (code: number) => {
      if (code === 0) resolve(output);
      else reject(`yt-dlp exited with code ${code}`);
    });
  });
});
