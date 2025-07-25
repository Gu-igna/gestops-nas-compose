import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  // Si ya está logueado, redirigir a la aplicación
  if (token) {
    try {
      // Verificar si el token es válido
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (tokenPayload.exp && tokenPayload.exp > currentTime) {
        // Token válido, redirigir a operaciones
        router.navigate(['/system/operaciones']);
        return false;
      } else {
        // Token expirado, limpiar todo y permitir acceso al login
        localStorage.removeItem('token');
        localStorage.removeItem('id');
        localStorage.removeItem('rol');
        return true;
      }
    } catch (error) {
      // Token inválido, limpiar todo y permitir acceso al login
      localStorage.removeItem('token');
      localStorage.removeItem('id');
      localStorage.removeItem('rol');
      return true;
    }
  }
  
  return true;
};
