import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SubcategoriasService {
  private readonly apiUrl = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
  ) { }

  getSubcategoria(id: number): Observable<Subcategoria> {
    const token = localStorage.getItem('token');
    return this.httpClient.get<Subcategoria>(`${this.apiUrl}/api/subcategoria/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateSubcategoria(id: number, subcategoriaData: Subcategoria): Observable<Subcategoria> {
    const token = localStorage.getItem('token');
    return this.httpClient.put<Subcategoria>(`${this.apiUrl}/api/subcategoria/${id}`, subcategoriaData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteSubcategoria(id: number): Observable<void> {
    const token = localStorage.getItem('token');
    return this.httpClient.delete<void>(`${this.apiUrl}/api/subcategoria/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  createSubcategoria(subcategoriaData: NewSubcategoria): Observable<NewSubcategoria> {
    const token = localStorage.getItem('token');
    return this.httpClient.post<NewSubcategoria>(`${this.apiUrl}/api/subcategorias`, subcategoriaData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getSubcategorias(
    page: number = 1,
    perPage: number = 10,
    searchTerm: string = '',
    filters: { [key: string]: string | number } = {}
  ): Observable<{
    subcategorias: Subcategoria[];
    total: number;
    pages: number;
    page: number;
  }> {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });

    if (searchTerm) {
      params.append('busqueda', searchTerm);
    }

    // Add combined filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.httpClient.get<{
      subcategorias: Subcategoria[];
      total: number;
      pages: number;
      page: number;
    }>(`${this.apiUrl}/api/subcategorias?${params.toString()}`, {
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

export interface Subcategoria {
  id: number;
  nombre: string;
  categoria: Categoria;
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

export interface NewSubcategoria {
  nombre: string;
  id_categoria: number;
}