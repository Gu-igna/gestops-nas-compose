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

import { AuthService } from '../../services/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-update-password',
  imports: [MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    ReactiveFormsModule, FormsModule,
  ],
  templateUrl: './update-password.component.html',
  styleUrl: './update-password.component.css'
})
export class UpdatePasswordComponent {

  passwordForm = signal(
    new FormGroup({
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required)
    })
  );

  matcher = new MyErrorStateMatcher();
  
  hideP = signal(true);
  hideNp = signal(true);

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) { }

  clickEventP(event: MouseEvent) {
    this.hideP.set(!this.hideP());
    event.stopPropagation();
  }
  
  clickEventNp(event: MouseEvent) {
    this.hideNp.set(!this.hideNp());
    event.stopPropagation();
  }

  isLoading = signal(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (!token) {
        this.router.navigate(['/']);
      }
    });
  }

  onSubmit() {
    if (this.passwordForm().valid && this.passwordForm().value.password === this.passwordForm().value.confirmPassword) {
      this.isLoading.set(true);
      const resetRequest: UpdatePasswordRequest = {
        reset_token: this.route.snapshot.queryParams['token'] || '',
        new_password: this.passwordForm().value.password!
      };
      
      this.authService.updatePassword(resetRequest).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          console.error('Error al actualizar la contraseña:', error);
          this.isLoading.set(false);
        }
      });
    }
  }

  
  goLogin() {
    this.router.navigate(['/auth/login']);
  }
}


export interface UpdatePasswordRequest {
  reset_token: string;
  new_password: string;
}