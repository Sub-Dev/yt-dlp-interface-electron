"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  CircularProgress
} from "@mui/material";
import LoadingModal from "../../app/components/LoadingModal";
import { VideoFormat, AudioFormat } from "../../types/types";
import { SelectChangeEvent } from "@mui/material";

interface PageDownloadsProps {
  onDownloadComplete: () => void;
}

export default function PageDownloads({ onDownloadComplete }: PageDownloadsProps) {
  const [url, setUrl] = useState("");
  const [videoFormats, setVideoFormats] = useState<VideoFormat[]>([]);
  const [audioFormats, setAudioFormats] = useState<AudioFormat[]>([]);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [subtitles, setSubtitles] = useState<{ lang: string; url: string }[]>([]);
  const [infoLoaded, setInfoLoaded] = useState(false);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [downloadDir, setDownloadDir] = useState("");


  useEffect(() => {
    const fetchDownloadDir = async () => {
      const dir = await window.electronAPI.getDownloadDirectory();
      setDownloadDir(dir);
    };

    fetchDownloadDir();
  }, []);

  useEffect(() => {
    window.electronAPI.onUpdateStatus((status: string) => {
      setLoadingMessage(status);
      setLoading(true);
      setTimeout(() => setLoading(false), 5000);
    });
  }, []);

  const isValidUrl = (str: string) => {
    try {
      const newUrl = new URL(str);
      return newUrl.protocol === "http:" || newUrl.protocol === "https:";
    } catch (e) {
      return false;
    }
  };


  const handleCheckInfo = async () => {
    if (!url.trim()) {
      setOutput("Erro: O campo de URL está vazio. Digite uma URL válida.");
      return;
    }

    if (!isValidUrl(url)) {
      setOutput("Erro: A URL inserida não é válida. Certifique-se de que o link está correto.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Verificando vídeo...");
    setOutput("");
    setInfoLoaded(false);

    try {
      const result = await window.electronAPI.getVideoInfo(url);
      setVideoFormats(result.videoFormats);
      setAudioFormats(result.audioFormats);
      setSubtitles(result.subtitles);
      setInfoLoaded(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("403") || errorMessage.includes("404")) {
        setOutput("Erro: O vídeo pode estar indisponível ou a URL fornecida está incorreta.");
      } else if (errorMessage.includes("ECONNREFUSED")) {
        setOutput("Erro: Falha na conexão com o servidor. Verifique sua internet e tente novamente.");
      } else {
        setOutput(`Erro ao obter informações do vídeo: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!selectedVideo) {
      setOutput("Erro: Escolha uma qualidade de vídeo antes de baixar.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Preparando download...");

    try {
      const result = await window.electronAPI.getVideoInfo(url);
      if (!result) throw new Error("Nenhuma informação do vídeo foi recebida.");

      const downloadItem = {
        title: result.title || "Baixando...",
        filePath: `${downloadDir}/${result.title || "video"}.mp4`,
        thumbnail: result.thumbnail || null,
        date: new Date().toLocaleString(),
        mediaType: "video",
        progress: 0
      };

      const history = JSON.parse(localStorage.getItem("downloadHistory") || "[]");
      localStorage.setItem("downloadHistory", JSON.stringify([downloadItem, ...history]));

      setLoading(false);
      onDownloadComplete();

      window.electronAPI.downloadVideo({ url, options: { format: selectedVideo } })
        .catch((error: unknown) => {
          console.error("Erro ao iniciar o download:", error);
          setOutput("Erro: Não foi possível iniciar o download. Verifique a URL ou tente novamente mais tarde.");
        });

    } catch (error: unknown) {
      console.error("Erro no download do vídeo:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("403") || errorMessage.includes("404")) {
        setOutput("Erro: Vídeo não disponível ou URL inválida.");
      } else if (errorMessage.includes("ECONNREFUSED")) {
        setOutput("Erro: Falha na conexão com o servidor.");
      } else {
        setOutput(`Erro ao tentar baixar o vídeo: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };


  const handleDownloadAudio = async () => {
    if (!url || typeof url !== "string") {
      console.error("URL inválida");
      setOutput("Erro: URL inválida");
      return;
    }

    setLoading(true);
    setLoadingMessage("Obtendo informações do áudio...");

    try {
      const result = await window.electronAPI.getVideoInfo(url);

      if (!result || typeof result !== "object") {
        throw new Error("Resposta inválida ao obter informações do vídeo.");
      }

      const title = result.title || "Baixando áudio...";
      const filePath = `${downloadDir}/${result.title || "audio"}.mp3`;
      const thumbnail = result.thumbnail || null;

      const downloadItem = {
        title,
        filePath,
        thumbnail,
        date: new Date().toLocaleString(),
        mediaType: "audio",
        progress: 0,
      };

      try {
        const history = JSON.parse(localStorage.getItem("downloadHistory") || "[]");
        if (!Array.isArray(history)) throw new Error("Histórico corrompido");
        localStorage.setItem("downloadHistory", JSON.stringify([downloadItem, ...history]));
      } catch (historyError) {
        console.warn("Erro ao acessar o histórico de downloads, resetando...", historyError);
        localStorage.setItem("downloadHistory", JSON.stringify([downloadItem]));
      }

      setLoading(false);
      onDownloadComplete();

      window.electronAPI
        .downloadAudio(url)
        .then((downloadInfo) => {
          console.log("Áudio baixado com sucesso:", downloadInfo);
        })
        .catch((error) => {
          console.error("Erro ao baixar áudio:", error);
          setOutput("Erro no download do áudio");
        });

    } catch (error: any) {
      console.error("Erro no processo de download:", error);
      setOutput(`Erro: ${error.message || "Falha desconhecida ao baixar o áudio"}`);
      setLoading(false);
    }
  };


  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 2,
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
        minHeight: "100vh",
      }}
    >
      <img src="/logo-yt-dlp.png" alt="Logo" style={{ maxWidth: "200px", marginBottom: "20px" }} />
      <Typography variant="h4" gutterBottom>
        yt-dlp Downloader
      </Typography>
      <Box sx={{ width: "100%", maxWidth: 600, textAlign: "center" }}>
        <TextField
          label="Digite a URL do vídeo"
          variant="outlined"
          fullWidth
          value={url}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          sx={{
            marginBottom: 2,
            backgroundColor: "var(--background)",
            input: { color: "var(--foreground)" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "var(--foreground)" },
              "&:hover fieldset": { borderColor: "var(--foreground)" },
              "&.Mui-focused fieldset": { borderColor: "var(--primary-color)" },
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleCheckInfo}
          fullWidth
          sx={{
            marginBottom: 2,
            backgroundColor: "var(--primary-color)",
            color: "var(--foreground)",
            "&:hover": { backgroundColor: "var(--primary-color)" },
          }}
        >
          Verificar
        </Button>

        <LoadingModal isOpen={loading} message={loadingMessage} />

        {infoLoaded && (
          <>
            {videoFormats.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Qualidade do Vídeo
                </Typography>
                <Select
                  value={selectedVideo}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setSelectedVideo(e.target.value)
                  }
                  fullWidth
                  sx={{ marginBottom: 2 }}
                >
                  <MenuItem value="">Selecione a qualidade do vídeo</MenuItem>
                  {videoFormats.map((format) => (
                    <MenuItem key={format.format_id} value={format.format_id}>
                      {format.resolution} - {format.ext}
                    </MenuItem>
                  ))}
                </Select>
              </>
            )}

            <Button
              variant="contained"
              onClick={handleDownloadVideo}
              fullWidth
              sx={{
                marginTop: 2,
                backgroundColor: "var(--primary-color)",
                color: "var(--foreground)",
                "&:hover": { backgroundColor: "var(--primary-color)" },
              }}
            >
              Baixar Vídeo
            </Button>
            <Button
              variant="contained"
              onClick={handleDownloadAudio}
              fullWidth
              sx={{
                marginTop: 2,
                backgroundColor: "var(--secondary-color)",
                color: "var(--foreground)",
                "&:hover": { backgroundColor: "var(--secondary-color)" },
              }}
            >
              Baixar Áudio
            </Button>
          </>
        )}
      </Box>

      <Box
        sx={{
          backgroundColor: "var(--info-box-bg)",
          p: 2,
          mt: 2,
          width: "100%",
          maxWidth: 600,
          color: "var(--foreground)",
        }}
      >
        <Typography variant="body1">{output}</Typography>
      </Box>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2">
          Este software é apenas uma interface gráfica para o{" "}
          <strong>yt-dlp</strong>. Todos os direitos do{" "}
          <strong>yt-dlp</strong> pertencem aos seus desenvolvedores.{" "}
          <Button
            variant="text"
            onClick={() =>
              window.electronAPI.openExternalLink("https://github.com/yt-dlp/yt-dlp")
            }
            sx={{ padding: 0, color: "var(--foreground)" }}
          >
            Repositório oficial
          </Button>
        </Typography>
      </Box>
    </Box>
  );
}
