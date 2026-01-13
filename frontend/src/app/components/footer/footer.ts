import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {
  @Input() companyData: any;
  @Input() config: any;
  
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
    // Tentar primeiro footer_config, depois config, depois companyData direto
    return this.companyData?.footer_config?.[field] || 
           this.config?.[field] || 
           this.companyData?.[field] ||
           '';
  }
  
  getBackgroundColor(): string {
    return this.companyData?.footer_config?.backgroundColor || 'var(--primary-color)';
  }
  
  getTextColor(): string {
    return this.companyData?.footer_config?.textColor || '#ffffff';
  }
  
  getWhatsAppLink(): string {
    const phone = this.companyData?.footer_config?.whatsapp || 
                  this.companyData?.footer_config?.phone || 
                  this.companyData?.whatsapp ||
                  this.companyData?.phone || 
                  this.config?.phone;
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}`;
  }
  
  getQuickLinks(): any[] {
    return this.companyData?.footer_config?.quickLinks || 
           this.config?.quickLinks || 
           [
             { label: 'Início', route: '/' },
             { label: 'Imóveis', route: '/buscar' }
           ];
  }
  
  getServices(): any[] {
    return this.companyData?.footer_config?.services || 
           this.config?.services || 
           [
             { label: 'Compra de Imóveis', route: '/buscar?tipo=venda' },
             { label: 'Venda de Imóveis', route: '/buscar?tipo=aluguel' }
           ];
  }
  
  isExternalLink(url: string): boolean {
    return url?.startsWith('http://') || url?.startsWith('https://');
  }
}
