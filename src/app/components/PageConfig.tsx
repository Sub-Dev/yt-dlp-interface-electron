"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Button, IconButton, Switch, FormControlLabel } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

export default function PageConfig() {
  const [downloadDir, setDownloadDir] = useState<string>("");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  useEffect(() => {
    const fetchDefaultDownloadDir = async () => {
      const defaultDownloadDir = await window.electronAPI.getDownloadDirectory();
      setDownloadDir(defaultDownloadDir);
    };

    fetchDefaultDownloadDir();

    const updateDirectory = (dir: string) => {
      setDownloadDir(dir);
    };

    window.electronAPI.onDirectoryUpdate(updateDirectory);


    const savedNotifications = localStorage.getItem("notificationsEnabled");
    if (savedNotifications !== null) {
      setNotificationsEnabled(savedNotifications === "true");
    }

    return () => {
      window.electronAPI.removeDirectoryUpdateListener(updateDirectory);
    };
  }, []);

  const handleChooseDirectory = async () => {
    const chosen = await window.electronAPI.chooseDownloadDirectory();
    if (chosen) {
      setDownloadDir(chosen);
    }
  };

  const handleToggleNotifications = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setNotificationsEnabled(newValue);
    localStorage.setItem("notificationsEnabled", newValue.toString());
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

      <FormControlLabel
        control={<Switch checked={notificationsEnabled} onChange={handleToggleNotifications} />}
        label="Ativar notificações"
      />
    </Box>
  );
}
