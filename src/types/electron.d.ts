export interface ElectronAPI {
  downloadVideo: (data: { url: string; options?: { format?: string } }) => Promise<string>;
}

// Declaração global para o objeto window
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
