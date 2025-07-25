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

import { SubcategoriasService } from '../../../../services/subcategorias/subcategorias.service';

@Component({
  selector: 'app-subcategoria-confirm-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subcategoria-confirm-dialog.component.html',
  styleUrl: './subcategoria-confirm-dialog.component.css'
})
export class SubcategoriaConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<SubcategoriaConfirmDialogComponent>);
  private subcategoriaId: number;

  constructor(private subcategoriasService: SubcategoriasService) {
    const data = inject(MAT_DIALOG_DATA) as {subcategoriaId: number};
    this.subcategoriaId = data.subcategoriaId;
  }

  deleteSubcategoria() {
    this.subcategoriasService.deleteSubcategoria(this.subcategoriaId).subscribe({
      next: () => {
        console.log(`Subcategoria ${this.subcategoriaId} eliminada`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al eliminar subcategoria:', error);
        this.dialogRef.close(false);
      }
    });
  }
}
