import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SnackbarService } from '../services/snackbar/snackbar.service';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackbarService = inject(SnackbarService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);
      
      // Manejar errores específicos por código de estado
      switch (error.status) {
        case 0:
          snackbarService.showError('Sin conexión al servidor. Verifica tu conexión a internet.');
          break;
          
        case 400:
          snackbarService.showError('Datos inválidos en la solicitud');
          break;
          
        case 401:
          snackbarService.showWarning('Sesión expirada. Iniciando sesión nuevamente.');
          
          // Limpiar datos de autenticación
          localStorage.removeItem('token');
          localStorage.removeItem('id');
          localStorage.removeItem('rol');
          localStorage.removeItem('email');
          
          router.navigate(['/auth/login']);
          break;
          
        case 403:
          // Prohibido - Sin permisos
          snackbarService.showWarning('No tienes permisos para realizar esta acción');
          break;
          
        case 404:
          // No encontrado
          snackbarService.showError('Recurso no encontrado');
          break;
          
        case 409:
          // Conflicto - Datos duplicados
          snackbarService.showWarning('Conflicto con datos existentes');
          break;
          
        case 422:
          // Entidad no procesable - Errores de validación
          snackbarService.showWarning('Error de validación');
          break;
          
        case 500:
          // Error interno del servidor
          snackbarService.showError('Error interno del servidor. Inténtalo más tarde.');
          break;
          
        case 502:
          // Bad Gateway
          snackbarService.showError('Servidor no disponible. Inténtalo más tarde.');
          break;
          
        case 503:
          // Servicio no disponible
          snackbarService.showError('Servicio temporalmente no disponible.');
          break;
          
        default:
          // Otros errores
          snackbarService.showError(`Error HTTP ${error.status}`);
      }
      
      return throwError(() => error);
    })
  );
};
