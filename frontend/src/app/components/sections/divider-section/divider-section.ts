import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-divider-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: divider-section</p></div>',
  styles: []
})
export class DividerSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
