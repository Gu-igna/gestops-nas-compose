import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class OperacionesService {
  private readonly apiUrl = environment.apiUrl;
  
  constructor(
    private httpClient: HttpClient,
  ) { }

  getOperaciones(filters?: any, page?: number, perPage?: number): Observable<OperacionesResponse> {
    const token = localStorage.getItem('token');
    let params = new HttpParams();
    
    if (page !== undefined && perPage !== undefined) {
      params = params.set('page', page.toString());
      params = params.set('per_page', perPage.toString());
    }

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.httpClient.get<OperacionesResponse>(`${this.apiUrl}/api/operaciones`, { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getOperacion(id: number): Observable<Operacion> {
    const token = localStorage.getItem('token');
    return this.httpClient.get<Operacion>(`${this.apiUrl}/api/operacion/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  createOperacion(operacion: Partial<Operacion>): Observable<Operacion> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.httpClient.post<Operacion>(`${this.apiUrl}/api/operaciones`, operacion, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateOperacion(id: number, operacion: Partial<Operacion>): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.httpClient.patch(`${this.apiUrl}/api/operacion/${id}`, operacion, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteOperacion(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    return this.httpClient.delete(`${this.apiUrl}/api/operacion/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  uploadArchivos(idOperacion: number, archivos: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    return this.httpClient.post(`${this.apiUrl}/api/operaciones/${idOperacion}/archivos`, archivos, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateArchivo(idOperacion: number, campoArchivo: string, archivo: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    return this.httpClient.patch(`${this.apiUrl}/api/operacion/${idOperacion}/archivo/${campoArchivo}`, archivo, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteArchivo(idOperacion: number, campoArchivo: string): Observable<any> {
    const token = localStorage.getItem('token');
    return this.httpClient.delete(`${this.apiUrl}/api/operacion/${idOperacion}/archivo/${campoArchivo}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  downloadArchivo(idOperacion: number, campoArchivo: string): Observable<Blob> {
    const token = localStorage.getItem('token');
    return this.httpClient.get(`${this.apiUrl}/api/operacion/${idOperacion}/archivo/${campoArchivo}`, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  downloadExcel(filters?: any): Observable<Blob> {
    const token = localStorage.getItem('token');
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.httpClient.get(`${this.apiUrl}/api/operaciones/excel`, { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  getOperacionesTotales(filters?: any): Observable<OperacionesTotales> {
    const token = localStorage.getItem('token');
    let params = new HttpParams();
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
          params = params.set(key, filters[key].toString());
        }
      });
    }

    return this.httpClient.get<OperacionesTotales>(`${this.apiUrl}/api/operaciones/totales`, { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || `Error ${error.status}: ${error.message}`;
    }
    
    console.error('Error en OperacionesService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

export interface Operacion {
  id: number;
  fecha: string;
  tipo: string;
  caracter: string;
  naturaleza: string;
  id_persona: number;
  comprobante_path?: string | null;
  option: string;
  codigo: string;
  observaciones?: string;
  metodo_de_pago: string;
  monto_total: number;
  id_subcategoria: number;
  id_usuario: number;
  archivo1_path?: string | null;
  archivo2_path?: string | null;
  archivo3_path?: string | null;
  modificado_por_otro: boolean;
  persona?: any;
  subcategoria?: any;
  usuario?: any;
}

export interface OperacionesResponse {
  operaciones: Operacion[];
  total: number;
  pages: number;
  page: number;
}

export interface OperacionBulkUpdate {
  id: number;
  [key: string]: any;
}

export interface OperacionesTotales {
  total_general: number;
  total_ingresos: number;
  total_egresos: number;
  cantidad_operaciones: number;
}