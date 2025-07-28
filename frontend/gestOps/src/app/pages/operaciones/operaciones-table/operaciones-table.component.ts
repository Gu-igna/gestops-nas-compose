import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { OperacionFormDialogComponent } from '../operacion-form-dialog/operacion-form-dialog.component';
import { FileViewerDialogComponent } from '../file-viewer-dialog/file-viewer-dialog.component';

import { OperacionConfirmDialogComponent } from '../operacion-confirm-dialog/operacion-confirm-dialog.component';

import { OperacionesService, Operacion } from '../../../services/operaciones/operaciones.service';
@Component({
  selector: 'app-operaciones-table',
  imports: [CommonModule,
    MatTableModule, MatIconModule, MatButtonModule,
    MatPaginatorModule, MatCardModule,
    MatSortModule, FormsModule, MatFormFieldModule, MatInputModule, MatDialogModule],
  templateUrl: './operaciones-table.component.html',
  styleUrl: './operaciones-table.component.css'
})
export class OperacionesTableComponent implements AfterViewInit {
  headerColor = 'bg-[#006e2e]/70';

  dataSource = new MatTableDataSource<Operation>();

  setOperacion: Operacion | null = null;

  // Propiedades para la paginación
  totalOperaciones: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;

  // Propiedades para los totales
  totalGeneral: number = 0;
  totalIngresos: number = 0;
  totalEgresos: number = 0;

  // Propiedades para los filtros aplicados
  filtrosActuales: any = {};

  // Propiedades para los filtros individuales
  filtroId: string = '';
  filtroFecha: string = '';
  filtroTipo: string = '';
  filtroCaracter: string = '';
  filtroNaturaleza: string = '';
  filtroConcepto: string = '';
  filtroCategoria: string = '';
  filtroSubcategoria: string = '';
  filtroPersona: string = '';
  filtroCuit: string = '';
  filtroOption: string = '';
  filtroCodigo: string = '';
  filtroMonto: string = '';
  filtroUsuario: string = '';
  filtroGlobal: string = '';

  isDownloadingExcel: boolean = false;

