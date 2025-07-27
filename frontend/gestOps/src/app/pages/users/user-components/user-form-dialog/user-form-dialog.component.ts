import { ChangeDetectionStrategy, Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../services/auth/auth.service';
import { UsersService } from '../../../../services/users/users.service';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-form-dialog',
  templateUrl: './user-form-dialog.component.html',
  styleUrls: ['./user-form-dialog.component.css'],
  imports: [MatDialogModule, MatButtonModule, MatButtonToggleModule, MatIcon, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  mode: 'create' | 'update';

  isLoading = false;

  emailExistsError = false;

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
    private cdr: ChangeDetectorRef
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
        this.isLoading = true;
        this.cdr.detectChanges();
        this.authService.register(registrationData).subscribe({
          next: (user) => {
            this.isLoading = false;
            this.cdr.detectChanges();
            this.dialogRef.close({
              mode: this.mode,
              user: user
            });
          },
          error: (error) => {
            this.isLoading = false;
            if (error && (error.status === 409 || (error.message && error.message.includes('409')))) {
              this.emailExistsError = true;
            } else {
              this.emailExistsError = false;
            }
            this.cdr.detectChanges();
            console.error('Registration failed:', error);
          }
        });
      } else {
        const { id, ...updateData } = userData;
        this.isLoading = true;
        this.cdr.detectChanges();
        this.usersService.updateUser(id, updateData).subscribe({
          next: (user) => {
            this.isLoading = false;
            this.cdr.detectChanges();
            this.dialogRef.close({
              mode: this.mode,
              user: user
            });
          },
          error: (error) => {
            this.isLoading = false;
            this.cdr.detectChanges();
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
