import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spacer-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: spacer-section</p></div>',
  styles: []
})
export class SpacerSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
