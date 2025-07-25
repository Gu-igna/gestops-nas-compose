import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubcategoriaConfirmDialogComponent } from './subcategoria-confirm-dialog.component';

describe('SubcategoriaConfirmDialogComponent', () => {
  let component: SubcategoriaConfirmDialogComponent;
  let fixture: ComponentFixture<SubcategoriaConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubcategoriaConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubcategoriaConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
