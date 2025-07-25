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

import { EntitiesService } from '../../../../services/entities/entities.service';

@Component({
  selector: 'app-entity-confirm-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entity-confirm-dialog.component.html',
  styleUrl: './entity-confirm-dialog.component.css'
})
export class EntityConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EntityConfirmDialogComponent>);
  private entityId: number;

    constructor(private entitiesService: EntitiesService) {
      const data = inject(MAT_DIALOG_DATA) as {entityId: number};
      this.entityId = data.entityId;
    }
  
    deleteEntity() {
      this.entitiesService.deleteEntity(this.entityId).subscribe({
        next: () => {
          console.log(`Persona ${this.entityId} eliminado`);
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al eliminar persona:', error);
          this.dialogRef.close(false);
        }
      });
    }
  }
