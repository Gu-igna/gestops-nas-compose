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
          const badRequestMsg = error.error?.error || error.error?.message || 'Datos inválidos en la solicitud';
          snackbarService.showError(`Error en los datos: ${badRequestMsg}`);
          break;
          
        case 401:
          console.log('Error 401 - Token con problemas:', error.error?.error || 'Token inválido');
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
          console.log('Error 403 - Sin permisos para este recurso');
          const forbiddenMsg = error.error?.error || 'No tienes permisos para realizar esta acción';
          snackbarService.showWarning(forbiddenMsg);
          break;
          
        case 404:
          // No encontrado
          const notFoundMsg = error.error?.error || 'Recurso no encontrado';
          snackbarService.showError(`No encontrado: ${notFoundMsg}`);
          break;
          
        case 409:
          // Conflicto - Datos duplicados
          const conflictMsg = error.error?.error || 'Conflicto con datos existentes';
          snackbarService.showWarning(`Conflicto: ${conflictMsg}`);
          break;
          
        case 422:
          // Entidad no procesable - Errores de validación
          const validationMsg = error.error?.error || 'Error de validación';
          snackbarService.showWarning(`Validación: ${validationMsg}`);
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
          const genericMsg = error.error?.error || error.error?.message || `Error HTTP ${error.status}`;
          snackbarService.showError(`Error: ${genericMsg}`);
      }
      
      return throwError(() => error);
    })
  );
};
