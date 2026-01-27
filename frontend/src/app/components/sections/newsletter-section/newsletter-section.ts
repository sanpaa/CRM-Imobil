import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter-section.html',
  styleUrls: ['./newsletter-section.css']
})
export class NewsletterSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  
  email = '';
  subscribed = false;

  get title(): string {
    return this.config.title || 'Fique por dentro das novidades';
  }

  get subtitle(): string {
    return this.config.subtitle || 'Receba lançamentos e oportunidades exclusivas no seu email';
  }

  get buttonText(): string {
    return this.config.buttonText || 'Assinar Newsletter';
  }

  get titleColor(): string {
    return this.config.titleColor || 'white';
  }

  get subtitleColor(): string {
    return this.config.subtitleColor || 'white';
  }

  get buttonBackground(): string {
    return this.config.buttonBackground || 'white';
  }

  get buttonColor(): string {
    return this.config.buttonColor || '#667eea';
  }

  get inputPlaceholder(): string {
    return this.config.inputPlaceholder || 'Seu melhor email';
  }

  subscribe(): void {
    if (this.email && this.email.includes('@')) {
      // TODO: Implementar integração com API
      console.log('Subscribing:', this.email);
      this.subscribed = true;
      setTimeout(() => {
        this.subscribed = false;
        this.email = '';
      }, 3000);
    }
  }
}
