// /src/components/pages/PageHistory.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { DownloadItem } from "../../types/types";

export default function PageHistory() {
  const [downloadHistory, setDownloadHistory] = useState<DownloadItem[]>([]);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMediaType, setFilterMediaType] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("downloadHistory");
    if (stored) {
      setDownloadHistory(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const progressListener = (progress: number, filePath?: string) => {
      const history = JSON.parse(localStorage.getItem("downloadHistory") || "[]");

      if (history.length > 0) {
        history[0].progress = progress;

        // Se o progresso atingir 100% e o filePath for fornecido, atualiza o caminho do arquivo
        if (progress >= 100 && filePath) {
          history[0].filePath = filePath;
          localStorage.setItem("lastDownloadInfo", JSON.stringify({ filePath })); // Atualiza a última info
        }

        localStorage.setItem("downloadHistory", JSON.stringify(history));
        setDownloadHistory([...history]); // Força o re-render para refletir a mudança
      }
    };

    window.electronAPI.onDownloadProgress(progressListener);
    return () => {
      window.electronAPI.removeDownloadProgressListener(progressListener);
    };
  }, []);


  const filteredHistory = downloadHistory.filter((item) => {
    const matchName = item.title.toLowerCase().includes(filterName.toLowerCase());
    const matchDate = filterDate ? item.date.includes(filterDate) : true;
    const matchMedia = filterMediaType ? item.mediaType === filterMediaType : true;
    return matchName && matchDate && matchMedia;
  });

  const handleClearHistory = () => {
    localStorage.removeItem("downloadHistory");
    setDownloadHistory([]);
  };

  const handleOpenFolder = () => {
    window.electronAPI.openDownloadsFolder(); // Certifique-se de expor essa função no preload
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" gutterBottom>
          Histórico de Downloads
        </Typography>
        <IconButton onClick={handleOpenFolder} color="primary">
          <FolderOpenIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Filtrar por Nome"
          variant="outlined"
          size="small"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <TextField
          label="Filtrar por Data"
          variant="outlined"
          size="small"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <FormControl size="small" variant="outlined">
          <InputLabel>Tipo de Mídia</InputLabel>
          <Select
            label="Tipo de Mídia"
            value={filterMediaType}
            onChange={(e) => setFilterMediaType(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="video">Vídeo</MenuItem>
            <MenuItem value="audio">Áudio</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleClearHistory}>
          Limpar Histórico
        </Button>
      </Box>

      {filteredHistory.length === 0 ? (
        <Typography>Nenhum download realizado.</Typography>
      ) : (
        filteredHistory.map((item, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 2,
              border: "1px solid #ddd",
              p: 2,
              borderRadius: 2,
              position: "relative",
            }}
          >
            {item.thumbnail ? (
              <img
                src={item.thumbnail}
                alt={item.title}
                style={{ width: "120px", height: "auto", marginRight: "10px" }}
              />
            ) : (
              <Box
                sx={{
                  width: "120px",
                  height: "67px", // proporção 16:9
                  backgroundColor: "grey.300",
                  marginRight: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Typography variant="caption">Sem thumbnail</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="h6">{item.title}</Typography>
              <Typography variant="body2">
                Local: {(item.progress ?? 0) < 100 ? "Baixando..." : item.filePath}
              </Typography>
              <Typography variant="body2">Data: {item.date}</Typography>
              {item.progress !== undefined && item.progress < 100 && (
                <Typography variant="body2" color="primary">
                  Progresso: {item.progress.toFixed(1)}%
                </Typography>
              )}
            </Box>
            {/* Se o item ainda estiver em progresso, exiba um CircularProgress */}
            {item.progress !== undefined && item.progress < 100 && (
              <Box sx={{ position: "absolute", right: 16, display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2">{item.progress.toFixed(1)}%</Typography>
                <CircularProgress variant="determinate" value={item.progress} size={40} />
              </Box>
            )}
          </Box>
        ))
      )}
    </Box>
  );
}
