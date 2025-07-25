import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { ConceptosService } from '../../../../services/conceptos/conceptos.service';

@Component({
  selector: 'app-concepto-confirm-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concepto-confirm-dialog.component.html',
  styleUrl: './concepto-confirm-dialog.component.css'
})
export class ConceptoConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConceptoConfirmDialogComponent>);
  private conceptoId: number;

  constructor(private conceptosService: ConceptosService) {
    const data = inject(MAT_DIALOG_DATA) as {conceptoId: number};
    this.conceptoId = data.conceptoId;
  }

  deleteConcepto() {
    this.conceptosService.deleteConcepto(this.conceptoId).subscribe({
      next: () => {
        console.log(`Concepto ${this.conceptoId} eliminado`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al eliminar concepto:', error);
        this.dialogRef.close(false);
      }
    });
  }
}
