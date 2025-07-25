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
import { ConceptoFormDialogComponent } from '../concepto-form-dialog/concepto-form-dialog.component';
import { ConceptoConfirmDialogComponent } from '../concepto-confirm-dialog/concepto-confirm-dialog.component';

import { ConceptosService, Concepto } from '../../../../services/conceptos/conceptos.service';

@Component({
  selector: 'app-conceptos-table',
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
  templateUrl: './conceptos-table.component.html',
  styleUrl: './conceptos-table.component.css'
})
export class ConceptosTableComponent implements AfterViewInit {
  headerColor = 'bg-[#006e2e]/70';

  columnsToDisplay: string[] = ['id', 'nombre'];
  dataSource = new MatTableDataSource<Concepto>();

  totalConceptos = 0;
  currentPage = 1;
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private conceptosService: ConceptosService,
    private dialog: MatDialog
  ) { }

  ngAfterViewInit() {
    this.paginator.page.subscribe(pageEvent => {
      this.currentPage = pageEvent.pageIndex + 1;
      this.loadConceptos(this.currentPage, this.searchTerm);
    });

    this.dataSource.sort = this.sort;
  }

  openConceptoFormDialog(mode: 'create' | 'update', concepto?: Concepto) {
    const dialogRef = this.dialog.open(ConceptoFormDialogComponent, {
      width: '400px',
      height: '220px',
      data: {
        mode: mode,
        concepto: concepto
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(`Concepto ${mode}:`, result);
        this.loadConceptos(this.currentPage, this.searchTerm);
      }
    });
  }

  openDeleteConceptoDialog(conceptoId: number) {
    const dialogRef = this.dialog.open(ConceptoConfirmDialogComponent, {
      width: '400px',
      data: { conceptoId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadConceptos(this.currentPage, this.searchTerm);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchTerm = filterValue;

    if (filterValue === '' || filterValue.length >= 1) {
      this.currentPage = 1;
      this.paginator.pageIndex = 0;
      this.loadConceptos(this.currentPage, this.searchTerm);
    }
  }

  ngOnInit() {
    this.loadConceptos();
  }

  loadConceptos(page: number = 1, searchTerm: string = '') {
    const perPage = this.paginator?.pageSize || 10;
    this.conceptosService.getConceptos(page, perPage, searchTerm).subscribe({
      next: (response) => {
        this.dataSource.data = response.conceptos;
        this.totalConceptos = response.total;

        if (this.paginator) {
          this.paginator.length = response.total;
        }
      },
      error: (err) => {
        console.error('Error al cargar conceptos', err.message);
        alert('No se pudieron cargar los conceptos. Intente nuevamente.');
      }
    });
  }
}