export interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<{
    videoFormats: { format_id: string; resolution: string; ext: string; acodec: string | null }[];
    audioFormats: { format_id: string; ext: string; abr: string }[];
    subtitles: { lang: string; url: string }[];
  }>;
  downloadVideo: (params: { url: string; options?: { format?: string } }) => Promise<string>;
  openExternalLink: (url: string) => Promise<void>;
  chooseDownloadDirectory: () => Promise<string | null>;
  onDownloadProgress: (callback: (progress: number) => void) => void;
  removeDownloadProgressListener: (callback: (progress: number) => void) => void;
  onUpdateStatus: (callback: (status: string) => void) => void;
}

// Declaração global para o objeto window
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
