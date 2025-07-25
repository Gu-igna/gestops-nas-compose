import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { 
  ConceptosService,
  Concepto,
  NewConcepto
} from '../../../../services/conceptos/conceptos.service';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-concepto-form-dialog',
  imports: [MatDialogModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './concepto-form-dialog.component.html',
  styleUrl: './concepto-form-dialog.component.css'
})
export class ConceptoFormDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConceptoFormDialogComponent>);
  mode: 'create' | 'update';

  conceptoForm = signal(
    new FormGroup({
      id: new FormControl(0, { nonNullable: true }),
      nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    })
  );

  constructor(
    private conceptosService: ConceptosService,
  ) {
    const data = inject(MAT_DIALOG_DATA) as { mode: 'create' | 'update', concepto?: Concepto };
    this.mode = data.mode;
    if (this.mode === 'update' && data.concepto) {
      const { id, nombre } = data.concepto;
      this.conceptoForm.update(form => {
        form.patchValue({
          id,
          nombre
        });
        return form;
      });
    }
  }

    save() {
      if (this.conceptoForm().valid) {
        const conceptoData = this.conceptoForm().getRawValue();
        if (this.mode === 'create') {
          const { id, ...rest } = conceptoData;
          this.conceptosService.createConcepto(rest).subscribe({
            next: (NewConcepto: NewConcepto) => {
  
              this.dialogRef.close({
                mode: this.mode,
                NewConcepto: NewConcepto
              });
            },
            error: (error: unknown) => {
              console.error('Creation failed:', error);
            }
          });
        } else {
          const { ...updateData } = conceptoData;
          this.conceptosService.updateConcepto(updateData.id, updateData).subscribe({
            next: (concepto: Concepto) => {
              this.dialogRef.close({
                mode: this.mode,
                concepto: concepto
              });
            },
            error: (error: unknown) => {
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