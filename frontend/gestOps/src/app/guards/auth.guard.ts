import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  // Verificación rápida del lado del cliente para UX
  if (!token) {
    console.log('No hay token, redirigiendo al login');
    router.navigate(['/auth/login']);
    return false;
  }

  // Si el token está expirado/inválido, el interceptor manejará el 401
  return true;
};
