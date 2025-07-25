import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { UsersService } from '../../../../services/users/users.service';

@Component({
  selector: 'app-user-confirm-dialog',
  imports: [MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-confirm-dialog.component.html',
  styleUrl: './user-confirm-dialog.component.css'
})
export class UserConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<UserConfirmDialogComponent>);
  private userId: number;

  constructor(private usersService: UsersService) {
    const data = inject(MAT_DIALOG_DATA) as {userId: number};
    this.userId = data.userId;
  }

  deleteUser() {
    this.usersService.deleteUser(this.userId).subscribe({
      next: () => {
        console.log(`Usuario ${this.userId} eliminado`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        this.dialogRef.close(false);
      }
    });
  }
}