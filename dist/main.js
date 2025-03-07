"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ytDlpPath = path_1.default.resolve(__dirname, "bin", "yt-dlp.exe");
console.log(`Caminho para o yt-dlp.exe: ${ytDlpPath}`);
if (!fs_1.default.existsSync(ytDlpPath)) {
    console.error("Erro: yt-dlp.exe não encontrado no diretório bin!");
    process.exit(1);
}
let mainWindow = null;
electron_1.app.whenReady().then(() => {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        icon: path_1.default.join(__dirname, "assets", "logo-yt-dlp.png"),
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.loadURL("http://localhost:3000");
});
electron_1.ipcMain.handle("get-video-info", async (_, url) => {
    console.log(`Recebido URL: ${url}`);
    return new Promise((resolve, reject) => {
        console.log(`Obtendo informações do vídeo: ${url}`);
        (0, child_process_1.exec)(`"${ytDlpPath}" -j "${url}"`, { cwd: path_1.default.dirname(ytDlpPath) }, (error, stdout, stderr) => {
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
                    .filter((format) => format.vcodec !== "none")
                    .map((format) => ({
                    format_id: format.format_id,
                    resolution: format.height ? `${format.height}p` : "Desconhecido",
                    ext: format.ext,
                    acodec: format.acodec,
                }));
                const audioFormats = videoData.formats
                    .filter((format) => format.acodec !== "none")
                    .map((format) => ({
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
            }
            catch (err) {
                console.error("Erro ao processar os dados do vídeo:", err);
                reject("Erro ao processar os dados do vídeo");
            }
        });
    });
});
electron_1.ipcMain.handle("download-video", async (_, { url, format }) => {
    return new Promise((resolve, reject) => {
        console.log(`Iniciando download do vídeo: ${url}, formato: ${format}`);
        const { spawn, exec } = require("child_process");
        // Tenta o formato selecionado e, se falhar, tenta "bestvideo"
        const formatsToTry = [format, "bestvideo"];
        const tryDownload = (index) => {
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
            processDownload.stdout.on("data", (data) => {
                const message = data.toString();
                console.log(message);
                // Extração simples do progresso (ajuste conforme a saída do yt-dlp)
                const progressMatch = message.match(/(\d+\.\d+)%/);
                if (progressMatch) {
                    const progress = parseFloat(progressMatch[1]);
                    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send("download-progress", progress);
                }
            });
            processDownload.stderr.on("data", (data) => {
                console.error(`Erro (stderr): ${data.toString()}`);
            });
            processDownload.on("close", (code) => {
                if (code === 0) {
                    console.log("Download concluído com sucesso!");
                    // Após o download, executa o comando para obter os metadados
                    exec(`"${ytDlpPath}" -j "${url}"`, { cwd: path_1.default.dirname(ytDlpPath) }, (error, stdout, stderr) => {
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
                            const filePath = path_1.default.join("Downloads", `${title}.${ext}`);
                            resolve(JSON.stringify({ filePath, title, thumbnail }));
                        }
                        catch (err) {
                            console.error("Erro ao processar metadados:", err);
                            reject("Download concluído, mas erro ao processar metadados.");
                        }
                    });
                }
                else {
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
electron_1.ipcMain.handle("open-external-link", async (_, url) => {
    return electron_1.shell.openExternal(url);
});
