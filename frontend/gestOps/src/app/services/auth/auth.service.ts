import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  constructor(
    private httpClient: HttpClient,
    private router: Router
  ) { }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.httpClient.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('rol');
    this.router.navigateByUrl('/auth/login');
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
    return this.httpClient.post<{ message: string }>(
      `${this.apiUrl}/auth/reset-password`,
      request
    ).pipe(
      catchError(this.handleError)
    );
  }

  updatePassword(request: UpdatePasswordRequest): Observable<{ message: string }> {
    const headers: { [header: string]: string } = {};

    if (!request.reset_token) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        return throwError(() => new Error('No se encontró el token de autorización.'));
      }
    }

    return this.httpClient.post<{ message: string }>(
      `${this.apiUrl}/auth/update-password`,
      request,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  register(userData: RegisterRequest): Observable<Usuario> {
    const token = localStorage.getItem('token');
    return this.httpClient.post<Usuario>(`${this.apiUrl}/auth/register`, userData, {
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Usuario {
  id: string;
  email: string;
  rol: string;
}

export interface AuthResponse {
  access_token: string;
  usuario: Usuario;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  reset_token?: string;
  current_password?: string;
  new_password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  password?: string;
}