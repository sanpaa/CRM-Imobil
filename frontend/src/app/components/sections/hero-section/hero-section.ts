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

  get quickLinks(): any[] {
    return this.config.quickLinks || [
      { text: 'Com Quintal', tag: 'garden' },
      { text: 'Vista Panorâmica', tag: 'view' }
    ];
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
