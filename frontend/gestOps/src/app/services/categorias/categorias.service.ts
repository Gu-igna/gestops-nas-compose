import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CategoriasService {
  private readonly apiUrl = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
  ) { }

  getCategoria(id: number): Observable<Categoria> {
    const token = localStorage.getItem('token');
    return this.httpClient.get<Categoria>(`${this.apiUrl}/api/categoria/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateCategoria(id: number, categoriaData: UpdateCategoria): Observable<UpdateCategoria> {
    const token = localStorage.getItem('token');
    return this.httpClient.put<UpdateCategoria>(`${this.apiUrl}/api/categoria/${id}`, categoriaData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteCategoria(id: number): Observable<void> {
    const token = localStorage.getItem('token');
    return this.httpClient.delete<void>(`${this.apiUrl}/api/categoria/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  createCategoria(categoriaData: NewCategoria): Observable<NewCategoria> {
    const token = localStorage.getItem('token');
    return this.httpClient.post<NewCategoria>(`${this.apiUrl}/api/categorias`, categoriaData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getCategorias(page: number = 1, perPage: number = 10, searchTerm: string = ''): Observable<{
    categorias: Categoria[];
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
      categorias: Categoria[];
      total: number;
      pages: number;
      page: number;
    }>(`${this.apiUrl}/api/categorias?${params.toString()}`, {
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

export interface UpdateCategoria {
  id: number;
  nombre: string;
  id_concepto: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  concepto: Concepto;
}

export interface Concepto {
  id: number;
  nombre: string;
}

export interface NewCategoria {
  nombre: string;
  id_concepto: number;
}