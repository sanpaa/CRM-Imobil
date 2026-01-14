import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cta-button-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta-button-section.html',
  styleUrls: ['./cta-button-section.css']
})
export class CtaButtonSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  get title(): string {
    return this.config.title || 'Pronto para dar o proximo passo?';
  }

  get subtitle(): string {
    return this.config.subtitle || '';
  }

  get buttonText(): string {
    return this.config.buttonText || 'Agendar visita';
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

  get backgroundImage(): string {
    return this.config.backgroundImage || '';
  }

  get overlayColor(): string {
    return this.config.overlayColor || 'rgba(15, 23, 42, 0.7)';
  }

  get overlayOpacity(): number {
    return typeof this.config.overlayOpacity === 'number'
      ? this.config.overlayOpacity
      : 1;
  }

  get accentColor(): string {
    return this.config.accentColor || '';
  }

  get badgeText(): string {
    return this.config.badgeText || '';
  }

  get titleColor(): string {
    console.log(this.config);
    return this.config.titleColor || '';
  }

  get subtitleColor(): string {
    return this.config.subtitleColor || '';
  }

  get buttonTextColor(): string {
    return this.config.buttonTextColor || '';
  }

  get secondaryButtonBorder(): string {
    return this.config.secondaryButtonBorder || '';
  }

  get secondaryButtonColor(): string {
    return this.config.secondaryButtonColor || '';
  }

  get ctaStyles(): any {
    const styles: any = {
      background: this.styleConfig?.backgroundColor || '#0f172a',
      color: this.styleConfig?.textColor || '#ffffff',
      padding: this.styleConfig?.padding || '4rem 0'
    };

    if (this.backgroundImage) {
      styles['background-image'] = `url(${this.backgroundImage})`;
      styles['background-size'] = 'cover';
      styles['background-position'] = 'center';
    }

    return styles;
  }
}
