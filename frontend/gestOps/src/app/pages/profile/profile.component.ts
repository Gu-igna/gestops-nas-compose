import { Component, signal } from '@angular/core';
import {
  FormGroup,
  FormsModule,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule,
  NgForm,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService, User } from '../../services/users/users.service';
import { AuthService } from '../../services/auth/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar.component';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-profile',
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    ReactiveFormsModule, FormsModule, MatSlideToggleModule, MatProgressSpinnerModule,
    NavbarComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  isPasswordChangeEnabled = false;

  profileForm = signal(
    new FormGroup({
      nombre: new FormControl('', [Validators.required]),
      apellido: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      actualPassword: new FormControl({ value: '', disabled: true }, [Validators.required]),
      newPassword: new FormControl({ value: '', disabled: true }, [Validators.required]),
      confirmNewPassword: new FormControl({ value: '', disabled: true }, [Validators.required])
    })
  );

  originalValues: {
    nombre: string;
    apellido: string;
    email: string;
  } = {
      nombre: '',
      apellido: '',
      email: ''
    };

  matcher = new MyErrorStateMatcher();

  hideActualPassword = signal(true);
  hideNewPassword = signal(true);
  hideConfirmNewPassword = signal(true);
  isLoading = signal(false);
  successMessage = signal('');
  showSpinner = signal(false);

  constructor(
    private userService: UsersService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    const userId = localStorage.getItem('id');
    if (userId) {
      this.userService.getUser(Number(userId)).subscribe({
        next: (user) => {
          this.profileForm().patchValue({
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
          });
          this.originalValues = {
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
          };
        },
        error: (error) => {
          console.error('Error al obtener el usuario:', error);
        }
      });
    }
  }

  togglePasswordChange(event: any) {
    this.isPasswordChangeEnabled = event.checked;

    const actualPasswordControl = this.profileForm().get('actualPassword');
    const newPasswordControl = this.profileForm().get('newPassword');
    const confirmNewPasswordControl = this.profileForm().get('confirmNewPassword');

    if (this.isPasswordChangeEnabled) {
      actualPasswordControl?.enable();
      newPasswordControl?.enable();
      confirmNewPasswordControl?.enable();
    } else {
      actualPasswordControl?.disable();
      newPasswordControl?.disable();
      confirmNewPasswordControl?.disable();

      actualPasswordControl?.setValue('');
      newPasswordControl?.setValue('');
      confirmNewPasswordControl?.setValue('');
    }
  }

  private disablePasswordToggle() {
    this.isPasswordChangeEnabled = false;

    const actualPasswordControl = this.profileForm().get('actualPassword');
    const newPasswordControl = this.profileForm().get('newPassword');
    const confirmNewPasswordControl = this.profileForm().get('confirmNewPassword');

    actualPasswordControl?.disable();
    newPasswordControl?.disable();
    confirmNewPasswordControl?.disable();

    actualPasswordControl?.setValue('');
    newPasswordControl?.setValue('');
    confirmNewPasswordControl?.setValue('');
  }

  clickEventP(event: MouseEvent) {
    this.hideActualPassword.set(!this.hideActualPassword());
    event.stopPropagation();
  }

  clickEventNP(event: MouseEvent) {
    this.hideNewPassword.set(!this.hideNewPassword());
    event.stopPropagation();
  }

  clickEventCNP(event: MouseEvent) {
    this.hideConfirmNewPassword.set(!this.hideConfirmNewPassword());
    event.stopPropagation();
  }

  updateProfile() {
    const userId = localStorage.getItem('id');
    if (!userId) {
      console.error('No se encontró el ID del usuario en el almacenamiento local.');
      return;
    }

    this.showSpinner.set(true);
    this.successMessage.set('');

    if (this.formHasChanges() && !this.isPasswordChangeEnabled) {
      const currentValues = this.profileForm().value;
      const changes: Partial<User> = {};

      if (currentValues.nombre !== this.originalValues.nombre && currentValues.nombre !== null) {
        changes.nombre = currentValues.nombre;
      }
      if (currentValues.apellido !== this.originalValues.apellido && currentValues.apellido !== null) {
        changes.apellido = currentValues.apellido;
      }
      if (currentValues.email !== this.originalValues.email && currentValues.email !== null) {
        changes.email = currentValues.email;
      }

      if (Object.keys(changes).length > 0) {
        this.userService.updateUser(Number(userId), changes).subscribe({
          next: (response) => {
            console.log('Perfil actualizado:', response);
            this.originalValues = {
              ...this.originalValues,
              ...changes
            };

            setTimeout(() => {
              this.showSpinner.set(false);
              this.showMessage('Perfil actualizado correctamente');
            }, 1500);
          },
          error: (error) => {
            console.error('Error al actualizar el perfil:', error);

            setTimeout(() => {
              this.showSpinner.set(false);
              this.showMessage('Error al actualizar el perfil');
            }, 1500);
          }
        });
      } else {
        setTimeout(() => {
          this.showSpinner.set(false);
          this.showMessage('No hay cambios para actualizar', 'info');
        }, 1500);
      }
    }

    if (this.isPasswordChangeEnabled) {
      if (!this.passwordsMatch()) {
        this.showSpinner.set(false);
        this.showMessage('Las contraseñas no coinciden', 'error');
        return;
      }

      const updatePasswordRequest: UpdatePasswordRequest = {
        new_password: this.profileForm().get('newPassword')?.value || '',
        current_password: this.profileForm().get('actualPassword')?.value || ''
      };

      this.authService.updatePassword(updatePasswordRequest).subscribe({
        next: (response) => {
          console.log('Contraseña actualizada:', response);

          setTimeout(() => {
            this.showSpinner.set(false);
            this.showMessage('Contraseña actualizada correctamente', 'success');
            this.disablePasswordToggle();
          }, 1500);
        },
        error: (error) => {
          console.error('Error al actualizar la contraseña:', error);

          setTimeout(() => {
            this.showSpinner.set(false);
            this.showMessage('Error al actualizar la contraseña', 'error');
            this.disablePasswordToggle();
          }, 1500);
        }
      });
    }
  }

  messageType = signal<'success' | 'error' | 'info'>('info');

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.successMessage.set(message);
    this.messageType.set(type);

    setTimeout(() => {
      this.successMessage.set('');
    }, 2000);
  }
  
  getMessageClasses(): string {
    switch (this.messageType()) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  }

  formHasChanges(): boolean {
    const currentValues = this.profileForm().value;
    return (
      currentValues.nombre !== this.originalValues.nombre ||
      currentValues.apellido !== this.originalValues.apellido ||
      currentValues.email !== this.originalValues.email
    );
  }

  passwordsMatch(): boolean {
    return this.profileForm().get('newPassword')?.value === this.profileForm().get('confirmNewPassword')?.value && this.profileForm().get('newPassword')?.value !== '';
  }

  isButtonDisabled(): boolean {
    if (this.showSpinner()) {
      return true;
    }

    if (this.isPasswordChangeEnabled) {
      return !this.passwordsMatch();
    } else {
      return !this.formHasChanges();
    }
  }
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}