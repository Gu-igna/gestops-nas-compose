import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class EntitiesService {
  private readonly apiUrl = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
  ) { }

  getEntity(id: number): Observable<Entity> {
    const token = localStorage.getItem('token');
    return this.httpClient.get<Entity>(`${this.apiUrl}/api/persona/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateEntity(id: number, entityData: Entity): Observable<Entity> {
    const token = localStorage.getItem('token');
    return this.httpClient.put<Entity>(`${this.apiUrl}/api/persona/${id}`, entityData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteEntity(id: number): Observable<void> {
    const token = localStorage.getItem('token');
    return this.httpClient.delete<void>(`${this.apiUrl}/api/persona/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  createEntity(entityData: NewEntity): Observable<NewEntity> {
    const token = localStorage.getItem('token');
    return this.httpClient.post<NewEntity>(`${this.apiUrl}/api/personas`, entityData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getEntities(page: number = 1, perPage: number = 10, searchTerm: string = ''): Observable<{
    personas: Entity[];
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
      personas: Entity[];
      total: number;
      pages: number;
      page: number;
    }>(`${this.apiUrl}/api/personas?${params.toString()}`, {
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

export interface Entity {
  id: number;
  cuit: string;
  razon_social: string;
}

export interface NewEntity {
  cuit: string;
  razon_social: string;
}