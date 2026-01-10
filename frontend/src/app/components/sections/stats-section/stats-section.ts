import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="stats-section" [ngStyle]="styleConfig">
      <div class="container">
        <h2 *ngIf="title" class="section-title">{{ title }}</h2>
        <div class="stats-grid">
          <div *ngFor="let stat of stats" class="stat-item">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .stats-section {
      padding: 4rem 0;
      background: #667eea;
      color: white;
    }
    .section-title {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 3rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      text-align: center;
    }
    .stat-value {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      font-size: 1.1rem;
      opacity: 0.9;
    }
  `]
})
export class StatsSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  get title(): string {
    return this.config.title || '';
  }

  get stats(): any[] {
    return this.config.stats || [];
  }
}
