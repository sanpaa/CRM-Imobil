import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-section.html',
  styleUrls: ['./stats-section.css']
})
export class StatsSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  get title(): string {
    return this.config.title || '';
  }

  get subtitle(): string {
    return this.config.subtitle || '';
  }

  get stats(): any[] {
    return this.config.stats || [];
  }

  get accentColor(): string {
    return this.config.accentColor || '';
  }

  get badgeText(): string {
    return this.config.badgeText || '';
  }
}
