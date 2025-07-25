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

import { CategoriasService } from '../../../../services/categorias/categorias.service';

@Component({
  selector: 'app-categoria-confirm-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categoria-confirm-dialog.component.html',
  styleUrl: './categoria-confirm-dialog.component.css'
})
export class CategoriaConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<CategoriaConfirmDialogComponent>);
  private categoriaId: number;

  constructor(private categoriasService: CategoriasService) {
    const data = inject(MAT_DIALOG_DATA) as {categoriaId: number};
    this.categoriaId = data.categoriaId;
  }

  deleteCategoria() {
    this.categoriasService.deleteCategoria(this.categoriaId).subscribe({
      next: () => {
        console.log(`Categoria ${this.categoriaId} eliminada`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al eliminar categoria:', error);
        this.dialogRef.close(false);
      }
    });
  }
}
