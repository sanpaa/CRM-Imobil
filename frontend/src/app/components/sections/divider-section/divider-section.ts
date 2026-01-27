import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-divider-section',
  standalone: true,
  imports: [CommonModule],
  template: '<hr [ngStyle]="getDividerStyle()" />',
  styles: []
})
export class DividerSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  getDividerStyle() {
    return {
      border: 'none',
      borderTop: `${this.config.thickness || '1px'} ${this.config.style || 'solid'} ${this.config.color || '#e0e0e0'}`,
      margin: this.styleConfig.margin || '2rem 0',
      ...this.styleConfig
    };
  }
}
