import { TestBed } from '@angular/core/testing';

import { SubcategoriasService } from './subcategorias.service';

describe('SubcategoriasService', () => {
  let service: SubcategoriasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubcategoriasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
