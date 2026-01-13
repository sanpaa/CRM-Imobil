import { Component, HostListener, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  @Input() companyData: any;
  @Input() config: any;
  
  isMobileMenuOpen = false;
  
  getBackgroundColor(): string {
    return this.companyData?.footer_config?.backgroundColor || '#ffffff';
  }
  
  getTextColor(): string {
    return this.companyData?.footer_config?.textColor || '#333333';
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
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
}
