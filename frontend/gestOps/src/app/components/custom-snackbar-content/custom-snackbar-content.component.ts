import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-custom-snackbar-content',
  imports: [
    MatIconModule,
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './custom-snackbar-content.component.html',
  styleUrl: './custom-snackbar-content.component.css'
})

export class CustomSnackbarContentComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: CustomSnackbarData,
    public snackBarRef: MatSnackBarRef<CustomSnackbarContentComponent>
  ) { }
}

export interface CustomSnackbarData {
  message: string;
  icon?: string;
  actionText?: string;
  type: 'error' | 'warning' | 'info';
}