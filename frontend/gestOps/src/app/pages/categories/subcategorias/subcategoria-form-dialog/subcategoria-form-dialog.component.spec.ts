import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubcategoriaFormDialogComponent } from './subcategoria-form-dialog.component';

describe('SubcategoriaFormDialogComponent', () => {
  let component: SubcategoriaFormDialogComponent;
  let fixture: ComponentFixture<SubcategoriaFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubcategoriaFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubcategoriaFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
