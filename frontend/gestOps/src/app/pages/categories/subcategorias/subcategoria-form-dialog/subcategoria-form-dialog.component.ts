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
  SubcategoriasService,
  Subcategoria,
  Categoria,
  NewSubcategoria
} from '../../../../services/subcategorias/subcategorias.service';

import { CategoriasService } from '../../../../services/categorias/categorias.service';

import {
  ConceptosService,
  Concepto
} from '../../../../services/conceptos/conceptos.service';

function idCategoriaValida(categorias: Categoria[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const categoriaValida = categorias.some(categoria => categoria.id === control.value);
    return categoriaValida ? null : { idCategoriaInvalida: true };
  };
}

function idConceptoValido(conceptos: Concepto[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const conceptoValido = conceptos.some(concepto => concepto.id === control.value);
    return conceptoValido ? null : { idConceptoInvalido: true };
  };
}

@Component({
  selector: 'app-subcategoria-form-dialog',
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
  templateUrl: './subcategoria-form-dialog.component.html',
  styleUrl: './subcategoria-form-dialog.component.css'
})

export class SubcategoriaFormDialogComponent implements OnInit {

  readonly dialogRef = inject(MatDialogRef<SubcategoriaFormDialogComponent>);
  mode: 'create' | 'update';

  conceptos = signal<Concepto[]>([]);
  categorias = signal<Categoria[]>([]);
  filteredConceptos!: Observable<Concepto[]>;
  filteredCategorias = signal<Categoria[]>([]);
  filteredCategoriasObservable!: Observable<Categoria[]>;
  selectedConceptoId = signal<number>(0);
  isInitialLoad = true;

  totalCategorias = 0;

  subCategoriaForm = signal(
    new FormGroup({
      id: new FormControl(0, { nonNullable: true }),
      nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      id_concepto: new FormControl(0, {
        nonNullable: true,
        validators: [idConceptoValido(this.conceptos())]
      }),
      id_categoria: new FormControl(0, {
        nonNullable: true,
        validators: [idCategoriaValida(this.categorias())]
      }),
      conceptoText: new FormControl<Concepto | null>(null, { nonNullable: true }),
      categoriaText: new FormControl<Categoria | null>(null, { nonNullable: true })
    })
  );

  constructor(
    private subcategoriasService: SubcategoriasService,
    private categoriasService: CategoriasService,
    private conceptosService: ConceptosService,
  ) {
    const data = inject(MAT_DIALOG_DATA) as { mode: 'create' | 'update', subcategoria?: Subcategoria };
    this.mode = data.mode;
    if (this.mode === 'update' && data.subcategoria) {
      const { id, nombre, categoria } = data.subcategoria;
      this.subCategoriaForm.update(form => {
        form.patchValue({
          id,
          nombre,
          id_concepto: categoria.concepto.id,
          id_categoria: categoria.id,
          conceptoText: categoria.concepto,
          categoriaText: categoria
        });
        return form;
      });
      this.selectedConceptoId.set(categoria.concepto.id);
    }
  }

  ngOnInit() {
    this.loadConceptos();
    this.loadCategorias();
  }

  loadConceptos() {
    const page: number = 0;
    const searchTerm: string = '';
    const perPage: number = 0;
    this.conceptosService.getConceptos(page, perPage, searchTerm).subscribe({
      next: (response) => {
        this.conceptos.set(response.conceptos);

        const idConceptoControl = this.subCategoriaForm().get('id_concepto');
        if (idConceptoControl) {
          idConceptoControl.setValidators([
            idConceptoValido(this.conceptos())
          ]);
          idConceptoControl.updateValueAndValidity();
        }

        // Configurar el filtrado de conceptos después de cargar
        this.setupConceptoFiltering();
      },
      error: (err) => {
        console.error('Error al cargar conceptos', err.message);
        alert('No se pudieron cargar los conceptos. Intente nuevamente.');
      }
    });
  }

