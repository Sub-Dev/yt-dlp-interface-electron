"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, IconButton } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen"; // Ícone da pasta

export default function PageConfig() {
  const [downloadDir, setDownloadDir] = useState<string>("");

  useEffect(() => {
    const fetchDefaultDownloadDir = async () => {
      const defaultDownloadDir = await window.electronAPI.getDownloadDirectory(); // Aguarda a resolução da promessa
      setDownloadDir(defaultDownloadDir); // Define o diretório de download padrão
    };

    fetchDefaultDownloadDir();

    const updateDirectory = (dir: string) => {
      setDownloadDir(dir); // Atualiza o diretório quando houver uma mudança
    };

    window.electronAPI.onDirectoryUpdate(updateDirectory);

    return () => {
      window.electronAPI.removeDirectoryUpdateListener(updateDirectory); // Remova o listener ao desmontar
    };
  }, []);

  const handleChooseDirectory = async () => {
    const chosen = await window.electronAPI.chooseDownloadDirectory();
    if (chosen) {
      setDownloadDir(chosen);
    }
  };

  return (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, maxWidth: 500, margin: "0 auto" }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
        Configurações
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <FolderOpenIcon sx={{ fontSize: 30, color: "var(--primary-color)" }} />
        <Typography variant="body1" sx={{ flexGrow: 1 }}>
          Diretório de Download Atual: {downloadDir || "Padrão: Downloads do Usuário"}
        </Typography>
      </Box>

      <Button
        variant="contained"
        sx={{
          marginTop: 2,
          backgroundColor: "var(--primary-color)",
          color: "var(--foreground)",
          "&:hover": { backgroundColor: "var(--primary-color)" },
        }}
        onClick={handleChooseDirectory}
      >
        Alterar Diretório de Download
      </Button>
    </Box>
  );
}
