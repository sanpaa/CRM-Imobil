import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-testimonials-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: testimonials-section</p></div>',
  styles: []
})
export class TestimonialsSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
