import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConceptosTableComponent } from './conceptos-table.component';

describe('ConceptosTableComponent', () => {
  let component: ConceptosTableComponent;
  let fixture: ComponentFixture<ConceptosTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConceptosTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConceptosTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
