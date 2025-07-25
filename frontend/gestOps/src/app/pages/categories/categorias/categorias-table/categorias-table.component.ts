import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatDialog } from '@angular/material/dialog';
import { CategoriaFormDialogComponent } from '../categoria-form-dialog/categoria-form-dialog.component';
import { CategoriaConfirmDialogComponent } from '../categoria-confirm-dialog/categoria-confirm-dialog.component';

import { 
  CategoriasService,
  Categoria,
} from '../../../../services/categorias/categorias.service';

@Component({
  selector: 'app-categorias-table',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule
  ],
  templateUrl: './categorias-table.component.html',
  styleUrl: './categorias-table.component.css'
})
export class CategoriasTableComponent implements AfterViewInit {
  headerColor = 'bg-[#006e2e]/70';

  columnsToDisplay: string[] = ['id', 'nombre', 'concepto'];
  dataSource = new MatTableDataSource<Categoria>();

  totalCategorias = 0;
  currentPage = 1;
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private categoriasService: CategoriasService,
    private dialog: MatDialog
  ) { }

  ngAfterViewInit() {
    this.paginator.page.subscribe(pageEvent => {
      this.currentPage = pageEvent.pageIndex + 1;
      this.loadCategorias(this.currentPage, this.searchTerm);
    });
  
    this.dataSource.sortingDataAccessor = (item: Categoria, property: string) => {
      switch (property) {
        case 'concepto': return item.concepto.nombre;
        case 'id': return item.id;
        case 'nombre': return item.nombre;
        default: return '';
      }
    };
    
    this.dataSource.sort = this.sort;
  }

  openCategoriaFormDialog(mode: 'create' | 'update', categoria?: Categoria) {
    const dialogRef = this.dialog.open(CategoriaFormDialogComponent, {
      width: '400px',
      height: '300px',
      data: {
        mode: mode,
        categoria: categoria
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(`Categoria ${mode}:`, result);
        this.loadCategorias(this.currentPage, this.searchTerm);
      }
    });
  }

  openDeleteCategoriaDialog(categoriaId: number) {
    const dialogRef = this.dialog.open(CategoriaConfirmDialogComponent, {
      width: '400px',
      data: { categoriaId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategorias(this.currentPage, this.searchTerm);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchTerm = filterValue;

    if (filterValue === '' || filterValue.length >= 1) {
      this.currentPage = 1;
      this.paginator.pageIndex = 0;
      this.loadCategorias(this.currentPage, filterValue);
    }
  }

  ngOnInit() {
    this.loadCategorias();
  }

  loadCategorias(page: number = 1, searchTerm: string = '') {
    const perPage = this.paginator?.pageSize || 10;
    this.categoriasService.getCategorias(page, perPage, searchTerm).subscribe({
      next: (response) => {
        this.dataSource.data = response.categorias;
        this.totalCategorias = response.total;

        if (this.paginator) {
          this.paginator.length = response.total;
        }
      },
      error: (err) => {
        console.error('Error al cargar categorias', err.message);
        alert('No se pudieron cargar los categorias. Intente nuevamente.');
      }
    });
  }
}