import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

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
    FormsModule,
  ],
  templateUrl: './subcategorias-table.component.html',
  styleUrl: './subcategorias-table.component.css'
})

export class SubcategoriasTableComponent implements OnInit, AfterViewInit {
  headerColor = 'bg-[#006e2e]/70';

  columnsToDisplay: string[] = ['concepto','categoria', 'subcategoria'];
  dataSource = new MatTableDataSource<Subcategoria>();

  totalSubcategorias = 0;
  currentPage = 1;

  filtroGlobal: string = '';
  filtroConcepto: string = '';
  filtroCategoria: string = '';
  filtroSubcategoria: string = '';

  filterColumns: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private subcategoriasService: SubcategoriasService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.filterColumns = this.columnsToDisplay.map(col => col + '-filter').concat(['actions-filter']);
    this.loadSubcategorias();
  }

  ngAfterViewInit() {
    this.paginator.page.subscribe(pageEvent => {
      this.currentPage = pageEvent.pageIndex + 1;
      this.loadSubcategorias();
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
        this.loadSubcategorias();
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
        this.loadSubcategorias();
      }
    });
  }

  applyFilter(column: string, value: string) {
    this.currentPage = 1;
    this.paginator.pageIndex = 0;

    if (column === 'global') {
        this.filtroGlobal = value;
        this.filtroConcepto = '';
        this.filtroCategoria = '';
        this.filtroSubcategoria = '';
    } else {
        this.filtroGlobal = '';
        if (column === 'concepto') {
            this.filtroConcepto = value;
        } else if (column === 'categoria') {
            this.filtroCategoria = value;
        } else if (column === 'subcategoria') {
            this.filtroSubcategoria = value;
        }
    }
    this.loadSubcategorias();
  }

  clearFilters() {
    this.filtroGlobal = '';
    this.filtroConcepto = '';
    this.filtroCategoria = '';
    this.filtroSubcategoria = '';
    this.currentPage = 1;
    this.paginator.pageIndex = 0;
    this.loadSubcategorias();
  }


  loadSubcategorias() {
    const perPage = this.paginator?.pageSize || 10;
    const filters: { [key: string]: string | number } = {};

    let searchTermForService = '';

    if (this.filtroGlobal) {
        searchTermForService = this.filtroGlobal;
    } else {
        if (this.filtroConcepto) {
            filters['concepto'] = this.filtroConcepto;
        }
        if (this.filtroCategoria) {
            filters['categoria'] = this.filtroCategoria;
        }
        if (this.filtroSubcategoria) {
            filters['subcategoria'] = this.filtroSubcategoria;
        }
    }

    this.subcategoriasService.getSubcategorias(
      this.currentPage,
      perPage,
      searchTermForService,
      filters
    ).subscribe({
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