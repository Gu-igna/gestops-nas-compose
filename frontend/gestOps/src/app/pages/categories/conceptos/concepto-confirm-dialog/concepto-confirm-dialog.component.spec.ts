import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConceptoConfirmDialogComponent } from './concepto-confirm-dialog.component';

describe('ConceptoConfirmDialogComponent', () => {
  let component: ConceptoConfirmDialogComponent;
  let fixture: ComponentFixture<ConceptoConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConceptoConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConceptoConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
