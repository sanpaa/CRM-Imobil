import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cta-button-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: cta-button-section</p></div>',
  styles: []
})
export class CtaButtonSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
