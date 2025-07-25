import { TestBed } from '@angular/core/testing';

import { ConceptosService } from './conceptos.service';

describe('ConceptosService', () => {
  let service: ConceptosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConceptosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
