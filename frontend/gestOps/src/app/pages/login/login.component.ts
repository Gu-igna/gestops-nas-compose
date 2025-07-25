import {Component, signal} from '@angular/core';
import {
  FormGroup,
  FormsModule,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule,
  NgForm,
  Validators,
} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

import { AuthService } from '../../services/auth/auth.service';
import {Router} from '@angular/router';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, 
    ReactiveFormsModule, FormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {
  loginForm = signal(
    new FormGroup({
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    })
  );

  matcher = new MyErrorStateMatcher();
  hide = signal(true);

  loginError = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
  

  onSubmit(): void {
    if (this.loginForm().valid) {
      const credentials: LoginCredentials = {
        email: this.loginForm().value.email!,
        password: this.loginForm().value.password!
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          localStorage.setItem('token', response.access_token);
          localStorage.setItem('id', response.usuario.id);
          localStorage.setItem('rol', response.usuario.rol);
          this.router.navigate(['/system/operaciones']);
          console.log('Login exitoso:', response);
        },
        error: (err) => {
          this.loginError.set('No se pudo iniciar sesión');
          console.error('Error en login:', err);
        },
      });
    } else {
      this.loginError.set('Formulario inválido');
      console.error('Formulario inválido');
    }
  }

  resetpassword() {
    this.router.navigateByUrl('auth/reset-password');
  }
}

export interface LoginCredentials {
  email: string;
  password: string;
}