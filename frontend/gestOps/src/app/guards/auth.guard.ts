import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  // Verificar si hay un token
  if (!token) {
    console.log('No hay token, redirigiendo al login');
    router.navigate(['/auth/login']);
    return false;
  }

  // Verificar si el token está expirado
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (tokenPayload.exp && tokenPayload.exp < currentTime) {
      console.log('Token expirado, redirigiendo al login');
      localStorage.removeItem('token');
      localStorage.removeItem('id');
      localStorage.removeItem('rol');
      router.navigate(['/auth/login']);
      return false;
    }
  } catch (error) {
    console.log('Error al validar token, redirigiendo al login');
    localStorage.removeItem('token');
    localStorage.removeItem('id');
    localStorage.removeItem('rol');
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};
