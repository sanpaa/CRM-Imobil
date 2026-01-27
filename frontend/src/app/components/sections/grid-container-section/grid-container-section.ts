import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicSectionComponent } from '../../dynamic-section/dynamic-section';

@Component({
  selector: 'app-grid-container-section',
  standalone: true,
  imports: [CommonModule, DynamicSectionComponent],
  templateUrl: './grid-container-section.html',
  styleUrls: ['./grid-container-section.css']
})
export class GridContainerSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  @Input() companyId: string | null = null;

  get containerStyles() {
    return {
      display: 'grid',
      gridTemplateColumns: this.config.columns || 'repeat(auto-fit, minmax(300px, 1fr))',
      gridTemplateRows: this.config.rows || 'auto',
      gap: this.config.gap || '2rem',
      padding: this.config.padding || '2rem',
      backgroundColor: this.config.backgroundColor || 'transparent',
      ...this.styleConfig
    };
  }

  get children(): any[] {
    return this.config.children || [];
  }
}
