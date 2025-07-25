import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';

export interface FechaConfirmDialogData {
  message: string;
  showCancelButton?: boolean;
}

@Component({
  selector: 'app-fecha-confirm-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogTitle, MatDialogContent],
  templateUrl: './fecha-confirm-dialog.component.html',
  styleUrl: './fecha-confirm-dialog.component.css'
})
export class FechaConfirmDialogComponent {
  private dialogRef = inject(MatDialogRef<FechaConfirmDialogComponent>);
  public data: FechaConfirmDialogData = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}