  columnsToDisplay: string[] = [
    'id', 'fecha', 'tipo', 'caracter', 'naturaleza', 'concepto', 'categoria', 'subcategoria',
    'razon_social', 'cuit', 'option', 'codigo', 'monto_total', 'usuario'
  ];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];

  filterColumns: string[] = [...this.columnsToDisplay.map(col => col + '-filter'), 'expand-filter'];

  expandedColumns = ['comprobante_path',
    'archivo1_path', 'archivo2_path', 'archivo3_path',
    'metodo_de_pago', 'modificado_por_otro',
    'observaciones'
  ];

  columnWidths: { [key: string]: string } = {
    id: 'min-w-[60px] max-w-[80px] w-full',
    fecha: 'min-w-[100px] max-w-[140px] w-full',
    tipo: 'min-w-[70px] max-w-[90px] w-full',
    caracter: 'min-w-[70px] max-w-[90px] w-full',
    naturaleza: 'min-w-[100px] max-w-[140px] w-full',
    concepto: 'min-w-[100px] max-w-[140px] w-full',
    categoria: 'min-w-[130px] max-w-[160px] w-full',
    subcategoria: 'min-w-[140px] max-w-[180px] w-full',
    razon_social: 'min-w-[130px] max-w-[160px] w-full',
    cuit: 'min-w-[100px] max-w-[120px] w-full',
    option: 'min-w-[100px] max-w-[120px] w-full',
    codigo: 'min-w-[150px] max-w-[200px] w-full',
    monto_total: 'min-w-[110px] max-w-[140px] w-full',
    usuario: 'min-w-[100px] max-w-[120px] w-full',
  };

  expandedElement: Operation | null = null;

  // Subject para debounce de filtros
  private filterSubject = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private operacionesService: OperacionesService,
    private dialog: MatDialog
  ) {
    // Configurar debounce para filtros
    this.filterSubject.pipe(
      debounceTime(500) // Esperar 500ms después del último cambio
    ).subscribe(() => {
      this.executeFilter();
    });
  }

  ngOnInit(): void {
    // Inicializar con valores por defecto
    this.currentPage = 1;
    this.pageSize = 10;
    this.loadOperaciones();
  }

  ngAfterViewInit(): void {
    // Configurar el paginador después de que la vista se haya inicializado
    if (this.paginator) {
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.currentPage - 1;
    }
  }

  getColumnWidthClass(column: string): string {
    return this.columnWidths[column] || '';
  }

  loadOperaciones(): void {
    this.operacionesService.getOperaciones(this.filtrosActuales, this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        // Guardar información de paginación
        this.totalOperaciones = data.total;

        // Mapear datos para la tabla
        this.dataSource.data = data.operaciones.map((op: any) => ({
          id: op.id,
          fecha: op.fecha,
          tipo: op.tipo,
          caracter: op.caracter,
          naturaleza: op.naturaleza,
          razon_social: op.persona.razon_social,
          cuit: op.persona.cuit,
          comprobante_path: op.comprobante,
          option: op.option,
          codigo: op.codigo,
          observaciones: op.observaciones,
          metodo_de_pago: op.metodo_de_pago,
          monto_total: op.monto_total,
          subcategoria: op.subcategoria.nombre,
          categoria: op.subcategoria.categoria.nombre,
          concepto: op.subcategoria.categoria.concepto.nombre,
          usuario: op.usuario,
          archivo1_path: op.archivo1,
          archivo2_path: op.archivo2,
          archivo3_path: op.archivo3,
          modificado_por_otro: op.modificado_por_otro
        }));

        // Configurar sort
        this.dataSource.sort = this.sort;

        // Sincronizar el paginador si existe
        if (this.paginator) {
          this.paginator.length = this.totalOperaciones;
          this.paginator.pageSize = this.pageSize;
          this.paginator.pageIndex = this.currentPage - 1;
        }

        // Cargar totales usando el nuevo endpoint
        this.loadTotales();
      },
      error: (error) => {
        console.error('Error al cargar operaciones:', error);
      }
    });
  }

  loadTotales(): void {
    this.operacionesService.getOperacionesTotales(this.filtrosActuales).subscribe({
      next: (totales) => {
        this.totalGeneral = totales.total_general;
        this.totalIngresos = totales.total_ingresos;
        this.totalEgresos = totales.total_egresos;
      },
      error: (error) => {
        console.error('Error al cargar totales:', error);
        // Fallback al cálculo local si falla el endpoint
        this.calculateTotalsForCurrentPage();
      }
    });
  }

  onPageChange(event: any): void {
    // Actualizar página actual y tamaño de página
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    // Cargar operaciones de la nueva página
    this.loadOperaciones();
  }

  calculateTotalsForCurrentPage(): void {
    this.totalIngresos = 0;
    this.totalEgresos = 0;

    // Obtener solo los datos de la página actual
    const currentPageData = this.dataSource.data;

    currentPageData.forEach(op => {
      const monto = parseFloat(op.monto_total.toString()) || 0;

      if (op.tipo === 'ingreso') {
        this.totalIngresos += monto;
      } else if (op.tipo === 'egreso') {
        this.totalEgresos += Math.abs(monto);
      }
    });

    this.totalGeneral = this.totalIngresos - this.totalEgresos;
  }

  formatNumber(num: number): string {
    return num.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    })
      .replace(/\./g, '#')
      .replace(/,/g, '.')
      .replace(/#/g, ' ');
  }

  isExpanded(element: Operation): boolean {
    return this.expandedElement === element;
  }

  toggle(element: Operation): void {
    this.expandedElement = this.isExpanded(element) ? null : element;
  }

  // Métodos para manejo de filtros
  applyFilter(campo: string, valor: string): void {
    // Actualizar el filtro específico
    switch (campo) {
      case 'id':
        this.filtroId = valor;
        break;
      case 'fecha':
        this.filtroFecha = valor;
        break;
      case 'tipo':
        this.filtroTipo = valor;
        break;
      case 'caracter':
        this.filtroCaracter = valor;
        break;
      case 'naturaleza':
        this.filtroNaturaleza = valor;
        break;
      case 'concepto':
        this.filtroConcepto = valor;
        break;
      case 'categoria':
        this.filtroCategoria = valor;
        break;
      case 'subcategoria':
        this.filtroSubcategoria = valor;
        break;
      case 'persona':
        this.filtroPersona = valor;
        break;
      case 'cuit':
        this.filtroCuit = valor;
        break;
      case 'option':
        this.filtroOption = valor;
        break;
      case 'codigo':
        this.filtroCodigo = valor;
        break;
      case 'monto':
        this.filtroMonto = valor;
        break;
      case 'usuario':
        this.filtroUsuario = valor;
        break;
      case 'global':
        this.filtroGlobal = valor;
        break;
    }

    // Usar debounce para evitar muchas peticiones
    this.filterSubject.next();
  }

  executeFilter(): void {
    // Construir objeto de filtros para el backend
    this.buildFiltrosActuales();

    // Resetear paginación y recargar datos
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadOperaciones();
  }

  buildFiltrosActuales(): void {
    this.filtrosActuales = {};

    // Agregar filtros solo si tienen valor
    if (this.filtroId.trim()) this.filtrosActuales.id = this.filtroId.trim();
    if (this.filtroFecha.trim()) this.filtrosActuales.fecha = this.filtroFecha.trim();
    if (this.filtroTipo.trim()) this.filtrosActuales.tipo = this.filtroTipo.trim();
    if (this.filtroCaracter.trim()) this.filtrosActuales.caracter = this.filtroCaracter.trim();
    if (this.filtroNaturaleza.trim()) this.filtrosActuales.naturaleza = this.filtroNaturaleza.trim();
    if (this.filtroConcepto.trim()) this.filtrosActuales.concepto = this.filtroConcepto.trim();
    if (this.filtroCategoria.trim()) this.filtrosActuales.categoria = this.filtroCategoria.trim();
    if (this.filtroSubcategoria.trim()) this.filtrosActuales.subcategoria = this.filtroSubcategoria.trim();

    // Filtros de persona y CUIT por separado
    if (this.filtroPersona.trim()) this.filtrosActuales.persona = this.filtroPersona.trim();
    if (this.filtroCuit.trim()) this.filtrosActuales.cuit = this.filtroCuit.trim();

    if (this.filtroOption.trim()) this.filtrosActuales.option = this.filtroOption.trim();
    if (this.filtroCodigo.trim()) this.filtrosActuales.codigo = this.filtroCodigo.trim();
    if (this.filtroMonto.trim()) this.filtrosActuales.monto = this.filtroMonto.trim();
    if (this.filtroUsuario.trim()) this.filtrosActuales.usuario = this.filtroUsuario.trim();

    // Filtro global: busca en todas las columnas
    if (this.filtroGlobal.trim()) {
      this.filtrosActuales.global = this.filtroGlobal.trim();
    }
  }

  clearFilters(): void {
    this.filtroId = '';
    this.filtroFecha = '';
    this.filtroTipo = '';
    this.filtroCaracter = '';
    this.filtroNaturaleza = '';
    this.filtroConcepto = '';
    this.filtroCategoria = '';
    this.filtroSubcategoria = '';
    this.filtroPersona = '';
    this.filtroCuit = '';
    this.filtroOption = '';
    this.filtroCodigo = '';
    this.filtroMonto = '';
    this.filtroUsuario = '';
    this.filtroGlobal = '';

    this.filtrosActuales = {};
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadOperaciones();
  }

  downloadExcel(): void {
    this.isDownloadingExcel = true;

    this.operacionesService.downloadExcel(this.filtrosActuales).subscribe({
      next: (blob) => {
        // Crear URL para el blob
        const url = window.URL.createObjectURL(blob);

        // Crear elemento <a> temporal para la descarga
        const link = document.createElement('a');
        link.href = url;

        // Generar nombre del archivo con fecha actual
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '_');
        link.download = `operaciones_${timestamp}.xlsx`;

        // Simular clic para iniciar descarga
        document.body.appendChild(link);
        link.click();

        // Limpiar
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.isDownloadingExcel = false;
      },
      error: (error) => {
        console.error('Error al descargar Excel:', error);
        this.isDownloadingExcel = false;
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(OperacionFormDialogComponent, {
      width: '95vw',
      height: '90vh',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: {
        mode: 'create'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(`Operación create:`, result);
        this.loadOperaciones();
      }
    });
  }

  openUpdateDialog(id: number) {
    this.operacionesService.getOperacion(id).subscribe({
      next: (operacionToUpdate: Operacion) => {

        const dialogRef = this.dialog.open(OperacionFormDialogComponent, {
          width: '95vw',
          height: '90vh',
          maxWidth: '1200px',
          maxHeight: '90vh',
          data: {
            mode: 'update',
            operacion: operacionToUpdate
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log(`Operación actualizada:`, result);
            this.loadOperaciones();
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener operación:', error);
        alert('Error al cargar la operación. Por favor, inténtalo de nuevo.');
      }
    });
  }

  openFileViewer(filePath: string, fileName: string, fileType: 'pdf' | 'image' | 'document' = 'document', operacionId?: number): void {
    if (!filePath || !operacionId) {
      return;
    }

    // Determinar el campo del archivo basado en el fileName
    let campoArchivo: string;
    if (fileName.toLowerCase().includes('comprobante')) {
      campoArchivo = 'comprobante';
    } else if (fileName.toLowerCase().includes('archivo 1')) {
      campoArchivo = 'archivo1';
    } else if (fileName.toLowerCase().includes('archivo 2')) {
      campoArchivo = 'archivo2';
    } else if (fileName.toLowerCase().includes('archivo 3')) {
      campoArchivo = 'archivo3';
    } else {
      return;
    }

    // Descargar el archivo usando el servicio
    this.operacionesService.downloadArchivo(operacionId, campoArchivo).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        // Determinar el tipo de archivo basado en la extensión del path original
        const extension = filePath.split('.').pop()?.toLowerCase();
        let detectedFileType: 'pdf' | 'image' | 'document' = fileType;

        if (extension === 'pdf') {
          detectedFileType = 'pdf';
        } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
          detectedFileType = 'image';
        }

        const dialogRef = this.dialog.open(FileViewerDialogComponent, {
          width: '90vw',
          height: '95vh',
          maxWidth: '1400px',
          maxHeight: '95vh',
          panelClass: 'file-viewer-dialog',
          data: {
            fileUrl: url,
            fileName: fileName,
            fileType: detectedFileType
          }
        });

        // Limpiar la URL blob cuando se cierre el dialog
        dialogRef.afterClosed().subscribe(() => {
          window.URL.revokeObjectURL(url);
        });
      },
      error: (error) => {
        alert('Error al cargar el archivo. Por favor, inténtalo de nuevo.');
      }
    });
  }

  openDeleteOperationDialog(operationId: number) {
    const dialogRef = this.dialog.open(OperacionConfirmDialogComponent, {
      width: '400px',
      data: { tipo: 'operacion', id: operationId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadOperaciones();
      }
    });
  }
}

interface Operation {
  id: number;
  fecha: string;
  tipo: string;
  caracter: string;
  naturaleza: string;
  razon_social: string;
  cuit: string;
  comprobante_path?: string;
  option: string;
  codigo: string;
  observaciones: string;
  metodo_de_pago: string;
  monto_total: number;
  subcategoria: string;
  categoria: string;
  concepto: string;
  usuario: string;
  archivo1_path?: string;
  archivo2_path?: string;
  archivo3_path?: string;
  modificado_por_otro: string;
}