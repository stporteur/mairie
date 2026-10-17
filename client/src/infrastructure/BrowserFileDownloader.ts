import type { FileDownloader } from '@/ports/FileDownloader';

export class BrowserFileDownloader implements FileDownloader {
  download(file: Blob, filename: string): void {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
