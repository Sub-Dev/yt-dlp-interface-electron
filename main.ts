import { app, BrowserWindow, ipcMain } from "electron";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

// __dirname já está disponível em CommonJS, não precisamos de import.meta.url

// Caminho para o binário do yt-dlp dentro da pasta bin
const ytDlpPath = path.resolve(__dirname, "bin", "yt-dlp.exe");

console.log(`Caminho para o yt-dlp.exe: ${ytDlpPath}`);

// Verifica se o yt-dlp existe antes de tentar rodar os comandos
if (!fs.existsSync(ytDlpPath)) {
  console.error("Erro: yt-dlp.exe não encontrado no diretório bin!");
  process.exit(1);
}

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL("http://localhost:3000"); 
});

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
        resolve({ videoFormats, audioFormats, subtitles });
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

    exec(
      `"${ytDlpPath}" -f "${format}" "${url}" -o "%USERPROFILE%/Downloads/%(title)s.%(ext)s"`,
      (error, stdout, stderr) => {
        if (error) {
          console.error("Erro no download do vídeo:", stderr);
          reject("Erro no download do vídeo");
          return;
        }
        console.log("Download concluído com sucesso!");
        resolve("Download concluído!");
      }
    );
  });
});
