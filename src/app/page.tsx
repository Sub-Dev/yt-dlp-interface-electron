"use client";
import React, { useState } from "react";
import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import PageDownloads from "./components/PageDownloads";
import PageHistory from "./components/PageHistory";
import PageConfig from "./components/PageConfig";

export default function MainLayout() {
  const [activeSection, setActiveSection] = useState<"downloads" | "history" | "config">(
    "downloads"
  );
  const drawerWidth = 240;

  const handleDownloadComplete = () => {
    setActiveSection("history");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "var(--background)", // Use sua variável de fundo
            color: "var(--foreground)",
          },
        }}
      >
        <Toolbar />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setActiveSection("downloads")}>
              <ListItemText primary="Downloads" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setActiveSection("history")}>
              <ListItemText primary="Histórico" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => setActiveSection("config")}>
              <ListItemText primary="Configurações" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {activeSection === "downloads" && <PageDownloads onDownloadComplete={handleDownloadComplete} />}
        {activeSection === "history" && <PageHistory />}
        {activeSection === "config" && <PageConfig />}
      </Box>
    </Box>
  );
}
