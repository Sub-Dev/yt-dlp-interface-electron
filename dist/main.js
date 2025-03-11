"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const updateYtDlp_1 = require("./updateYtDlp");
// Caminho para o yt-dlp.exe
const ytDlpPath = path_1.default.resolve(__dirname, "bin", "yt-dlp.exe");
console.log(`Caminho para o yt-dlp.exe: ${ytDlpPath}`);
if (!fs_1.default.existsSync(ytDlpPath)) {
    console.error("Erro: yt-dlp.exe não encontrado no diretório bin!");
    process.exit(1);
}
let mainWindow = null;
// Configuração: caminho do arquivo de config na pasta de dados do usuário.
const configPath = path_1.default.join(electron_1.app.getPath("userData"), "config.json");
// Funções para ler e salvar configuração
function readConfig() {
    if (fs_1.default.existsSync(configPath)) {
        try {
            const data = fs_1.default.readFileSync(configPath, { encoding: "utf-8" });
            return JSON.parse(data);
        }
        catch (err) {
            console.error("Erro ao ler config.json:", err);
            return {};
        }
    }
    return {};
}
function saveConfig(newConfig) {
    const config = Object.assign(Object.assign({}, readConfig()), newConfig);
    try {
        fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    catch (err) {
        console.error("Erro ao salvar config.json:", err);
    }
    return config;
}
// Diretório de download configurável; por padrão, utiliza a pasta Downloads do usuário
let downloadDir = path_1.default.join(process.env.USERPROFILE || "", "Downloads");
const config = readConfig();
if (config.downloadDir) {
    downloadDir = config.downloadDir;
}
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
    mainWindow.webContents.on("did-finish-load", () => {
        if (mainWindow) {
            (0, updateYtDlp_1.checkAndUpdateYtDlp)(mainWindow);
        }
    });
    // Define o menu da aplicação, incluindo a opção de escolher diretório de download
    const menuTemplate = [
        {
            label: "Configurações",
            submenu: [
                {
                    label: "Escolher Diretório de Download",
                    click: async () => {
                        if (!mainWindow)
                            return;
                        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
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
                { role: "quit" }
            ]
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(menuTemplate);
    electron_1.Menu.setApplicationMenu(menu);
});
// ... Resto do seu código (handlers de get-video-info, download-video, etc.)
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
                resolve({
                    videoFormats,
                    audioFormats,
                    subtitles,
                    title: videoData.title,
                    thumbnail: videoData.thumbnail
                });
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
        const formatsToTry = [format, "bestvideo"];
        const tryDownload = (index) => {
            if (index >= formatsToTry.length) {
                reject("Erro: Não foi possível baixar o vídeo.");
                return;
            }
            const outputPath = path_1.default.join(downloadDir, "%(title)s.%(ext)s");
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
            processDownload.stdout.on("data", (data) => {
                const message = data.toString();
                console.log(message);
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
                    exec(`"${ytDlpPath}" -j "${url}"`, { cwd: path_1.default.dirname(ytDlpPath) }, (error, stdout, stderr) => {
                        if (error) {
                            console.error("Erro ao obter metadados:", error);
                            reject("Download concluído, mas não foi possível obter metadados.");
                            return;
                        }
                        try {
                            const videoData = JSON.parse(stdout);
                            const title = videoData.title || "video";
                            const ext = videoData.ext || "mp4"; // Garante extensão correta
                            const filePath = path_1.default.join(downloadDir, `${title}.${ext}`).replace(/\\/g, "/");
                            const downloadInfo = { filePath, title, thumbnail: videoData.thumbnail || "" };
                            // Envia para o frontend o caminho final do arquivo
                            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send("download-complete", downloadInfo);
                            resolve(JSON.stringify(downloadInfo));
                        }
                        catch (err) {
                            console.error("Erro ao processar metadados:", err);
                            reject("Download concluído, mas erro ao processar metadados.");
                        }
                    });
                }
                else {
                    console.error(`Erro ao tentar o formato ${formatsToTry[index]}. Código: ${code}`);
                    tryDownload(index + 1);
                }
            });
        };
        tryDownload(0);
    });
});
electron_1.ipcMain.handle("open-external-link", async (_, url) => {
    return electron_1.shell.openExternal(url);
});
electron_1.ipcMain.handle("open-downloads-folder", () => {
    electron_1.shell.openPath(downloadDir);
});
electron_1.ipcMain.handle("get-download-directory", async () => {
    return downloadDir; // Retorna o diretório de download configurado
});
electron_1.ipcMain.handle("choose-download-directory", async (event) => {
    const result = await electron_1.dialog.showOpenDialog({
        properties: ["openDirectory"],
    });
    if (result.canceled) {
        return null; // Retorna null se o usuário cancelar
    }
    else {
        return result.filePaths[0]; // Retorna o caminho do diretório escolhido
    }
});
