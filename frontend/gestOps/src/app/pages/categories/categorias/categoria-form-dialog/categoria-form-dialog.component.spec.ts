import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaFormDialogComponent } from './categoria-form-dialog.component';

describe('CategoriaFormDialogComponent', () => {
  let component: CategoriaFormDialogComponent;
  let fixture: ComponentFixture<CategoriaFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
