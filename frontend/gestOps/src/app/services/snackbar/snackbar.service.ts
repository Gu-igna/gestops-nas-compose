import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { CustomSnackbarContentComponent, CustomSnackbarData } from '../../components/custom-snackbar-content/custom-snackbar-content.component';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  constructor(private _snackBar: MatSnackBar) { }

  openCustomSnackbar(
    message: string,
    type: 'error' | 'warning' | 'info',
    icon?: string,
    actionText?: string,
    duration: number = 5000
  ) {
    const dataToPass: CustomSnackbarData = {
      message: message,
      icon: icon,
      actionText: actionText,
      type: type
    };

    const config: MatSnackBarConfig = {
      duration: duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [`${type}-snackbar`],
      data: dataToPass
    };

    this._snackBar.openFromComponent(CustomSnackbarContentComponent, config);
  }

  // --- Métodos de Conveniencia ---
  showError(message: string, duration?: number, actionText?: string) {
    this.openCustomSnackbar(message, 'error', 'error', actionText, duration);
  }

  showWarning(message: string, duration?: number, actionText?: string) {
    this.openCustomSnackbar(message, 'warning', 'warning', actionText, duration);
  }

  showInfo(message: string, duration?: number, actionText?: string) {
    this.openCustomSnackbar(message, 'info', 'info', actionText, duration);
  }
}