import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ReactiveFormsModule, FormGroup, FormControl, Validators,
  AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { startWith, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

import {
  CategoriasService,
  Categoria,
  NewCategoria,
  UpdateCategoria
} from '../../../../services/categorias/categorias.service';

import {
  ConceptosService,
  Concepto
} from '../../../../services/conceptos/conceptos.service';

function idConceptoValido(conceptos: Concepto[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const conceptoValido = conceptos.some(concepto => concepto.id === control.value);
    return conceptoValido ? null : { idConceptoInvalido: true };
  };
}

@Component({
  selector: 'app-categoria-form-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './categoria-form-dialog.component.html',
  styleUrl: './categoria-form-dialog.component.css'
})

export class CategoriaFormDialogComponent implements OnInit {

  readonly dialogRef = inject(MatDialogRef<CategoriaFormDialogComponent>);
  mode: 'create' | 'update';

  conceptos = signal<Concepto[]>([]);
  filteredConceptos!: Observable<Concepto[]>;
  totalConceptos = 0;

  categoriaForm = signal(
    new FormGroup({
      id: new FormControl(0, { nonNullable: true }),
      nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      id_concepto: new FormControl(0, {
        nonNullable: true,
        validators: [idConceptoValido(this.conceptos())]
      }),
      conceptoText: new FormControl<Concepto | null>(null, { nonNullable: true })
    })
  );

  constructor(
    private categoriasService: CategoriasService,
    private conceptosService: ConceptosService,
  ) {
    const data = inject(MAT_DIALOG_DATA) as { mode: 'create' | 'update', categoria?: Categoria };
    this.mode = data.mode;
    if (this.mode === 'update' && data.categoria) {
      const { id, nombre, concepto } = data.categoria;
      this.categoriaForm.update(form => {
        form.patchValue({
          id,
          nombre,
          id_concepto: concepto.id,
          conceptoText: concepto
        });
        return form;
      });
    }
  }

  ngOnInit() {
    this.loadConceptos();
  }

  loadConceptos() {
    const page: number = 0;
    const searchTerm: string = '';
    const perPage: number = 0;
    this.conceptosService.getConceptos(page, perPage, searchTerm).subscribe({
      next: (response) => {
        this.conceptos.set(response.conceptos);

        const idConceptoControl = this.categoriaForm().get('id_concepto');
        if (idConceptoControl) {
          idConceptoControl.setValidators([
            idConceptoValido(this.conceptos())
          ]);
          idConceptoControl.updateValueAndValidity();
        }

        // Configurar el filtrado después de cargar los conceptos
        this.setupConceptoFiltering();
      },
      error: (err) => {
        console.error('Error al cargar conceptos', err.message);
        alert('No se pudieron cargar los conceptos. Intente nuevamente.');
      }
    });
  }

  private setupConceptoFiltering() {
    const conceptoTextControl = this.categoriaForm().get('conceptoText');
    const idConceptoControl = this.categoriaForm().get('id_concepto');

    // Configurar el filtrado de conceptos
    this.filteredConceptos = conceptoTextControl!.valueChanges.pipe(
      startWith(conceptoTextControl!.value || ''),
      map(value => this._filterConceptos(value))
    );

    conceptoTextControl?.valueChanges.pipe(
      startWith(conceptoTextControl!.value || ''),
    ).subscribe(value => {
      if (typeof value === 'object' && value !== null && 'id' in value) {
        idConceptoControl?.setValue(value.id);
      } else {
        idConceptoControl?.setValue(0);
      }
    });
  }

  displayFn(concepto: Concepto): string {
    return concepto ? concepto.nombre : '';
  }

  private _filterConceptos(value: string | Concepto | null): Concepto[] {
    if (!value) {
      return this.conceptos();
    }
    
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value.nombre.toLowerCase();
    
    return this.conceptos().filter(concepto => 
      concepto.nombre.toLowerCase().includes(filterValue)
    );
  }

  save() {
    if (this.categoriaForm().valid) {
      const categoriaData = this.categoriaForm().getRawValue();
      const { conceptoText, ...submitData } = categoriaData;

      if (this.mode === 'create') {
        const { id, ...rest } = submitData;
        this.categoriasService.createCategoria(rest).subscribe({
          next: (NewCategoria: NewCategoria) => {
            this.dialogRef.close({
              mode: this.mode,
              NewCategoria: NewCategoria
            });
          },
          error: (error: unknown) => {
            console.error('Creation failed:', error);
          }
        });
      } else {
        this.categoriasService.updateCategoria(submitData.id, submitData).subscribe({
          next: (categoria: UpdateCategoria) => {
            this.dialogRef.close({
              mode: this.mode,
              categoria: categoria
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