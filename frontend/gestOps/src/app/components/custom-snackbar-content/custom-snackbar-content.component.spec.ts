import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSnackbarContentComponent } from './custom-snackbar-content.component';

describe('CustomSnackbarContentComponent', () => {
  let component: CustomSnackbarContentComponent;
  let fixture: ComponentFixture<CustomSnackbarContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomSnackbarContentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomSnackbarContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
