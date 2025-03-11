// /src/components/pages/PageConfig.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";

export default function PageConfig() {
  const [downloadDir, setDownloadDir] = useState<string>("");

  useEffect(() => {
    window.electronAPI.onDirectoryUpdate((dir: string) => {
      setDownloadDir(dir);
    });
  }, []);

  const handleChooseDirectory = async () => {
    const chosen = await window.electronAPI.chooseDownloadDirectory();
    if (chosen) {
      setDownloadDir(chosen);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Configurações
      </Typography>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Diretório de Download Atual: {downloadDir || "Não definido"}
      </Typography>
      <Button variant="contained" onClick={handleChooseDirectory}>
        Alterar Diretório de Download
      </Button>
    </Box>
  );
}
