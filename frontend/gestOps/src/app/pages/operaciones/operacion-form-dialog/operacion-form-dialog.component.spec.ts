import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperacionFormDialogComponent } from './operacion-form-dialog.component';

describe('OperacionFormDialogComponent', () => {
  let component: OperacionFormDialogComponent;
  let fixture: ComponentFixture<OperacionFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperacionFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperacionFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
