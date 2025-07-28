import { ChangeDetectionStrategy, Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../../services/auth/auth.service';
import { UsersService } from '../../../../services/users/users.service';
import { SnackbarService } from '../../../../services/snackbar/snackbar.service';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form-dialog',
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.css'],
  imports: [MatDialogModule, MatButtonModule, MatButtonToggleModule, MatSnackBarModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  mode: 'create' | 'update';

  isLoading = signal(false);

  userForm = signal(
    new FormGroup({
      id: new FormControl(0, { nonNullable: true }),
      nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      apellido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      rol: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    })
  );

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private snackbarService: SnackbarService
  ) {
    const data = inject(MAT_DIALOG_DATA) as { mode: 'create' | 'update', user?: User };
    this.mode = data.mode;
    if (this.mode === 'update' && data.user) {
      const { id, nombre, apellido, email, rol } = data.user;
      this.userForm.update(form => {
        form.patchValue({
          id,
          nombre,
          apellido,
          email,
          rol
        });
        return form;
      });
    }
  }

  save() {
    if (this.userForm().valid) {
      const userData = this.userForm().getRawValue();
      if (this.mode === 'create') {
        const { id, ...rest } = userData;
        const registrationData = {
          ...rest,
          password: 'password'
        };
        this.isLoading.set(true);
        this.authService.register(registrationData).subscribe({
          next: (user) => {
            this.isLoading.set(false);
            this.dialogRef.close({
              mode: this.mode,
              user: user
            });
          },
          error: (error) => {
            this.isLoading.set(false);
            if (error && (error.status === 409 || (error.message && error.message.includes('409')))) {
              this.snackbarService.showWarning('Correo electrónico ya registrado.');
              console.error('Registration failed:', error);
            }
          }
        });
      } else {
        const { id, ...updateData } = userData;
        this.isLoading.set(true);
        this.usersService.updateUser(id, updateData).subscribe({
          next: (user) => {
            this.isLoading.set(false);
            this.dialogRef.close({
              mode: this.mode,
              user: user
            });
          },
          error: (error) => {
            this.isLoading.set(false);
            console.error('Update failed:', error);
          }
        });
      }
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}

export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  password?: string;
}
