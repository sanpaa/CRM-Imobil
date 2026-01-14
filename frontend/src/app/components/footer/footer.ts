import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css'],
})
export class FooterComponent {
  @Input() companyData: any;
  @Input() config: any;
  @Input() styleConfig: any;
  
  currentYear = new Date().getFullYear();
  
  ngOnInit() {
    console.log('🦶 FOOTER companyData:', this.companyData);
    console.log('🦶 FOOTER config:', this.config);
    console.log('🦶 FOOTER getFooterData("email"):', this.getFooterData('email'));
    console.log('🦶 FOOTER getFooterData("phone"):', this.getFooterData('phone'));
    console.log('🦶 FOOTER getFooterData("address"):', this.getFooterData('address'));
  }
  
  // Fallback data quando backend não retorna
  private fallbackFooterConfig: { [key: string]: string } = {
    email: 'alancarmocorretor@gmail.com',
    phone: '11943299160',
    address: 'R. Waldomiro Lyra, 35 - 35',
    whatsapp: '11943299160',
    instagram: 'https://www.instagram.com/alancarmocorretor',
    facebook: 'https://www.instagram.com/alancarmocorretor',
    companyName: 'Alan Carmo Corretor de Imoveis'
  };
  
  getFooterData(field: string): string {
    return this.config?.[field] ||
           this.companyData?.footer_config?.[field] || 
           this.companyData?.[field] ||
           '';
  }
  
  getBackgroundColor(): string {
    return this.config?.style?.backgroundColor ||
      this.config?.style_config?.backgroundColor ||
      this.styleConfig?.backgroundColor ||
      this.config?.backgroundColor ||
      this.companyData?.footer_config?.backgroundColor ||
      'var(--primary-color)';
  }
  
  getTextColor(): string {
    return this.config?.style?.textColor ||
      this.config?.style_config?.textColor ||
      this.styleConfig?.textColor ||
      this.config?.textColor ||
      this.companyData?.footer_config?.textColor ||
      '#ffffff';
  }
  
  getWhatsAppLink(): string {
    const phone = this.config?.whatsapp ||
                  this.config?.phone ||
                  this.companyData?.footer_config?.whatsapp || 
                  this.companyData?.footer_config?.phone || 
                  this.companyData?.whatsapp ||
                  this.companyData?.phone;
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  }
  
  getQuickLinks(): any[] {
    return this.config?.quickLinks ||
           this.companyData?.footer_config?.quickLinks || 
           [
             { label: 'Início', route: '/' },
             { label: 'Imóveis', route: '/buscar' }
           ];
  }
  
  getServices(): any[] {
    return this.config?.services ||
           this.companyData?.footer_config?.services || 
           [
             { label: 'Compra de Imóveis', route: '/buscar?tipo=venda' },
             { label: 'Venda de Imóveis', route: '/buscar?tipo=aluguel' }
           ];
  }

  get showLogo(): boolean {
    if (this.config?.showLogo === false) return false;
    return this.companyData?.footer_config?.showLogo !== false;
  }

  get logoUrl(): string {
    return this.config?.logoUrl ||
      this.companyData?.footer_config?.logoUrl ||
      this.companyData?.logo_url ||
      '';
  }

  get showCopyright(): boolean {
    if (this.config?.showCopyright === false) return false;
    return this.companyData?.footer_config?.showCopyright !== false;
  }
  
  isExternalLink(url: string): boolean {
    return url?.startsWith('http://') || url?.startsWith('https://');
  }
}
