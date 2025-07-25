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
  selector: 'app-reset-password',
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, 
    ReactiveFormsModule, FormsModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  
  mailForm = signal(
    new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
    })
  );

  matcher = new MyErrorStateMatcher();
  hide = signal(true);

  constructor(private authService: AuthService, private router: Router) {}

  isLoading = signal(false);

  onSubmit() {
    if (this.mailForm().valid) {
      this.isLoading.set(true);
      const resetRequest: ResetPasswordRequest = {
        email: this.mailForm().value.email!
      };
      
      this.authService.resetPassword(resetRequest).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    }
  }
  
  goLogin() {
    this.router.navigate(['/auth/login']);
  }

}

export interface ResetPasswordRequest {
  email: string;
}