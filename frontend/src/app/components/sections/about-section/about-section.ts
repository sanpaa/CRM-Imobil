import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: about-section</p></div>',
  styles: []
})
export class AboutSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
