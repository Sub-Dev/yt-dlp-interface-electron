// /src/types/types.ts

export interface DownloadItem {
  title: string;
  thumbnail: string;
  filePath: string;
  date: string;
  mediaType?: "video" | "audio";
  progress?: number;
}

export interface VideoFormat {
  format_id: string;
  resolution: string;
  ext: string;
  acodec: string | null;
}

export interface AudioFormat {
  format_id: string;
  ext: string;
  abr: string;
}
