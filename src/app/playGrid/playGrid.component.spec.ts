import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayGridComponent } from './playGrid.component';

describe('CanvasComponent', () => {
  let component: PlayGridComponent;
  let fixture: ComponentFixture<PlayGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayGridComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
