import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface FileViewerData {
  fileUrl: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'document';
}

@Component({
  selector: 'app-file-viewer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './file-viewer-dialog.component.html',
  styleUrl: './file-viewer-dialog.component.css'
})
export class FileViewerDialogComponent {
  safeUrl: SafeResourceUrl;

  constructor(
    public dialogRef: MatDialogRef<FileViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileViewerData,
    private sanitizer: DomSanitizer
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.fileUrl);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onDownload(): void {
    const link = document.createElement('a');
    link.href = this.data.fileUrl;
    link.download = this.data.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openInNewTab(): void {
    window.open(this.data.fileUrl, '_blank');
  }
}
