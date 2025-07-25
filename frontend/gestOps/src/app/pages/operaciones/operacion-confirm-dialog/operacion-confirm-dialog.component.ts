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

import { OperacionesService } from '../../../services/operaciones/operaciones.service';

@Component({
  selector: 'app-operacion-confirm-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './operacion-confirm-dialog.component.html',
  styleUrl: './operacion-confirm-dialog.component.css'
})
export class OperacionConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<OperacionConfirmDialogComponent>);

  private operacionId: number;


  constructor(private operacionesService: OperacionesService) {
    const data = inject(MAT_DIALOG_DATA) as { operationId: number };
    this.operacionId = data.operationId;
  }

  deleteOperacion() {
    this.operacionesService.deleteOperacion(this.operacionId).subscribe({
      next: () => {
        console.log(`Operación ${this.operacionId} eliminada`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al eliminar operación:', error);
        this.dialogRef.close(false);
      }
    });
  }
}
