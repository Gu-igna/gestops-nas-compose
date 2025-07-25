import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
  ) { }

  getUser(id: number): Observable<User> {
    const token = localStorage.getItem('token');
    return this.httpClient.get<User>(`${this.apiUrl}/api/usuario/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    if ('password' in userData) {
      return throwError(() => new Error('No se puede modificar la contraseña usando este endpoint'));
    }
    const token = localStorage.getItem('token');
    return this.httpClient.patch<User>(`${this.apiUrl}/api/usuario/${id}`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<void> {
    const token = localStorage.getItem('token');
    return this.httpClient.delete<void>(`${this.apiUrl}/api/usuario/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getUsers(page: number = 1, perPage: number = 10, searchTerm: string = ''): Observable<{
    usuarios: User[];
    total: number;
    pages: number;
    page: number;
  }> {
    const token = localStorage.getItem('token');
    let params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
  
    if (searchTerm) {
      params.append('busqueda', searchTerm);
    }
  
    return this.httpClient.get<{
      usuarios: User[];
      total: number;
      pages: number;
      page: number;
    }>(`${this.apiUrl}/api/usuarios?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error en la solicitud';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error del servidor: ${error.status} - ${error.error?.message || error.statusText}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

}

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}