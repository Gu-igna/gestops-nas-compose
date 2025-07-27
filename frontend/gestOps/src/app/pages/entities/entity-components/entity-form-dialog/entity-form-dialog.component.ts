import { ChangeDetectionStrategy, Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { EntitiesService } from '../../../../services/entities/entities.service';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-entity-form-dialog',
  imports: [MatDialogModule, MatButtonModule, MatButtonToggleModule, MatIcon, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entity-form-dialog.component.html',
  styleUrl: './entity-form-dialog.component.css'
})
export class EntityFormDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EntityFormDialogComponent>);
  mode: 'create' | 'update';
  
  cuitExistsError = false;

  entityForm = signal(
    new FormGroup({
      id: new FormControl(0, { nonNullable: true }),
      cuit: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{11}$/)] }),
      razon_social: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    })
  );

  cdr = inject(ChangeDetectorRef);
  constructor(
    private entitiesService: EntitiesService
  ) {
    const data = inject(MAT_DIALOG_DATA) as { mode: 'create' | 'update', entity?: Entity };
    this.mode = data.mode;
    if (this.mode === 'update' && data.entity) {
      const { id, cuit, razon_social } = data.entity;
      this.entityForm.update(form => {
        form.patchValue({
          id,
          cuit,
          razon_social
        });
        return form;
      });
    }
  }
  
  save() {
    if (this.entityForm().valid) {
      const entityData = this.entityForm().getRawValue();
      if (this.mode === 'create') {
        const { id, ...rest } = entityData;
        this.entitiesService.createEntity(rest).subscribe({
          next: (NewEntity: NewEntity) => {
            this.cuitExistsError = false;
            this.cdr.detectChanges();
            this.dialogRef.close({
              mode: this.mode,
              newEntity: NewEntity
            });
          },
          error: (error) => {
            console.error('Creation failed:', error);
            if (error && (error.status === 409 || (error.message && error.message.includes('409')))) {
              this.cuitExistsError = true;
              this.cdr.detectChanges();
            } else {
              this.cuitExistsError = false;
              this.cdr.detectChanges();
              console.error('Unexpected error:', error);
            }
          }
        });
      } else {
        const { ...updateData } = entityData;
        this.entitiesService.updateEntity(updateData.id, updateData).subscribe({
          next: (entity: Entity) => {
            this.dialogRef.close({
              mode: this.mode,
              entity: entity
            });
          },
          error: (error) => {
            console.error('Update failed:', error);
          }
        });
      }
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}


export interface Entity {
  id: number;
  cuit: string;
  razon_social: string;
}

export interface NewEntity {
  cuit: string;
  razon_social: string;
}