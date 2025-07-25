import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ConceptosService {
  private readonly apiUrl = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
  ) { }

  getConcepto(id: number): Observable<Concepto> {
    const token = localStorage.getItem('token');
    return this.httpClient.get<Concepto>(`${this.apiUrl}/api/concepto/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateConcepto(id: number, conceptoData: Concepto): Observable<Concepto> {
    const token = localStorage.getItem('token');
    return this.httpClient.put<Concepto>(`${this.apiUrl}/api/concepto/${id}`, conceptoData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteConcepto(id: number): Observable<void> {
    const token = localStorage.getItem('token');
    return this.httpClient.delete<void>(`${this.apiUrl}/api/concepto/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  createConcepto(conceptoData: NewConcepto): Observable<NewConcepto> {
    const token = localStorage.getItem('token');
    return this.httpClient.post<NewConcepto>(`${this.apiUrl}/api/conceptos`, conceptoData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getConceptos(page: number = 1, perPage: number = 10, searchTerm: string = ''): Observable<{
    conceptos: Concepto[];
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
      conceptos: Concepto[];
      total: number;
      pages: number;
      page: number;
    }>(`${this.apiUrl}/api/conceptos?${params.toString()}`, {
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

export interface Concepto {
  id: number;
  nombre: string;
}

export interface NewConcepto {
  nombre: string;
}