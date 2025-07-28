import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, FormControl, ValidatorFn } from '@angular/forms';
import { Observable, startWith, map, forkJoin, finalize } from 'rxjs';

import { MatDialog, MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRippleModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { OperacionesService } from '../../../services/operaciones/operaciones.service';
import { EntitiesService, Entity } from '../../../services/entities/entities.service';
import { SubcategoriasService, Subcategoria, Categoria, Concepto } from '../../../services/subcategorias/subcategorias.service';
import { FileValidationService } from '../../../services/file-validation/file-validation.service';
import { MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material/core';
import { FechaConfirmDialogComponent } from '../fecha-confirm-dialog/fecha-confirm-dialog.component';

import { OperacionConfirmDialogComponent } from '../operacion-confirm-dialog/operacion-confirm-dialog.component';

export interface Operacion {
  id?: number;
  fecha: string;
  tipo: string;
  caracter: string;
  naturaleza: string;
  option: string;
  codigo: string;
  observaciones?: string;
  metodo_de_pago: string;
  monto_total: number;
  id_persona?: number;
  persona?: Entity;
  id_subcategoria?: number;
  subcategoria?: Subcategoria;
  id_usuario?: number;
  usuario?: string;

  comprobante?: string | null;
  archivo1?: string | null;
  archivo2?: string | null;
  archivo3?: string | null;

  comprobante_path?: string | null;
  archivo1_path?: string | null;
  archivo2_path?: string | null;
  archivo3_path?: string | null;
}

@Component({
  selector: 'app-operacion-form-dialog',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonToggleModule, MatIconModule, MatAutocompleteModule,
    MatRippleModule, MatProgressSpinnerModule
  ],
  providers: [
    provideNativeDateAdapter(),
    OperacionesService,
    EntitiesService,
    SubcategoriasService,
    FileValidationService,
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    {
      provide: MAT_DATE_FORMATS, useValue: {
        parse: { dateInput: 'YYYY-MM-DD' },
        display: {
          dateInput: 'YYYY-MM-DD',
          monthYearLabel: 'YYYY MMM',
          dateA11yLabel: 'YYYY-MM-DD',
          monthYearA11yLabel: 'YYYY MMM',
        }
      }
    }
  ],
  templateUrl: './operacion-form-dialog.component.html',
  styleUrls: ['./operacion-form-dialog.component.css']
})
export class OperacionFormDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<OperacionFormDialogComponent>);
  private data: { operacion?: Operacion, mode: 'create' | 'update' } = inject(MAT_DIALOG_DATA);
  private operacionesService = inject(OperacionesService);
  private entitiesService = inject(EntitiesService);
  private subcategoriasService = inject(SubcategoriasService);
  private fileValidationService = inject(FileValidationService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);

  public loading = false;
  public operacionForm!: FormGroup;
  public mode: 'create' | 'update' = this.data.mode;
  public originalOperacion: Operacion | null = null;

  public personas: Entity[] = [];
  public subcategorias: Subcategoria[] = [];
  public conceptosAgrupados: any[] = [];

  public entidadCtrl = new FormControl<string | Entity>('', [this.objectRequiredValidator()]);
  public subcategoriaCtrl = new FormControl<string | Subcategoria>('', [this.objectRequiredValidator()]);
  public filteredPersonas!: Observable<Entity[]>;
  public filteredSubcategorias!: Observable<any[]>;

  public selectedFiles: { [key: string]: File } = {};
  public fileErrors: { [key: string]: string } = {};
  public fileFields = [
    { key: 'comprobante', label: 'Comprobante', placeholder: 'Seleccionar archivo' },
    { key: 'archivo1', label: 'Archivo 1', placeholder: 'Seleccionar archivo' },
    { key: 'archivo2', label: 'Archivo 2', placeholder: 'Seleccionar archivo' },
    { key: 'archivo3', label: 'Archivo 3', placeholder: 'Seleccionar archivo' }
  ];

  ngOnInit(): void {
    this.operacionForm = this.fb.group({
      fecha: ['', Validators.required],
      tipo: ['', Validators.required],
      caracter: ['', Validators.required],
      naturaleza: ['', Validators.required],
      option: ['', Validators.required],
      codigo: ['', [Validators.required, Validators.maxLength(20), this.codigoValidator()]],
      observaciones: ['', Validators.maxLength(255)],
      metodo_de_pago: ['', Validators.required],
      monto_total: ['', [Validators.required, Validators.min(0.01), Validators.max(999999999.99)]],
      id_persona: [''],
      id_subcategoria: [''],
      id_usuario: [''],
      comprobante_path: [null as string | null],
      archivo1_path: [null as string | null],
      archivo2_path: [null as string | null],
      archivo3_path: [null as string | null],
    });

    this.operacionForm.get('monto_total')?.valueChanges.subscribe(value => {
      if (typeof value === 'string') {
        let newValue = value.replace(',', '.');
        if (newValue.includes('-')) {
          newValue = Math.abs(Number(newValue)).toString();
        }
        if (!isNaN(Number(newValue))) {
          this.operacionForm.get('monto_total')?.setValue(Number(newValue), { emitEvent: false });
        }
      } else if (typeof value === 'number' && value < 0) {
        this.operacionForm.get('monto_total')?.setValue(Math.abs(value), { emitEvent: false });
      }
    });

    if (this.mode === 'update' && this.data.operacion) {
      this.originalOperacion = {
        ...this.data.operacion,
        comprobante_path: this.data.operacion.comprobante_path || null,
        archivo1_path: this.data.operacion.archivo1_path || null,
        archivo2_path: this.data.operacion.archivo2_path || null,
        archivo3_path: this.data.operacion.archivo3_path || null,
        id_persona: this.data.operacion.persona?.id,
        id_subcategoria: this.data.operacion.subcategoria?.id,
        id_usuario: this.data.operacion.id_usuario
      };

      this.operacionForm.reset();

      setTimeout(() => {
        let fechaParaForm: Date | null = null;
        if (this.data.operacion!.fecha) {
          const dateParts = this.data.operacion!.fecha.split('-').map(Number);
          fechaParaForm = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        }

        this.operacionForm.patchValue({
          ...this.data.operacion,
          fecha: fechaParaForm,
          id_persona: this.data.operacion?.persona?.id || null,
          id_subcategoria: this.data.operacion?.subcategoria?.id || null,
          id_usuario: this.data.operacion?.id_usuario || null,

          comprobante_path: this.data.operacion!.comprobante || null,
          archivo1_path: this.data.operacion!.archivo1 || null,
          archivo2_path: this.data.operacion!.archivo2 || null,
          archivo3_path: this.data.operacion!.archivo3 || null,
        });

        if (this.data.operacion!.persona) {
          this.entidadCtrl.setValue(this.data.operacion!.persona);
        }
        if (this.data.operacion!.subcategoria) {
          this.subcategoriaCtrl.setValue(this.data.operacion!.subcategoria);
        }

        this.entidadCtrl.updateValueAndValidity();
        this.subcategoriaCtrl.updateValueAndValidity();
      });
    }

    this.setupAutocompletes();
    this.loadInitialData();

    this.operacionForm.get('option')?.valueChanges.subscribe(() => {
      this.operacionForm.get('codigo')?.updateValueAndValidity();
    });
  }

  private setupAutocompletes(): void {
    this.filteredPersonas = this.entidadCtrl.valueChanges.pipe(
      startWith(''),
      map(value => {
        if (typeof value === 'object' && value !== null && value.id) {
          return this.personas.filter(p => p.id === value.id);
        }
        return this.filterByDisplay(this.personas, value, this.getEntidadDisplay);
      })
    );

    this.filteredSubcategorias = this.subcategoriaCtrl.valueChanges.pipe(
      startWith(''),
      map(value => {
        if (typeof value === 'object' && value !== null && value.id) {
          return this.groupSubcategorias(this.subcategorias.filter(s => s.id === value.id));
        }
        return this.filterSubcategorias(value);
      })
    );
  }

  private loadInitialData(): void {
    forkJoin({
      personas: this.entitiesService.getEntities(0, 0, ''),
      subcategorias: this.subcategoriasService.getSubcategorias(0, 0, '')
    }).subscribe({
      next: ({ personas, subcategorias }) => {
        this.personas = personas.personas || [];
        this.subcategorias = subcategorias.subcategorias || [];
        this.conceptosAgrupados = this.groupSubcategorias(this.subcategorias);

        if (this.mode === 'update' && this.data.operacion) {
          const personaId = this.data.operacion.persona?.id;
          const personaFound = this.personas.find(p => p.id === personaId);
          if (personaFound) {
            this.entidadCtrl.setValue(personaFound);
          } else {
            this.entidadCtrl.setValue(null);
          }

          const subcategoriaId = this.data.operacion.subcategoria?.id;
          const subcategoriaFound = this.subcategorias.find(s => s.id === subcategoriaId);
          if (subcategoriaFound) {
            this.subcategoriaCtrl.setValue(subcategoriaFound);
          } else {
            this.subcategoriaCtrl.setValue(null);
          }

          setTimeout(() => {
            this.entidadCtrl.updateValueAndValidity();
            this.subcategoriaCtrl.updateValueAndValidity();
            this.operacionForm.updateValueAndValidity();
          });
        }
      },
      error: (error) => console.error('Error al cargar datos iniciales:', error)
    });
  }

  public getEntidadDisplay = (entidad: Entity | string): string => {
    if (typeof entidad === 'string') return entidad;
    return entidad?.razon_social ? `${entidad.razon_social} - ${entidad.cuit}` : '';
  }

  public onEntidadSelected(option: any): void {
    let entidad: Entity | null = null;
    if (typeof option === 'object' && option !== null && option.id !== undefined) {
      entidad = option;
    } else if (option && option.source && option.source.value) {
      entidad = option.source.value;
    }
    if (entidad) {
      this.entidadCtrl.setValue(entidad);
    }
  }

  public getSubcategoriaDisplay = (subcat: Subcategoria | string): string => {
    if (typeof subcat === 'string') return subcat;
    return subcat?.categoria ? `${subcat.categoria.concepto.nombre} > ${subcat.categoria.nombre} > ${subcat.nombre}` : '';
  }

  public onSubcategoriaSelected(option: any): void {
    let subcat: Subcategoria | null = null;
    if (typeof option === 'object' && option !== null && option.id !== undefined) {
      subcat = option;
    } else if (option && option.source && option.source.value) {
      subcat = option.source.value;
    }
    if (subcat) {
      this.subcategoriaCtrl.setValue(subcat);
    }
  }

  private filterByDisplay<T>(collection: T[], value: any, displayFn: (item: T) => string): T[] {
    const filterValue = (typeof value === 'string' ? value : displayFn(value as T)).toLowerCase();
    if (!filterValue) return collection.slice();
    return collection.filter(item => displayFn(item).toLowerCase().includes(filterValue));
  }

  private filterSubcategorias(value: any): any[] {
    if (!value || (typeof value === 'string' && value.trim() === '') || typeof value === 'object') {
      return this.conceptosAgrupados;
    }
    const filterValue = (typeof value === 'string' ? value : this.getSubcategoriaDisplay(value)).toLowerCase();
    const filteredSubs = this.subcategorias.filter(sub =>
      this.getSubcategoriaDisplay(sub).toLowerCase().includes(filterValue)
    );
    return this.groupSubcategorias(filteredSubs);
  }

  private groupSubcategorias(subcategorias: Subcategoria[]): any[] {
    const conceptosMap = new Map<string, { nombre: string, categorias: Map<string, { nombre: string, subcategorias: Subcategoria[] }> }>();
    subcategorias.forEach(sub => {
      const { concepto, nombre: catNombre } = sub.categoria;
      if (!conceptosMap.has(concepto.nombre)) {
        conceptosMap.set(concepto.nombre, { nombre: concepto.nombre, categorias: new Map() });
      }
      const conceptoGroup = conceptosMap.get(concepto.nombre)!;

      if (!conceptoGroup.categorias.has(catNombre)) {
        conceptoGroup.categorias.set(catNombre, { nombre: catNombre, subcategorias: [] });
      }
      conceptoGroup.categorias.get(catNombre)!.subcategorias.push(sub);
    });
    return Array.from(conceptosMap.values()).map(c => ({
      nombre: c.nombre,
      categorias: Array.from(c.categorias.values())
    }));
  }

  private codigoValidator(): (control: AbstractControl) => { [key: string]: any } | null {
    return (control: AbstractControl) => {
      const option = this.operacionForm?.get('option')?.value;
      if (!control.value || !option) return null;

      if (option === 'factura' && !/^\d{5}-\d{8}$/.test(control.value)) {
        return { invalidFacturaCodigo: true };
      }
      if (option === 'boleta' && !/^\d+$/.test(control.value)) {
        return { invalidBoletaCodigo: true };
      }
      return null;
    };
  }

  private objectRequiredValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (typeof value === 'object' && value !== null && value.id !== undefined) {
        return null;
      }
      return { 'objectRequired': true };
    };
  }

  public onFileSelected(event: Event, key: string): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const validation = this.fileValidationService.validateFile(file);
    if (validation.isValid) {
      this.selectedFiles[key] = file;
      this.fileErrors[key] = '';
      // Clear the existing path if a new file is selected
      this.operacionForm.get(`${key}_path`)?.setValue(null);
    } else {
      this.fileErrors[key] = validation.message;
      delete this.selectedFiles[key];
      (event.target as HTMLInputElement).value = '';
    }
  }

  public getFileNameFromPath(path: string): string {
    if (!path) return '';
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  public getAcceptString = (): string => this.fileValidationService.getAcceptString();
  public getValidationConfig = () => this.fileValidationService.getValidationConfig();
  public formatFileSize = (bytes: number): string => this.fileValidationService.formatFileSize(bytes);
  public clearFileError = (key: string): void => { this.fileErrors[key] = ''; };

  public onSubmit(): void {
    const selectedPersona = this.entidadCtrl.value;
    if (typeof selectedPersona === 'object' && selectedPersona !== null) {
      this.operacionForm.get('id_persona')?.setValue(selectedPersona.id);
    } else {
      this.operacionForm.get('id_persona')?.setValue(null);
    }

    const selectedSubcategoria = this.subcategoriaCtrl.value;
    if (typeof selectedSubcategoria === 'object' && selectedSubcategoria !== null) {
      this.operacionForm.get('id_subcategoria')?.setValue(selectedSubcategoria.id);
    } else {
      this.operacionForm.get('id_subcategoria')?.setValue(null);
    }

    const userId = Number(localStorage.getItem('id'));
    this.operacionForm.get('id_usuario')?.setValue(userId);

    this.operacionForm.updateValueAndValidity();

    if (this.operacionForm.invalid || this.entidadCtrl.invalid || this.subcategoriaCtrl.invalid) {
      this.operacionForm.markAllAsTouched();
      this.entidadCtrl.markAsTouched();
      this.subcategoriaCtrl.markAsTouched();
      return;
    }

    const fechaSeleccionada = new Date(this.operacionForm.value.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy && this.mode === 'create') {
      const dialogRef = this.dialog.open(FechaConfirmDialogComponent, {
        data: {
          message: 'La fecha seleccionada es anterior a hoy. ¿Desea continuar?',
          showCancelButton: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.proceedSubmit();
        } else {
          this.loading = false;
        }
      });
    } else {
      this.proceedSubmit();
    }
  }

  private proceedSubmit(): void {
    this.loading = true;

    if (this.mode === 'create') {
      const operacionData = {
        ...this.operacionForm.value,
        fecha: this.formatFecha(this.operacionForm.value.fecha),
      };

      this.operacionesService.createOperacion(operacionData).pipe(
        finalize(() => this.loading = false)
      ).subscribe({
        next: (operacionCreada) => {
          if (Object.keys(this.selectedFiles).length > 0) {
            this.uploadFiles(operacionCreada.id!);
          } else {
            this.dialogRef.close(operacionCreada);
          }
        },
        error: () => {
          this.dialog.open(FechaConfirmDialogComponent, {
            data: {
              message: 'Error al crear la operación.',
              showCancelButton: false
            }
          });
        }
      });
    } else {
      const changedValues = this.getChangedValues();
      if (Object.keys(changedValues).length === 0 && Object.keys(this.selectedFiles).length === 0) {
        this.dialog.open(FechaConfirmDialogComponent, {
          data: {
            message: 'No hay cambios para guardar.',
            showCancelButton: false
          }
        });
        this.loading = false;
        this.dialogRef.close();
        return;
      }

      const operacionId = this.originalOperacion!.id;

      const updateOperation$ = Object.keys(changedValues).length > 0
        ? this.operacionesService.updateOperacion(operacionId!, changedValues)
        : new Observable(observer => { observer.next({}); observer.complete(); });

      updateOperation$.pipe(
        finalize(() => this.loading = false)
      ).subscribe({
        next: (updatedOperacion) => {
          if (Object.keys(this.selectedFiles).length > 0) {
            this.uploadFiles(operacionId!);
          } else {
            this.dialogRef.close(updatedOperacion);
          }
        },
        error: () => {
          this.dialog.open(FechaConfirmDialogComponent, {
            data: {
              message: 'Error al actualizar la operación.',
              showCancelButton: false
            }
          });
        }
      });
    }
  }

  private getChangedValues(): Partial<Operacion> {
    const changed: Partial<Operacion> = {};
    const currentValues = this.operacionForm.value;

    for (const key in currentValues) {
      if (currentValues.hasOwnProperty(key)) {
        let originalValue = (this.originalOperacion as any)?.[key];
        let currentValue = currentValues[key];

        if (key === 'id_usuario') {
          continue;
        }

        if (key === 'fecha' && originalValue) {
          const originalDate = new Date(originalValue);
          const currentFormDate = currentValue instanceof Date ? currentValue : new Date(currentValue);

          originalValue = originalDate.toISOString().split('T')[0];
          currentValue = currentFormDate.toISOString().split('T')[0];
        }

        if (key.endsWith('_path')) {
          const fileKey = key.replace('_path', '');
          if (this.selectedFiles[fileKey]) {
            continue;
          }

          const effectiveOriginalValue = originalValue === undefined ? null : originalValue;
          const effectiveCurrentValue = currentValue === undefined ? null : currentValue;

          if (effectiveOriginalValue !== effectiveCurrentValue) {
            (changed as any)[key] = effectiveCurrentValue;
          }
          continue;
        }

        if (originalValue !== currentValue) {
          if (key === 'id_persona' && this.entidadCtrl.value && typeof this.entidadCtrl.value === 'object') {
            changed[key] = this.entidadCtrl.value.id;
          } else if (key === 'id_subcategoria' && this.subcategoriaCtrl.value && typeof this.subcategoriaCtrl.value === 'object') {
            changed[key] = this.subcategoriaCtrl.value.id;
          }
          else {
            (changed as any)[key] = currentValue;
          }
        }
      }
    }
    return changed;
  }

  private uploadFiles(operacionId: number): void {
    this.loading = true;

    if (this.mode === 'create') {
      const totalFormData = new FormData();
      let hasFiles = false;
      for (const key in this.selectedFiles) {
        if (this.selectedFiles.hasOwnProperty(key)) {
          totalFormData.append(key, this.selectedFiles[key]);
          hasFiles = true;
        }
      }

      if (hasFiles) {
        this.operacionesService.uploadArchivos(operacionId, totalFormData).pipe(
          finalize(() => this.loading = false)
        ).subscribe({
          next: () => this.dialogRef.close(this.originalOperacion || {}),
          error: (error) => {
            console.error('Error al subir archivos en creación:', error);
            this.dialog.open(FechaConfirmDialogComponent, {
              data: {
                message: 'Operación creada, pero ocurrió un error al subir los archivos.',
                showCancelButton: false
              }
            });
            this.dialogRef.close(this.originalOperacion || {});
          }
        });
      } else {
        this.loading = false;
        this.dialogRef.close(this.originalOperacion || {});
      }
    } else {
      const fileUploadObservables: Observable<any>[] = [];

      for (const key in this.selectedFiles) {
        if (this.selectedFiles.hasOwnProperty(key)) {
          const file = this.selectedFiles[key];
          const formData = new FormData();
          formData.append(key, file);
          fileUploadObservables.push(this.operacionesService.updateArchivo(operacionId, key, formData));
        }
      }

      if (fileUploadObservables.length > 0) {
        this.loading = true;
        forkJoin(fileUploadObservables).pipe(
          finalize(() => this.loading = false)
        ).subscribe({
          next: () => this.dialogRef.close(this.originalOperacion || {}),
          error: (error) => {
            console.error('Error al subir archivos:', error);
            this.dialog.open(FechaConfirmDialogComponent, {
              data: {
                message: 'Operación actualizada, pero ocurrió un error al subir los archivos.',
                showCancelButton: false
              }
            });
            this.dialogRef.close(this.originalOperacion || {});
          }
        });
      } else {
        this.dialogRef.close(this.originalOperacion || {});
      }
    }
  }

  private formatFecha(fecha: Date | string): string {
    if (fecha instanceof Date) {
      return fecha.toISOString().split('T')[0];
    }
    return fecha;
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  openDeleteOperationDialog(operationId: number, path: string) {
    const dialogRef = this.dialog.open(OperacionConfirmDialogComponent, {
      width: '400px',
      data: { tipo: 'archivo', id: operationId, path: path }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close({ reload: true });
      }
    });
  }

  trackById(index: number, item: any): any {
    return item.id;
  }
}
