import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-section.html',
  styleUrls: ['./faq-section.css']
})
export class FaqSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  
  openIndex: number | null = null;

  get title(): string {
    return this.config.title || 'Perguntas Frequentes';
  }

  get subtitle(): string {
    return this.config.subtitle || '';
  }

  get items(): any[] {
    return this.config.items || [];
  }

  get titleColor(): string {
    return this.config.titleColor || '#1a202c';
  }

  get subtitleColor(): string {
    return this.config.subtitleColor || '#718096';
  }

  get questionColor(): string {
    return this.config.questionColor || '#2d3748';
  }

  get answerColor(): string {
    return this.config.answerColor || '#4a5568';
  }

  get accentColor(): string {
    return this.config.accentColor || '#2c7a7b';
  }

  toggleItem(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }

  isOpen(index: number): boolean {
    return this.openIndex === index;
  }
}
