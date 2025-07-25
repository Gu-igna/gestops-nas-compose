import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserConfirmDialogComponent } from './user-confirm-dialog.component';

describe('UserConfirmDialogComponent', () => {
  let component: UserConfirmDialogComponent;
  let fixture: ComponentFixture<UserConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
