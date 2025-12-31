import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: map-section</p></div>',
  styles: []
})
export class MapSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
