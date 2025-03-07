"use client";
import { useState, useEffect, ChangeEvent } from "react";
import LoadingModal from "../app/components/LoadingModal";

type DownloadItem = {
  title: string;
  thumbnail: string;
  filePath: string;
  date: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoFormats, setVideoFormats] = useState<{
    format_id: string;
    resolution: string;
    ext: string;
    acodec: string | null;
  }[]>([]);
  const [audioFormats, setAudioFormats] = useState<
    { format_id: string; ext: string; abr: string }[]
  >([]);
  const [subtitles, setSubtitles] = useState<{ lang: string; url: string }[]>([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);

  // Função para adicionar um item ao histórico e salvá-lo no localStorage
  const addDownloadHistory = (item: DownloadItem) => {
    setDownloadHistory((prev) => {
      const newHistory = [item, ...prev];
      localStorage.setItem("downloadHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Carrega o histórico de downloads ao montar o componente
  useEffect(() => {
    const storedHistory = localStorage.getItem("downloadHistory");
    if (storedHistory) {
      setDownloadHistory(JSON.parse(storedHistory));
    }
  }, []);

  const handleCheckInfo = async () => {
    setIsLoading(true);
    setOutput("");
    setInfoLoaded(false);
    try {
      const result = await window.electronAPI.getVideoInfo(url);
      setVideoFormats(result.videoFormats);
      setAudioFormats(result.audioFormats);
      setSubtitles(result.subtitles);
      setInfoLoaded(true);
    } catch (error: unknown) {
      console.error("Erro ao obter informações:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutput(`Erro ao obter informações do vídeo: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!selectedVideo) {
      setOutput("Erro: Selecione uma qualidade de vídeo antes de baixar.");
      return;
    }
    setOutput("Baixando vídeo...");
    try {
      // Supondo que o seu método downloadVideo retorne um JSON com informações do download
      // como: { filePath, title, thumbnail }
      const result = await window.electronAPI.downloadVideo({ url, format: selectedVideo });
      const { filePath, title, thumbnail } = JSON.parse(result);
      setOutput("Download concluído!");
      addDownloadHistory({
        title,
        thumbnail,
        filePath,
        date: new Date().toLocaleString(),
      });
    } catch (error) {
      setOutput("Erro no download do vídeo");
    }
  };

  const handleDownloadAudio = async () => {
    setOutput("Baixando áudio...");
    try {
      const result = await window.electronAPI.downloadVideo({ url, format: "bestaudio" });
      const { filePath, title, thumbnail } = JSON.parse(result);
      setOutput("Download concluído!");
      addDownloadHistory({
        title,
        thumbnail,
        filePath,
        date: new Date().toLocaleString(),
      });
    } catch (error) {
      setOutput("Erro no download do áudio");
    }
  };

  // Exemplo de listener de progresso (supondo que sua API envie essa atualização)
  useEffect(() => {
    const progressListener = (progress: number) => {
      setDownloadProgress(progress);
    };

    window.electronAPI.onDownloadProgress(progressListener);

    return () => {
      window.electronAPI.removeDownloadProgressListener(progressListener);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <img src="/logo-yt-dlp.png" alt="Logo" style={{ maxWidth: "200px", marginBottom: "20px" }} />
      <h1>yt-dlp Downloader</h1>
      <div style={{ width: "80%", textAlign: "center" }}>
        <input
          type="text"
          placeholder="Digite a URL do vídeo"
          value={url}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", color: "black" }}
          required
        />
        <button onClick={handleCheckInfo} style={{ padding: "10px 20px", fontSize: "16px", marginBottom: "20px" }}>
          Verificar
        </button>

        <LoadingModal isOpen={isLoading} />

        {/* Exibe os controles de download apenas se as informações foram carregadas */}
        {infoLoaded && (
          <>
            {videoFormats.length > 0 && (
              <>
                <h3>Qualidade do Vídeo</h3>
                <select
                  value={selectedVideo}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedVideo(e.target.value)}
                  style={{ width: "100%", padding: "10px", marginBottom: "10px", color: "black" }}
                >
                  <option value="">Selecione a qualidade do vídeo</option>
                  {videoFormats.map((format) => (
                    <option key={format.format_id} value={format.format_id}>
                      {format.resolution} - {format.ext}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button onClick={handleDownloadVideo} style={{ padding: "10px 20px", fontSize: "16px", marginTop: "10px" }}>
              Baixar Vídeo
            </button>

            <button onClick={handleDownloadAudio} style={{ padding: "10px 20px", fontSize: "16px", marginTop: "10px" }}>
              Baixar Áudio
            </button>
          </>
        )}

        {/* Exibe barra de progresso se houver */}
        {downloadProgress > 0 && (
          <div style={{ marginTop: "20px" }}>
            <p>Progresso do Download: {downloadProgress}%</p>
            <progress value={downloadProgress} max="100" style={{ width: "100%" }} />
          </div>
        )}
      </div>

      <pre style={{ background: "#f4f4f4", padding: "10px", marginTop: "20px", color: "black", width: "80%" }}>
        {output}
      </pre>

      {/* Seção de Histórico de Downloads */}
      <div style={{ width: "80%", marginTop: "20px" }}>
        <h2>Histórico de Downloads</h2>
        {downloadHistory.length === 0 ? (
          <p>Nenhum download realizado.</p>
        ) : (
          downloadHistory.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "10px",
                border: "1px solid #ddd",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              <img src={item.thumbnail} alt={item.title} style={{ width: "120px", height: "auto", marginRight: "10px" }} />
              <div>
                <p><strong>{item.title}</strong></p>
                <p>Local: {item.filePath}</p>
                <p>Data: {item.date}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <footer style={{ marginTop: "40px", fontSize: "12px", color: "#888", textAlign: "center" }}>
        <p>
          Este software é apenas uma interface gráfica para o <strong>yt-dlp</strong>. Todos os direitos do <strong>yt-dlp</strong> pertencem aos seus desenvolvedores.
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              window.electronAPI.openExternalLink("https://github.com/yt-dlp/yt-dlp");
            }}
            style={{ color: "#888", cursor: "pointer", textDecoration: "underline", marginLeft: "5px" }}
          >
            Repositório oficial
          </a>
        </p>
      </footer>
    </div>
  );
}
