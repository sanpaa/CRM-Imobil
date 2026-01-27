import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-section.html',
  styleUrls: ['./about-section.css']
})
export class AboutSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  get title(): string {
    return this.config.title || 'Sobre a imobiliaria';
  }

  get subtitle(): string {
    return this.config.subtitle || '';
  }

  get content(): string {
    return this.config.content || '';
  }

  get imageUrl(): string {
    return this.config.imageUrl || '';
  }

  get imageAlt(): string {
    return this.config.imageAlt || 'Foto do corretor';
  }

  get eyebrow(): string {
    return this.config.eyebrow || '';
  }

  get bullets(): any[] {
    return this.config.bullets || [];
  }

  get buttonText(): string {
    return this.config.buttonText || '';
  }

  get buttonLink(): string {
    return this.config.buttonLink || '';
  }

  get secondaryButtonText(): string {
    return this.config.secondaryButtonText || '';
  }

  get secondaryButtonLink(): string {
    return this.config.secondaryButtonLink || '';
  }

  get imagePosition(): string {
    return this.config.imagePosition || 'left';
  }

  get highlightText(): string {
    return this.config.highlightText || '';
  }

  get titleColor(): string {
    return this.config.titleColor || '';
  }

  get subtitleColor(): string {
    return this.config.subtitleColor || '';
  }

  get textColor(): string {
    return this.config.textColor || '';
  }

  get accentColor(): string {
    return this.config.accentColor || '';
  }

  get bulletBackground(): string {
    return this.config.bulletBackground || '';
  }

  get bulletBorderColor(): string {
    return this.config.bulletBorderColor || '';
  }

  get primaryButtonBackground(): string {
    return this.config.primaryButtonBackground || '';
  }

  get primaryButtonColor(): string {
    return this.config.primaryButtonColor || '';
  }

  get secondaryButtonBorder(): string {
    return this.config.secondaryButtonBorder || '';
  }

  get secondaryButtonColor(): string {
    return this.config.secondaryButtonColor || '';
  }
}
