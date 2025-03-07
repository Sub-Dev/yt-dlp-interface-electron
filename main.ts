import { app, BrowserWindow, ipcMain, shell } from "electron";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const ytDlpPath = path.resolve(__dirname, "bin", "yt-dlp.exe");

console.log(`Caminho para o yt-dlp.exe: ${ytDlpPath}`);

if (!fs.existsSync(ytDlpPath)) {
  console.error("Erro: yt-dlp.exe não encontrado no diretório bin!");
  process.exit(1);
}

let mainWindow: BrowserWindow | null = null;

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

    const { spawn, exec } = require("child_process");
    // Tenta o formato selecionado e, se falhar, tenta "bestvideo"
    const formatsToTry = [format, "bestvideo"];

    const tryDownload = (index: number) => {
      if (index >= formatsToTry.length) {
        reject("Erro: Não foi possível baixar o vídeo.");
        return;
      }

      const args = [
        "-f",
        `${formatsToTry[index]}+bestaudio`,
        "--add-header",
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        url,
        "-o",
        "%USERPROFILE%/Downloads/%(title)s.%(ext)s"
      ];

      console.log(`Tentando o formato: ${formatsToTry[index]}`);
      // Usamos spawn sem a opção shell para evitar problemas com espaços e acentos
      const processDownload = spawn(ytDlpPath, args);

      processDownload.stdout.on("data", (data: Buffer) => {
        const message = data.toString();
        console.log(message);
        // Extração simples do progresso (ajuste conforme a saída do yt-dlp)
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
          // Após o download, executa o comando para obter os metadados
          exec(`"${ytDlpPath}" -j "${url}"`, { cwd: path.dirname(ytDlpPath) }, (error, stdout, stderr) => {
            if (error) {
              console.error("Erro ao obter metadados:", error);
              reject("Download concluído, mas não foi possível obter metadados.");
              return;
            }
            try {
              const videoData = JSON.parse(stdout);
              const title = videoData.title || "video";
              const thumbnail = videoData.thumbnail || "";
              // Define a extensão com base no metadado ou usa "mp4" por padrão
              const ext = videoData.ext || "mp4";
              // Monta o caminho do arquivo conforme o padrão de saída definido
              const filePath = path.join( "Downloads", `${title}.${ext}`);
              resolve(JSON.stringify({ filePath, title, thumbnail }));
            } catch (err) {
              console.error("Erro ao processar metadados:", err);
              reject("Download concluído, mas erro ao processar metadados.");
            }
          });
        } else {
          console.error(`Erro ao tentar o formato ${formatsToTry[index]}. Código: ${code}`);
          // Tenta o próximo formato
          tryDownload(index + 1);
        }
      });
    };

    // Inicia o teste dos formatos
    tryDownload(0);
  });
});

ipcMain.handle("open-external-link", async (_, url: string) => {
  return shell.openExternal(url);
});
