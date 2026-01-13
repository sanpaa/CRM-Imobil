import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact-form-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="contact-form-section" [ngStyle]="styleConfig">
      <div class="container">
        <h2>{{ title }}</h2>
        <p>Formulário de contato será implementado em breve.</p>
      </div>
    </section>
  `,
  styles: [`
    .contact-form-section { padding: 3rem 0; }
    h2 { text-align: center; margin-bottom: 2rem; }
  `]
})
export class ContactFormSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  get title(): string { return this.config.title || 'Entre em Contato'; }
}
