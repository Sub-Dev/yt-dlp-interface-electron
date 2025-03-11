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
import LoadingModal from "../../app/components/LoadingModal"; // Ajuste o caminho conforme sua estrutura
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
      const dir = await window.electronAPI.getDownloadDirectory(); // Obtém o diretório de download
      setDownloadDir(dir); // Armazena o diretório de download
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


  const handleCheckInfo = async () => {
    if (!url.trim()) {
      setOutput("Erro: Por favor, insira uma URL válida.");
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
      setOutput(`Erro ao obter informações do vídeo: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!selectedVideo) {
      setOutput("Erro: Selecione uma qualidade de vídeo antes de baixar.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Obtendo informações do vídeo...");

    try {
      const result = await window.electronAPI.getVideoInfo(url);
      const downloadItem = {
        title: result.title || "Baixando...",
        filePath: `${downloadDir}/${result.title || "video"}.mp4`, // Definido temporariamente
        thumbnail: result.thumbnail || null,
        date: new Date().toLocaleString(),
        mediaType: "video",
        progress: 0
      };

      const history = JSON.parse(localStorage.getItem("downloadHistory") || "[]");
      localStorage.setItem("downloadHistory", JSON.stringify([downloadItem, ...history]));

      setLoading(false);
      onDownloadComplete();

      // Inicia o download em segundo plano
      window.electronAPI.downloadVideo({ url, options: { format: selectedVideo } });
    } catch (error) {
      console.error("Erro no download do vídeo:", error);
      setOutput("Erro no download do vídeo");
      setLoading(false);
    }
  };


  const handleDownloadAudio = async () => {
    setLoading(true);
    setLoadingMessage("Obtendo informações do áudio...");
    try {
      // Usar as informações que já temos do vídeo
      const result = await window.electronAPI.getVideoInfo(url);
      const downloadItem = {
        title: result.title || "Baixando áudio...",
        filePath: `${downloadDir}/${result.title || "audio"}.mp3`, // Usa o diretório de download
        thumbnail: result.thumbnail || null, // Usar null em vez de string vazia
        date: new Date().toLocaleString(),
        mediaType: 'audio',
        progress: 0
      };

      // Adiciona ao histórico e muda para a tela de histórico
      const history = JSON.parse(localStorage.getItem('downloadHistory') || '[]');
      localStorage.setItem('downloadHistory', JSON.stringify([downloadItem, ...history]));
      setLoading(false);
      onDownloadComplete();

      // Inicia o download em segundo plano
      window.electronAPI.downloadVideo({
        url,
        options: { format: "bestaudio" }
      });
    } catch (error) {
      console.error("Erro no download do áudio:", error);
      setOutput("Erro no download do áudio");
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
