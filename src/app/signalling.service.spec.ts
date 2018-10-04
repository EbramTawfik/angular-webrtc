import { TestBed, inject } from '@angular/core/testing';

import { SignallingService } from './signalling.service';

describe('SignallingService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SignallingService]
    });
  });

  it('should be created', inject([SignallingService], (service: SignallingService) => {
    expect(service).toBeTruthy();
  }));
});
