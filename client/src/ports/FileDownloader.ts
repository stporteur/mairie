export interface FileDownloader {
  download(file: Blob, filename: string): void;
}
