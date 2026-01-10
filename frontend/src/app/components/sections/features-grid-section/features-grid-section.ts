import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-features-grid-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features-grid-section.html',
  styleUrls: ['./features-grid-section.css']
})
export class FeaturesGridSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  get title(): string {
    return this.config.title || 'Por que escolher a gente?';
  }

  get subtitle(): string {
    return this.config.subtitle || '';
  }

  get features(): any[] {
    return this.config.features || [];
  }

  get titleColor(): string {
    return this.config.titleColor || '#1a202c';
  }

  get subtitleColor(): string {
    return this.config.subtitleColor || '#718096';
  }

  get iconBackground(): string {
    return this.config.iconBackground || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  get cardTitleColor(): string {
    return this.config.cardTitleColor || '#2d3748';
  }

  get cardDescriptionColor(): string {
    return this.config.cardDescriptionColor || '#718096';
  }
}
