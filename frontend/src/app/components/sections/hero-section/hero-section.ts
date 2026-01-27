import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './hero-section.html',
  styleUrls: ['./hero-section.css']
})
export class HeroSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  
  searchText = '';

  constructor(private router: Router) {}

  get title(): string {
    return this.config.title || 'Encontre seu imóvel ideal';
  }

  get subtitle(): string {
    return this.config.subtitle || 'As melhores opções do mercado';
  }

  get buttonText(): string {
    return this.config.buttonText || 'Ver Imóveis';
  }

  get buttonLink(): string {
    return this.config.buttonLink || '/buscar';
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

  get showSearchBox(): boolean {
    return this.config.showSearchBox !== false;
  }

  get alignment(): string {
    return this.config.alignment || 'center';
  }

  get height(): string {
    return this.config.height || 'large';
  }

  get eyebrow(): string {
    return this.config.eyebrow || '';
  }

  get badges(): any[] {
    const items = this.config.badges || [];
    return items.map((item: any) => {
      if (typeof item === 'string') {
        return { text: item };
      }
      return item;
    });
  }

  get highlights(): any[] {
    const items = this.config.highlights || [];
    return items.map((item: any) => {
      if (typeof item === 'string') {
        return { value: item, label: '', description: '' };
      }
      return {
        value: item.value || item.label || item.text || '',
        label: item.label || item.text || '',
        description: item.description || ''
      };
    });
  }

  get overlayColor(): string {
    return this.config.overlayColor || 'rgba(15, 23, 42, 0.55)';
  }

  get overlayOpacity(): number {
    return typeof this.config.overlayOpacity === 'number'
      ? this.config.overlayOpacity
      : 1;
  }

  get primaryButtonBackground(): string {
    return this.config.primaryButtonBackground || '#ffffff';
  }

  get primaryButtonColor(): string {
    return this.config.primaryButtonColor || '#0f172a';
  }

  get secondaryButtonBorder(): string {
    return this.config.secondaryButtonBorder || 'rgba(255, 255, 255, 0.6)';
  }

  get secondaryButtonColor(): string {
    return this.config.secondaryButtonColor || '#ffffff';
  }

  get contentMaxWidth(): string {
    return this.config.contentWidth || this.config.contentMaxWidth || '720px';
  }

  get quickLinks(): any[] {
    return this.config.quickLinks || [
      { text: 'Com Quintal', tag: 'garden' },
      { text: 'Vista Panorâmica', tag: 'view' }
    ];
  }

  get heroStyles(): any {
    const styles: any = {
      color: this.styleConfig?.textColor || '#ffffff',
      padding: this.styleConfig?.padding || '4rem 0'
    };

    if (this.backgroundImage) {
      styles['background-image'] = `url(${this.backgroundImage})`;
      styles['background-size'] = 'cover';
      styles['background-position'] = 'center';
    } else {
      styles['background'] = this.styleConfig?.backgroundColor || 'var(--primary-color)';
    }

    if (this.height === 'large') {
      styles['min-height'] = '70vh';
    } else if (this.height === 'medium') {
      styles['min-height'] = '55vh';
    }

    return styles;
  }

  goToSearch(): void {
    if (!this.searchText.trim()) return;

    this.router.navigate(['/buscar'], {
      queryParams: {
        search: this.searchText.trim()
      }
    });
  }

  navigateToTag(tag: string): void {
    this.router.navigate(['/buscar'], {
      queryParams: { tag }
    });
  }
}
