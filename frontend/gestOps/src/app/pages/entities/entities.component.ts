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
import { EntityFormDialogComponent } from './entity-components/entity-form-dialog/entity-form-dialog.component';
import { EntityConfirmDialogComponent } from './entity-components/entity-confirm-dialog/entity-confirm-dialog.component';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { EntitiesService } from '../../services/entities/entities.service';

@Component({
  selector: 'app-entities',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    NavbarComponent
  ],
  templateUrl: './entities.component.html',
  styleUrl: './entities.component.css'
})
export class EntitiesComponent implements AfterViewInit {
  headerColor = 'bg-[#006e2e]/70';

  columnsToDisplay: string[] = ['id', 'cuit', 'razon_social'];
  dataSource = new MatTableDataSource<Entity>();

  totalEntities = 0;
  currentPage = 1;
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private entitiesService: EntitiesService,
    private dialog: MatDialog
  ) { }

  ngAfterViewInit() {
    this.paginator.page.subscribe(pageEvent => {
      this.currentPage = pageEvent.pageIndex + 1;
      this.loadEntities(this.currentPage, this.searchTerm);
    });

    this.dataSource.sort = this.sort;
  }

  openEntityFormDialog(mode: 'create' | 'update', entity?: Entity) {
    const dialogRef = this.dialog.open(EntityFormDialogComponent, {
      width: '400px',
      height: '310px',
      data: {
        mode: mode,
        entity: entity
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(`Persona ${mode}:`, result);
        this.loadEntities(this.currentPage, this.searchTerm);
      }
    });
  }

  openDeleteEntityDialog(entityId: number) {
    const dialogRef = this.dialog.open(EntityConfirmDialogComponent, {
      width: '400px',
      data: { entityId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEntities(this.currentPage, this.searchTerm);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchTerm = filterValue;
    
    if (filterValue === '' || filterValue.length >= 1) {
      this.currentPage = 1;
      this.paginator.pageIndex = 0;
      this.loadEntities(this.currentPage, this.searchTerm);
    }
  }

  ngOnInit() {
    this.loadEntities();
  }

  loadEntities(page: number = 1, searchTerm: string = '') {
    const perPage = this.paginator?.pageSize || 10;
    this.entitiesService.getEntities(page, perPage, searchTerm).subscribe({
      next: (response) => {
        this.dataSource.data = response.personas;
        this.totalEntities = response.total;
        
        if (this.paginator) {
          this.paginator.length = response.total;
        }
      },
      error: (err) => {
        console.error('Error al cargar personas:', err.message);
        alert('No se pudieron cargar las personas. Intente nuevamente.');
      }
    });
  }

}

export interface Entity {
  id: number;
  cuit: string;
  razon_social: string;
}