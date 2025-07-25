import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityConfirmDialogComponent } from './entity-confirm-dialog.component';

describe('EntityConfirmDialogComponent', () => {
  let component: EntityConfirmDialogComponent;
  let fixture: ComponentFixture<EntityConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntityConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
