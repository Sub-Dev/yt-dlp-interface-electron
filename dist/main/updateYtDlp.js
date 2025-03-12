"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndUpdateYtDlp = checkAndUpdateYtDlp;
const node_fetch_1 = __importDefault(require("node-fetch")); // Certifique-se de ter instalado o node-fetch (ou use o global fetch se disponível)
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Caminho para o yt-dlp.exe (ajuste conforme a estrutura do seu projeto)
const ytDlpPath = path_1.default.resolve(__dirname, "bin", "yt-dlp.exe");
/**
 * Verifica se há uma nova versão do yt-dlp e, se houver, baixa e atualiza o binário.
 * Envia mensagens de status via IPC para o renderer (por exemplo, para mostrar um status na UI).
 *
 * @param mainWindow A instância principal do BrowserWindow
 */
async function checkAndUpdateYtDlp(mainWindow) {
    // Notifica o usuário que a verificação está em andamento
    mainWindow.webContents.send("update-status", "Verificando atualizações do yt-dlp...");
    try {
        // Consulta a API de releases do GitHub para o yt-dlp
        const response = await (0, node_fetch_1.default)("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest");
        if (!response.ok) {
            mainWindow.webContents.send("update-status", "Erro ao consultar atualizações.");
            console.error("Erro ao consultar GitHub:", response.statusText);
            return;
        }
        const latestRelease = await response.json();
        const latestVersion = latestRelease.tag_name; // Ex: "2023.08.03"
        // Obtém a versão atual do yt-dlp
        (0, child_process_1.exec)(`"${ytDlpPath}" --version`, (error, stdout, stderr) => {
            if (error) {
                mainWindow.webContents.send("update-status", "Erro ao obter a versão atual do yt-dlp.");
                console.error("Erro ao obter versão atual:", error);
                return;
            }
            const currentVersion = stdout.trim();
            if (currentVersion !== latestVersion) {
                mainWindow.webContents.send("update-status", `Atualização disponível: ${currentVersion} → ${latestVersion}. Atualizando...`);
                // Procura o asset que contenha o yt-dlp.exe
                const asset = latestRelease.assets.find((a) => a.name.includes("yt-dlp.exe"));
                if (asset) {
                    downloadFile(asset.browser_download_url, ytDlpPath)
                        .then(() => {
                        mainWindow.webContents.send("update-status", "yt-dlp atualizado com sucesso!");
                        console.log("yt-dlp atualizado com sucesso!");
                        // Opcional: reinicie a aplicação ou notifique o usuário para reiniciar
                    })
                        .catch((err) => {
                        mainWindow.webContents.send("update-status", "Erro ao atualizar yt-dlp.");
                        console.error("Erro ao atualizar yt-dlp:", err);
                    });
                }
                else {
                    mainWindow.webContents.send("update-status", "Asset para yt-dlp.exe não encontrado.");
                    console.error("Asset para yt-dlp.exe não encontrado no release.");
                }
            }
            else {
                mainWindow.webContents.send("update-status", "yt-dlp já está atualizado.");
                console.log("yt-dlp já está atualizado.");
            }
        });
    }
    catch (err) {
        mainWindow.webContents.send("update-status", "Erro na verificação de atualização.");
        console.error("Erro na verificação de atualização:", err);
    }
}
/**
 * Baixa um arquivo a partir de uma URL e o salva no destino especificado.
 *
 * @param url URL do arquivo a ser baixado
 * @param dest Caminho de destino para salvar o arquivo
 */
async function downloadFile(url, dest) {
    const res = await (0, node_fetch_1.default)(url);
    if (!res.ok) {
        throw new Error(`Falha ao baixar arquivo: ${res.statusText}`);
    }
    const fileStream = fs_1.default.createWriteStream(dest);
    return new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
    });
}
