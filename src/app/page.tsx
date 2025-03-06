"use client"
import { useState, ChangeEvent } from "react";
import LoadingModal from "../app/components/LoadingModal";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoFormats, setVideoFormats] = useState<{
    format_id: string;
    resolution: string;
    ext: string;
    acodec: string | null;
  }[]>([]);
  const [audioFormats, setAudioFormats] = useState<{ format_id: string; ext: string; abr: string }[]>([]);
  const [subtitles, setSubtitles] = useState<{ lang: string; url: string }[]>([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckInfo = async () => {
    setIsLoading(true);

    try {
      const result = await window.electronAPI.getVideoInfo(url);
      setVideoFormats(result.videoFormats);
      setAudioFormats(result.audioFormats);
      setSubtitles(result.subtitles);
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
      setOutput("Erro: Selecione um formato de vídeo antes de baixar.");
      return;
    }

    setOutput("Baixando...");
    try {
      const result = await window.electronAPI.downloadVideo({ url, format: selectedVideo });
      setOutput(result);
    } catch (error) {
      setOutput("Erro no download");
    }
  };

  const handleDownloadAudio = async () => {
    setOutput("Baixando áudio...");
    try {
      const result = await window.electronAPI.downloadVideo({ url, format: "bestaudio" });
      setOutput(result);
    } catch (error) {
      setOutput("Erro no download do áudio");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <img src="/logo-yt-dlp.png" alt="Logo" style={{ maxWidth: "200px", marginBottom: "20px" }} />
      <h1>yt-dlp Downloader</h1>
      <div style={{ width: "80%", textAlign: "center" }}>
        <input
          type="text"
          placeholder="Enter video URL"
          value={url}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", color: "black" }}
          required
        />
        <button onClick={handleCheckInfo} style={{ padding: "10px 20px", fontSize: "16px", marginBottom: "20px" }}>
          Verificar
        </button>

        <LoadingModal isOpen={isLoading} />

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
      </div>

      <pre style={{ background: "#f4f4f4", padding: "10px", marginTop: "20px", color: "black", width: "80%" }}>
        {output}
      </pre>
      <footer style={{ marginTop: "40px", fontSize: "12px", color: "#888", textAlign: "center" }}>
        <p>
          Este software é apenas uma interface gráfica para o <strong>yt-dlp</strong>.
          Todos os direitos do <strong>yt-dlp</strong> pertencem aos seus desenvolvedores.
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
