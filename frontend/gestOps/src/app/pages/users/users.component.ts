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
import { UserFormDialogComponent } from './user-components/user-form-dialog/user-form-dialog.component';
import { UserConfirmDialogComponent } from './user-components/user-confirm-dialog/user-confirm-dialog.component';

import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UsersService } from '../../services/users/users.service';

@Component({
  selector: 'app-users',
  standalone: true,
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
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements AfterViewInit {
  headerColor = 'bg-[#006e2e]/70';

  columnsToDisplay: string[] = ['id', 'nombre', 'apellido', 'email', 'rol'];
  dataSource = new MatTableDataSource<User>();

  totalUsers = 0;
  currentPage = 1;
  searchTerm = '';
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private usersService: UsersService,
    private dialog: MatDialog
  ) { }

  ngAfterViewInit() {
    this.paginator.page.subscribe(pageEvent => {
      this.currentPage = pageEvent.pageIndex + 1;
      this.loadUsers(this.currentPage, this.searchTerm);
    });
    
    this.dataSource.sort = this.sort;
  }

  openUserFormDialog(mode: 'create' | 'update', user?: User) {
    const dialogRef = this.dialog.open(UserFormDialogComponent, {
      width: '400px',
      height: '380px',
      data: {
        mode: mode,
        user: user
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(`Usuario ${mode}:`, result);
        this.loadUsers(this.currentPage, this.searchTerm);
      }
    });
  }

  openDeleteUserDialog(userId: number) {
    const dialogRef = this.dialog.open(UserConfirmDialogComponent, {
      width: '400px',
      data: { userId }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(this.currentPage, this.searchTerm);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.searchTerm = filterValue;
    
    if (filterValue === '' || filterValue.length >= 1) {
      this.currentPage = 1;
      this.paginator.pageIndex = 0;
      this.loadUsers(this.currentPage, this.searchTerm);
    }
  }

  
  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(page: number = 1, searchTerm: string = '') {
    const perPage = this.paginator?.pageSize || 10;
    this.usersService.getUsers(page, perPage, searchTerm).subscribe({
      next: (response) => {
        this.dataSource.data = response.usuarios;
        this.totalUsers = response.total;
        
        if (this.paginator) {
          this.paginator.length = response.total;
        }
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err.message);
        alert('No se pudieron cargar los usuarios. Intente nuevamente.');
      }
    });
  }
}
export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}