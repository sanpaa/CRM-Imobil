import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spacer-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="getSpacerStyle()"></div>',
  styles: []
})
export class SpacerSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  getSpacerStyle() {
    return {
      height: this.config.height || '2rem',
      ...this.styleConfig
    };
  }
}