  loadCategorias() {
    const page: number = 0;
    const searchTerm: string = '';
    const perPage: number = 0;
    this.categoriasService.getCategorias(page, perPage, searchTerm).subscribe({
      next: (response) => {
        this.categorias.set(response.categorias);

        const idCategoriaControl = this.subCategoriaForm().get('id_categoria');
        if (idCategoriaControl) {
          idCategoriaControl.setValidators([
            idCategoriaValida(this.categorias())
          ]);
          idCategoriaControl.updateValueAndValidity();
        }

        if (this.selectedConceptoId() > 0) {
          this.filterCategoriasByConcepto(this.selectedConceptoId());
          // Pequeño retraso para asegurar que el filtrado se complete antes de configurar el observable
          setTimeout(() => {
            this.setupCategoriaFiltering();
            // Trigger la actualización del observable con el valor inicial
            if (this.mode === 'update') {
              const categoriaTextControl = this.subCategoriaForm().get('categoriaText');
              if (categoriaTextControl && categoriaTextControl.value) {
                setTimeout(() => {
                  this.filteredCategoriasObservable = categoriaTextControl.valueChanges.pipe(
                    startWith(categoriaTextControl.value),
                    map(value => this._filterCategorias(value))
                  );
                }, 10);
              }
            }
          }, 0);
        } else {
          // Configurar el filtrado de categorías después de cargar
          this.setupCategoriaFiltering();
        }
      },
      error: (err) => {
        console.error('Error al cargar categorias', err.message);
        alert('No se pudieron cargar las categorías. Intente nuevamente.');
      }
    });
  }

  filterCategoriasByConcepto(conceptoId: number) {
    const filtered = this.categorias().filter(categoria => categoria.concepto.id === conceptoId);
    this.filteredCategorias.set(filtered);
  }

  private setupConceptoFiltering() {
    const conceptoTextControl = this.subCategoriaForm().get('conceptoText');
    const idConceptoControl = this.subCategoriaForm().get('id_concepto');
    const categoriaTextControl = this.subCategoriaForm().get('categoriaText');
    const idCategoriaControl = this.subCategoriaForm().get('id_categoria');

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
        this.selectedConceptoId.set(value.id);
        this.filterCategoriasByConcepto(value.id);

        // Solo resetear la categoría si no es la carga inicial o no estamos en modo editar
        if (!this.isInitialLoad || this.mode === 'create') {
          categoriaTextControl?.setValue(null);
          idCategoriaControl?.setValue(0);
        }
        
        // Marcar que ya no es la carga inicial después del primer cambio
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
        }
      } else {
        idConceptoControl?.setValue(0);
        this.selectedConceptoId.set(0);
        this.filteredCategorias.set([]);
      }
    });
  }

  private setupCategoriaFiltering() {
    const categoriaTextControl = this.subCategoriaForm().get('categoriaText');
    const idCategoriaControl = this.subCategoriaForm().get('id_categoria');

    // Configurar el filtrado de categorías
    this.filteredCategoriasObservable = categoriaTextControl!.valueChanges.pipe(
      startWith(categoriaTextControl!.value || ''),
      map(value => this._filterCategorias(value))
    );

    categoriaTextControl?.valueChanges.pipe(
      startWith(categoriaTextControl!.value || ''),
    ).subscribe(value => {
      if (typeof value === 'object' && value !== null && 'id' in value) {
        idCategoriaControl?.setValue(value.id);
      } else {
        idCategoriaControl?.setValue(0);
      }
    });

    // Si estamos en modo editar, necesitamos trigger el filtrado inicial
    if (this.mode === 'update' && categoriaTextControl!.value) {
      setTimeout(() => {
        categoriaTextControl!.updateValueAndValidity();
      }, 0);
    }
  }

  displayConceptoFn(concepto: Concepto): string {
    return concepto ? concepto.nombre : '';
  }

  displayCategoriaFn(categoria: Categoria): string {
    return categoria ? categoria.nombre : '';
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

  private _filterCategorias(value: string | Categoria | null): Categoria[] {
    if (!value) {
      return this.filteredCategorias();
    }
    
    const filterValue = typeof value === 'string' ? value.toLowerCase() : value.nombre.toLowerCase();
    
    return this.filteredCategorias().filter(categoria => 
      categoria.nombre.toLowerCase().includes(filterValue)
    );
  }

  save() {
    if (this.subCategoriaForm().valid) {
      const subcategoriaData = this.subCategoriaForm().getRawValue();
      const { conceptoText, categoriaText, id_concepto, ...submitData } = subcategoriaData;

      if (this.mode === 'create') {
        const { id, ...rest } = submitData;
        this.subcategoriasService.createSubcategoria(rest).subscribe({
          next: (newSubcategoria: NewSubcategoria) => {
            this.dialogRef.close({
              mode: this.mode,
              newSubcategoria: newSubcategoria
            });
          },
          error: (error: unknown) => {
            console.error('Creation failed:', error);
          }
        });
      } else {

        const updateData = {
          nombre: submitData.nombre,
          id_categoria: submitData.id_categoria
        };
        this.subcategoriasService.updateSubcategoria(submitData.id, updateData as any).subscribe({
          next: (subcategoria: any) => {
            this.dialogRef.close({
              mode: this.mode,
              subcategoria: subcategoria
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