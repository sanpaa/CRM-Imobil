import { Component, HostListener, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent {
  @Input() companyData: any;
  @Input() config: any;
  @Input() styleConfig: any;
  
  isMobileMenuOpen = false;
  
  getBackgroundColor(): string {
    return this.config?.style?.backgroundColor ||
      this.config?.style_config?.backgroundColor ||
      this.styleConfig?.backgroundColor ||
      this.companyData?.footer_config?.backgroundColor ||
      '#ffffff';
  }
  
  getTextColor(): string {
    const explicit =
      this.config?.style?.textColor ||
      this.config?.style_config?.textColor ||
      this.styleConfig?.textColor ||
      this.companyData?.footer_config?.textColor;

    if (explicit) {
      return explicit;
    }

    return this.getAutoTextColor(this.getBackgroundColor());
  }

  get showLogo(): boolean {
    return this.config?.showLogo !== false;
  }

  get showMenu(): boolean {
    return this.config?.showMenu !== false;
  }

  get companyName(): string {
    return this.config?.companyName || this.companyData?.name || 'Imobiliaria';
  }

  get logoUrl(): string {
    return this.config?.logoUrl ||
      this.companyData?.footer_config?.logoUrl ||
      this.companyData?.logo_url ||
      this.config?.logo ||
      '';
  }

  get navigation(): any[] {
    const items = this.config?.navigation;
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
    return [
      { label: 'Inicio', link: '/' },
      { label: 'Imoveis', link: '/buscar' },
      // { label: 'Sobre', link: '/#sobre' },
      // { label: 'Contato', link: '/#contato' }
    ];
  }

  getWhatsAppLink(): string {
    const phone =
      this.config?.phone ||
      this.companyData?.footer_config?.whatsapp ||
      this.companyData?.footer_config?.phone ||
      this.companyData?.whatsapp ||
      this.companyData?.phone ||
      '';
    const cleanPhone = (phone || '').replace(/\D/g, '');
    return cleanPhone ? `https://wa.me/${cleanPhone}` : '';
  }

  isExternalLink(url: string): boolean {
    return url?.startsWith('http://') || url?.startsWith('https://');
  }

  getRouterLink(url: string): string {
    if (!url) return '/';
    if (url.startsWith('#')) return '/';
    return url.split('#')[0] || '/';
  }

  getFragment(url: string): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('#')) return url.slice(1);
    const parts = url.split('#');
    return parts.length > 1 ? parts[1] : undefined;
  }

  toggleMobileMenu() {
    console.log(this.config);
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    console.log(this.config);
    const target = event.target as HTMLElement;
    const nav = document.getElementById('nav');
    const toggle = document.getElementById('mobileMenuToggle');
    
    if (nav && toggle && !nav.contains(target) && !toggle.contains(target)) {
      this.isMobileMenuOpen = false;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const header = document.getElementById('header');
    if (header) {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      }
    }
  }

  private getAutoTextColor(background: string): string {
    const color = this.extractColor(background);
    if (!color) {
      return '#ffffff';
    }

    const rgb = this.parseColor(color);
    if (!rgb) {
      return '#ffffff';
    }

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.6 ? '#0f172a' : '#ffffff';
  }

  private extractColor(value: string): string | null {
    if (!value) return null;
    const match = value.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/);
    return match ? match[0] : null;
  }

  private parseColor(value: string): { r: number; g: number; b: number } | null {
    if (value.startsWith('#')) {
      const hex = value.replace('#', '');
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return { r, g, b };
      }
      if (hex.length >= 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b };
      }
      return null;
    }

    if (value.startsWith('rgb')) {
      const parts = value.replace(/rgba?\(|\)/g, '').split(',');
      if (parts.length < 3) return null;
      const r = parseFloat(parts[0]);
      const g = parseFloat(parts[1]);
      const b = parseFloat(parts[2]);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
        return null;
      }
      return { r, g, b };
    }

    return null;
  }
}
