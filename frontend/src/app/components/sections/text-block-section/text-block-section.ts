import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-text-block-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="text-block-section" [ngStyle]="styleConfig">
      <div class="container" [ngClass]="'text-' + alignment">
        <h2 *ngIf="title" class="section-title">{{ title }}</h2>
        <div class="content" [innerHTML]="content"></div>
      </div>
    </section>
  `,
  styles: [`
    .text-block-section {
      padding: 3rem 0;
    }
    .section-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }
    .content {
      font-size: 1.1rem;
      line-height: 1.8;
      color: #555;
    }
    .text-left { text-align: left; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
  `]
})
export class TextBlockSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  get title(): string {
    return this.config.title || '';
  }

  get content(): string {
    return this.config.content || '';
  }

  get alignment(): string {
    return this.config.alignment || 'left';
  }
}
