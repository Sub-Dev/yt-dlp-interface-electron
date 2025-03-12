export interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<{
    videoFormats: {
      format_id: string;
      resolution: string;
      ext: string;
      acodec: string | null;
    }[];
    audioFormats: {
      format_id: string;
      ext: string;
      abr: string;
    }[];
    subtitles: {
      lang: string;
      url: string;
    }[];
    title: string;
    thumbnail: string;
  }>;
  downloadVideo: (options: any) => Promise<string>;
  openExternalLink: (url: string) => Promise<void>;
  chooseDownloadDirectory: () => Promise<string>;
  onDownloadProgress: (callback: (progress: number) => void) => void;
  removeDownloadProgressListener: (callback: (progress: number) => void) => void;
  onUpdateStatus: (callback: (status: string) => void) => void;
  onDirectoryUpdate: (callback: (dir: string) => void) => void;
  openDownloadsFolder: () => Promise<void>;
  removeDirectoryUpdateListener: (callback: (dir: string) => void) => void;
  getDownloadDirectory: () => Promise<string>; 
}

// Declaração global para o objeto window
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
