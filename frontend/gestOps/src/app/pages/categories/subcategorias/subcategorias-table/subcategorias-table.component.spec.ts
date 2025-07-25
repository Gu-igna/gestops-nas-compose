import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubcategoriasTableComponent } from './subcategorias-table.component';

describe('SubcategoriasTableComponent', () => {
  let component: SubcategoriasTableComponent;
  let fixture: ComponentFixture<SubcategoriasTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubcategoriasTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubcategoriasTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
