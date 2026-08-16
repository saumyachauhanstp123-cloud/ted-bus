import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscussionBoard } from './discussion-board';

describe('DiscussionBoard', () => {
  let component: DiscussionBoard;
  let fixture: ComponentFixture<DiscussionBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscussionBoard],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscussionBoard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
