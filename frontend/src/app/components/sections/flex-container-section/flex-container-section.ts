import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicSectionComponent } from '../../dynamic-section/dynamic-section';

@Component({
  selector: 'app-flex-container-section',
  standalone: true,
  imports: [CommonModule, DynamicSectionComponent],
  templateUrl: './flex-container-section.html',
  styleUrls: ['./flex-container-section.css']
})
export class FlexContainerSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  @Input() companyId: string | null = null;

  get containerStyles() {
    return {
      display: 'flex',
      flexDirection: this.config.direction || 'row',
      justifyContent: this.config.justifyContent || 'flex-start',
      alignItems: this.config.alignItems || 'stretch',
      flexWrap: this.config.wrap || 'nowrap',
      gap: this.config.gap || '1rem',
      padding: this.config.padding || '2rem',
      backgroundColor: this.config.backgroundColor || 'transparent',
      ...this.styleConfig
    };
  }

  get children(): any[] {
    return this.config.children || [];
  }
}
