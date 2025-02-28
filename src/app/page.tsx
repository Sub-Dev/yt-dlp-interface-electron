"use client";

import { useState, FormEvent, ChangeEvent } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoFormats, setVideoFormats] = useState<{ format_id: string; resolution: string; ext: string }[]>([]);
  const [audioFormats, setAudioFormats] = useState<{ format_id: string; ext: string; abr: string }[]>([]);
  const [subtitles, setSubtitles] = useState<{ lang: string; url: string }[]>([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedAudio, setSelectedAudio] = useState("");
  const [selectedSubtitle, setSelectedSubtitle] = useState("");
  const [output, setOutput] = useState("");

  const handleCheckInfo = async () => {
    try {
      console.log(window.electronAPI);
      const result = await window.electronAPI.getVideoInfo(url);
      setVideoFormats(result.videoFormats);
      setAudioFormats(result.audioFormats);
      setSubtitles(result.subtitles);
    } catch (error: any) {
      console.error("Erro ao obter informações:", error);
      setOutput(`Erro ao obter informações do vídeo: ${error.message || error}`);
    }
  };

  const handleDownload = async () => {
    setOutput("Baixando...");
    try {
      const format = selectedVideo || selectedAudio;
      const result = await window.electronAPI.downloadVideo({ url, options: { format } });
      setOutput(result);
    } catch (error) {
      setOutput("Erro no download");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
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

        {videoFormats.length > 0 && (
          <>
            <h3>Qualidade do Vídeo</h3>
            <select
              value={selectedVideo}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedVideo(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", color: "black" }}
            >
              <option value="">Nenhum (apenas áudio)</option>
              {videoFormats.map((format) => (
                <option key={format.format_id} value={format.format_id}>
                  {format.resolution} - {format.ext}
                </option>
              ))}
            </select>
          </>
        )}

        {audioFormats.length > 0 && (
          <>
            <h3>Faixa de Áudio</h3>
            <select
              value={selectedAudio}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedAudio(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", color: "black" }}
            >
              <option value="">Nenhum</option>
              {audioFormats.map((format) => (
                <option key={format.format_id} value={format.format_id}>
                  {format.abr} - {format.ext}
                </option>
              ))}
            </select>
          </>
        )}

        {subtitles.length > 0 && (
          <>
            <h3>Legendas</h3>
            <select
              value={selectedSubtitle}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSubtitle(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "10px", color: "black" }}
            >
              <option value="">Nenhuma</option>
              {subtitles.map((subtitle) => (
                <option key={subtitle.lang} value={subtitle.lang}>
                  {subtitle.lang}
                </option>
              ))}
            </select>
          </>
        )}

        <button onClick={handleDownload} style={{ padding: "10px 20px", fontSize: "16px", marginTop: "10px" }}>
          Baixar
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
