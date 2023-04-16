import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputBoxesComponent } from './inputBoxes.component';

describe('InputBoxesComponent', () => {
  let component: InputBoxesComponent;
  let fixture: ComponentFixture<InputBoxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputBoxesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
