import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaConfirmDialogComponent } from './categoria-confirm-dialog.component';

describe('CategoriaConfirmDialogComponent', () => {
  let component: CategoriaConfirmDialogComponent;
  let fixture: ComponentFixture<CategoriaConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
