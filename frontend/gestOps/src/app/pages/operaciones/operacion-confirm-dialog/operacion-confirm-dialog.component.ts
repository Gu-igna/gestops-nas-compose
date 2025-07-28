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
  public tipo: 'operacion' | 'archivo';
  public id: number;
  public path?: string;
  private dialogData: { tipo: 'operacion' | 'archivo', id: number, path?: string };

  constructor(private operacionesService: OperacionesService) {
    this.dialogData = inject(MAT_DIALOG_DATA) as { tipo: 'operacion' | 'archivo', id: number, path?: string };
    this.tipo = this.dialogData.tipo;
    this.id = this.dialogData.id;
    this.path = this.dialogData.path;
  }

  deleteOperacion() {
    if (this.tipo === 'operacion') {
      this.operacionesService.deleteOperacion(this.id).subscribe({
        next: () => {
          console.log(`Operación ${this.id} eliminada`);
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al eliminar operación:', error);
          this.dialogRef.close(false);
        }
      });
    } else if (this.tipo === 'archivo') {
      const path = this.path;
      if (!path) {
        console.error('No se proporcionó la clave del archivo.');
        this.dialogRef.close(false);
        return;
      }
      this.operacionesService.deleteArchivo(this.id, path).subscribe({
        next: () => {
          console.log(`Archivo ${this.id} con clave ${path} eliminado`);
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al eliminar archivo:', error);
          this.dialogRef.close(false);
        }
      });
    }
  }
}