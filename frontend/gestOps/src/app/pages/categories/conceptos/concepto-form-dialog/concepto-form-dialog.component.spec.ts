import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConceptoFormDialogComponent } from './concepto-form-dialog.component';

describe('ConceptoFormDialogComponent', () => {
  let component: ConceptoFormDialogComponent;
  let fixture: ComponentFixture<ConceptoFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConceptoFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConceptoFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
