import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FechaConfirmDialogComponent } from './fecha-confirm-dialog.component';

describe('FechaConfirmDialogComponent', () => {
  let component: FechaConfirmDialogComponent;
  let fixture: ComponentFixture<FechaConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FechaConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FechaConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
