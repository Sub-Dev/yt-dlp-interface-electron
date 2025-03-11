import { app, BrowserWindow, ipcMain, shell, dialog, Menu, MenuItemConstructorOptions } from "electron";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { checkAndUpdateYtDlp } from "./updateYtDlp";

// Caminho para o yt-dlp.exe
const ytDlpPath = path.resolve(__dirname, "bin", "yt-dlp.exe");
console.log(`Caminho para o yt-dlp.exe: ${ytDlpPath}`);

if (!fs.existsSync(ytDlpPath)) {
  console.error("Erro: yt-dlp.exe não encontrado no diretório bin!");
  process.exit(1);
}

let mainWindow: BrowserWindow | null = null;

// Configuração: caminho do arquivo de config na pasta de dados do usuário.
const configPath = path.join(app.getPath("userData"), "config.json");

// Funções para ler e salvar configuração
function readConfig(): Record<string, any> {
  if (fs.existsSync(configPath)) {
    try {
      const data = fs.readFileSync(configPath, { encoding: "utf-8" });
      return JSON.parse(data);
    } catch (err) {
      console.error("Erro ao ler config.json:", err);
      return {};
    }
  }
  return {};
}

function saveConfig(newConfig: Record<string, any>): Record<string, any> {
  const config = { ...readConfig(), ...newConfig };
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error("Erro ao salvar config.json:", err);
  }
  return config;
}

// Diretório de download configurável; por padrão, utiliza a pasta Downloads do usuário
let downloadDir: string = path.join(process.env.USERPROFILE || "", "Downloads");
const config = readConfig();
if (config.downloadDir) {
  downloadDir = config.downloadDir;
}

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, "assets", "logo-yt-dlp.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow) {
      checkAndUpdateYtDlp(mainWindow);
    }
  });

  // Define o menu da aplicação, incluindo a opção de escolher diretório de download
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: "Configurações",
      submenu: [
        {
          label: "Escolher Diretório de Download",
          click: async () => {
            if (!mainWindow) return;
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ["openDirectory"],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              downloadDir = result.filePaths[0];
              saveConfig({ downloadDir });
              mainWindow.webContents.send("download-directory-updated", downloadDir);
            }
          },
        },
      ],
    },
    {
      label: "Arquivo",
      submenu: [
        { role: "quit" as const }
      ]
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
});

// ... Resto do seu código (handlers de get-video-info, download-video, etc.)
ipcMain.handle("get-video-info", async (_, url: string) => {
  console.log(`Recebido URL: ${url}`);
  return new Promise((resolve, reject) => {
    console.log(`Obtendo informações do vídeo: ${url}`);

    exec(`"${ytDlpPath}" -j "${url}"`, { cwd: path.dirname(ytDlpPath) }, (error, stdout, stderr) => {
      if (error) {
        console.error("Erro ao executar yt-dlp:", error);
        console.error("stderr:", stderr);
        reject("Erro ao obter informações do vídeo");
        return;
      }
      
      console.log("stdout:", stdout);

      try {
        const videoData = JSON.parse(stdout);
        if (!videoData.formats) {
          reject("Nenhum formato disponível para este vídeo.");
          return;
        }

        const videoFormats = videoData.formats
          .filter((format: any) => format.vcodec !== "none")
          .map((format: any) => ({
            format_id: format.format_id,
            resolution: format.height ? `${format.height}p` : "Desconhecido",
            ext: format.ext,
            acodec: format.acodec,
          }));

        const audioFormats = videoData.formats
          .filter((format: any) => format.acodec !== "none")
          .map((format: any) => ({
            format_id: format.format_id,
            ext: format.ext,
            abr: format.abr ? `${format.abr} kbps` : "Desconhecido",
          }));

        const subtitles = videoData.subtitles
          ? Object.keys(videoData.subtitles).map((lang) => ({
              lang,
              url: videoData.subtitles[lang][0].url,
            }))
          : [];

        console.log("Informações do vídeo obtidas com sucesso!");
        resolve({
          videoFormats,
          audioFormats,
          subtitles,
          title: videoData.title,
          thumbnail: videoData.thumbnail
        });
      } catch (err) {
        console.error("Erro ao processar os dados do vídeo:", err);
        reject("Erro ao processar os dados do vídeo");
      }
    });
  });
});

ipcMain.handle("download-video", async (_, { url, format }) => {
  return new Promise((resolve, reject) => {
    console.log(`Iniciando download do vídeo: ${url}, formato: ${format}`);

    const { spawn, exec } = require("child_process");
    const formatsToTry = [format, "bestvideo"];

    const tryDownload = (index: number) => {
      if (index >= formatsToTry.length) {
        reject("Erro: Não foi possível baixar o vídeo.");
        return;
      }

      const outputPath = path.join(downloadDir, "%(title)s.%(ext)s");
      const normalizedOutput = outputPath.replace(/\\/g, "/");

      const args = [
        "-f",
        `${formatsToTry[index]}+bestaudio`,
        "--merge-output-format", "mp4", // Garante saída em mp4 caso precise mesclar
        "--add-header",
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        url,
        "-o",
        normalizedOutput,
      ];

      console.log(`Tentando o formato: ${formatsToTry[index]}`);
      const processDownload = spawn(ytDlpPath, args);

      processDownload.stdout.on("data", (data: Buffer) => {
        const message = data.toString();
        console.log(message);
        const progressMatch = message.match(/(\d+\.\d+)%/);
        if (progressMatch) {
          const progress = parseFloat(progressMatch[1]);
          mainWindow?.webContents.send("download-progress", progress);
        }
      });

      processDownload.stderr.on("data", (data: Buffer) => {
        console.error(`Erro (stderr): ${data.toString()}`);
      });

      processDownload.on("close", (code: number) => {
        if (code === 0) {
          console.log("Download concluído com sucesso!");
          exec(`"${ytDlpPath}" -j "${url}"`, { cwd: path.dirname(ytDlpPath) }, (error, stdout, stderr) => {
            if (error) {
              console.error("Erro ao obter metadados:", error);
              reject("Download concluído, mas não foi possível obter metadados.");
              return;
            }
            try {
              const videoData = JSON.parse(stdout);
              const title = videoData.title || "video";
              const ext = videoData.ext || "mp4"; // Garante extensão correta
              const filePath = path.join(downloadDir, `${title}.${ext}`).replace(/\\/g, "/");

              const downloadInfo = { filePath, title, thumbnail: videoData.thumbnail || "" };
              
              // Envia para o frontend o caminho final do arquivo
              mainWindow?.webContents.send("download-complete", downloadInfo);
              resolve(JSON.stringify(downloadInfo));
            } catch (err) {
              console.error("Erro ao processar metadados:", err);
              reject("Download concluído, mas erro ao processar metadados.");
            }
          });
        } else {
          console.error(`Erro ao tentar o formato ${formatsToTry[index]}. Código: ${code}`);
          tryDownload(index + 1);
        }
      });
    };

    tryDownload(0);
  });
});

ipcMain.handle("open-external-link", async (_, url: string) => {
  return shell.openExternal(url);
});

ipcMain.handle("open-downloads-folder", () => {
  shell.openPath(downloadDir);
});

ipcMain.handle("get-download-directory", async () => {
  return downloadDir; // Retorna o diretório de download configurado
});

ipcMain.handle("choose-download-directory", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled) {
    return null; // Retorna null se o usuário cancelar
  } else {
    return result.filePaths[0]; // Retorna o caminho do diretório escolhido
  }
});
