import { BrowserWindow } from "electron";
import fetch from "node-fetch"; // Certifique-se de ter instalado o node-fetch (ou use o global fetch se disponível)
import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Caminho para o yt-dlp.exe (ajuste conforme a estrutura do seu projeto)
const ytDlpPath = path.resolve(__dirname, "bin", "yt-dlp.exe");

/**
 * Verifica se há uma nova versão do yt-dlp e, se houver, baixa e atualiza o binário.
 * Envia mensagens de status via IPC para o renderer (por exemplo, para mostrar um status na UI).
 *
 * @param mainWindow A instância principal do BrowserWindow
 */
export async function checkAndUpdateYtDlp(mainWindow: BrowserWindow): Promise<void> {
  // Notifica o usuário que a verificação está em andamento
  mainWindow.webContents.send("update-status", "Verificando atualizações do yt-dlp...");

  try {
    // Consulta a API de releases do GitHub para o yt-dlp
    const response = await fetch("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest");
    if (!response.ok) {
      mainWindow.webContents.send("update-status", "Erro ao consultar atualizações.");
      console.error("Erro ao consultar GitHub:", response.statusText);
      return;
    }
    const latestRelease = await response.json();
    const latestVersion = latestRelease.tag_name; // Ex: "2023.08.03"

    // Obtém a versão atual do yt-dlp
    exec(`"${ytDlpPath}" --version`, (error, stdout, stderr) => {
      if (error) {
        mainWindow.webContents.send("update-status", "Erro ao obter a versão atual do yt-dlp.");
        console.error("Erro ao obter versão atual:", error);
        return;
      }
      const currentVersion = stdout.trim();
      if (currentVersion !== latestVersion) {
        mainWindow.webContents.send("update-status", `Atualização disponível: ${currentVersion} → ${latestVersion}. Atualizando...`);
        // Procura o asset que contenha o yt-dlp.exe
        const asset = latestRelease.assets.find((a: any) => a.name.includes("yt-dlp.exe"));
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
        } else {
          mainWindow.webContents.send("update-status", "Asset para yt-dlp.exe não encontrado.");
          console.error("Asset para yt-dlp.exe não encontrado no release.");
        }
      } else {
        mainWindow.webContents.send("update-status", "yt-dlp já está atualizado.");
        console.log("yt-dlp já está atualizado.");
      }
    });
  } catch (err) {
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
async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar arquivo: ${res.statusText}`);
  }
  const fileStream = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}
