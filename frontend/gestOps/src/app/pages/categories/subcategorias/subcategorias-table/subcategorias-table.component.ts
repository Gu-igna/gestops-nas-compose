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
import { SubcategoriaFormDialogComponent } from '../subcategoria-form-dialog/subcategoria-form-dialog.component';
import { SubcategoriaConfirmDialogComponent } from '../subcategoria-confirm-dialog/subcategoria-confirm-dialog.component';

import { 
  SubcategoriasService,
  Subcategoria
} from '../../../../services/subcategorias/subcategorias.service';

@Component({
  selector: 'app-subcategorias-table',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  templateUrl: './subcategorias-table.component.html',
  styleUrl: './subcategorias-table.component.css'
})
export class SubcategoriasTableComponent {
  headerColor = 'bg-[#006e2e]/70';

  columnsToDisplay: string[] = ['concepto','categoria', 'subcategoria'];
  dataSource = new MatTableDataSource<Subcategoria>();

  totalSubcategorias = 0;
  currentPage = 1;
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private subcategoriasService: SubcategoriasService,
    private dialog: MatDialog
  ) { }

  ngAfterViewInit() {
    this.paginator.page.subscribe(pageEvent => {
      this.currentPage = pageEvent.pageIndex + 1;
      this.loadSubcategorias(this.currentPage, this.searchTerm);
    });

    this.dataSource.sortingDataAccessor = (item: Subcategoria, property: string) => {
      switch (property) {
        case 'concepto': return item.categoria?.concepto?.nombre ?? '';
        case 'categoria': return item.categoria?.nombre ?? '';
        case 'subcategoria': return item.nombre ?? '';
        default: return (item as any)[property] ?? '';
      }
    };
    this.dataSource.sort = this.sort;
  }

  openSubcategoriaFormDialog(mode: 'create' | 'update', subcategoria?: Subcategoria) {
    const dialogRef = this.dialog.open(SubcategoriaFormDialogComponent, {
      width: '400px',
      height: 'auto',
      data: {
        mode,
        subcategoria: subcategoria
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(`Subcategoria ${mode}:`, result);
        this.loadSubcategorias(this.currentPage, this.searchTerm);
      }
    });
  }

  openDeleteSubcategoriaDialog(subcategoriaId: number) {
    const dialogRef = this.dialog.open(SubcategoriaConfirmDialogComponent, {
      width: '400px',
      data: {
        subcategoriaId: subcategoriaId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubcategorias(this.currentPage, this.searchTerm);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchTerm = filterValue;

    if (filterValue === '' || filterValue.length >= 1) {
      this.currentPage = 1;
      this.paginator.pageIndex = 0;
      this.loadSubcategorias(this.currentPage, filterValue);
    }
  }

  ngOnInit() {
    this.loadSubcategorias();
  }

  loadSubcategorias(page: number = 1, searchTerm: string = '') {
    const perPage = this.paginator?.pageSize || 10;
    this.subcategoriasService.getSubcategorias(page, perPage,searchTerm).subscribe({
      next: (response) => {
        this.dataSource.data = response.subcategorias;
        this.totalSubcategorias = response.total;

        if (this.paginator) {
          this.paginator.length = response.total;
        }
      },
      error: (err) => {
        console.error('Error al cargar subcategorias', err.message);
        alert('No se pudieron cargar los subcategorias. Intente nuevamente.');
      }
    });
  }

}