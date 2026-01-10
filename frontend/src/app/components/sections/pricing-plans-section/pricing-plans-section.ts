import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  priceLabel: string;
  priceDescription: string;
  users: number;
  additionalUserPrice: number;
  freeTrainings: number;
  activationFee: number;
  trainingPrice: number;
  isPopular: boolean;
  features: PlanFeature[];
}

interface PlanFeature {
  name: string;
  included: boolean;
  tooltip?: string;
}

@Component({
  selector: 'app-pricing-plans-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing-plans-section.html',
  styleUrls: ['./pricing-plans-section.css']
})
export class PricingPlansSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  showTooltip: { [key: string]: boolean } = {};

  get title(): string {
    return this.config.title || 'Escolha o Plano Ideal para sua Imobiliária';
  }

  get subtitle(): string {
    return this.config.subtitle || 'Planos flexíveis com recursos completos para gestão imobiliária';
  }

  get plans(): PricingPlan[] {
    if (this.config.plans && this.config.plans.length > 0) {
      return this.config.plans;
    }
    
    return [
      {
        id: 'prime',
        name: 'Prime',
        description: 'Ideal para imobiliárias iniciantes',
        basePrice: 247,
        priceLabel: 'a partir de R$ 247/mês',
        priceDescription: '*Valor equivalente à média mensal do plano Prime anual, totalizando R$ 2.964, com parcelamento em até 3x no cartão ou boleto.',
        users: 2,
        additionalUserPrice: 57,
        freeTrainings: 0,
        activationFee: 197,
        trainingPrice: 999,
        isPopular: false,
        features: [
          { name: 'Gestão de atendimentos', included: true },
          { name: 'Transferência automática de leads', included: false },
          { name: 'Aplicativo mobile', included: true },
          { name: 'Landing page integrada', included: true },
          { name: 'Treinamento online', included: false, tooltip: 'Treinamento pago: R$ 999' },
          { name: 'Blog institucional', included: false },
          { name: 'Suporte VIP', included: false },
          { name: 'Customer Success dedicado', included: false },
          { name: 'Acesso à API de imóveis', included: false },
          { name: 'Portal do Corretor', included: false }
        ]
      },
      {
        id: 'k',
        name: 'K',
        description: 'Para imobiliárias em crescimento',
        basePrice: 397,
        priceLabel: 'R$ 397/mês',
        priceDescription: 'Plano intermediário com mais recursos',
        users: 5,
        additionalUserPrice: 37,
        freeTrainings: 1,
        activationFee: 197,
        trainingPrice: 0,
        isPopular: true,
        features: [
          { name: 'Gestão de atendimentos', included: true },
          { name: 'Transferência automática de leads', included: true },
          { name: 'Aplicativo mobile', included: true },
          { name: 'Landing page integrada', included: true },
          { name: 'Treinamento online', included: true, tooltip: '1 treinamento gratuito' },
          { name: 'Blog institucional', included: true },
          { name: 'Suporte VIP', included: true },
          { name: 'Customer Success dedicado', included: false },
          { name: 'Acesso à API de imóveis', included: true },
          { name: 'Portal do Corretor', included: true }
        ]
      },
      {
        id: 'k2',
        name: 'K2',
        description: 'Completo para imobiliárias estruturadas',
        basePrice: 597,
        priceLabel: 'R$ 597/mês',
        priceDescription: 'Plano completo com todos os recursos',
        users: 12,
        additionalUserPrice: 27,
        freeTrainings: 2,
        activationFee: 0,
        trainingPrice: 0,
        isPopular: false,
        features: [
          { name: 'Gestão de atendimentos', included: true },
          { name: 'Transferência automática de leads', included: true },
          { name: 'Aplicativo mobile', included: true },
          { name: 'Landing page integrada', included: true },
          { name: 'Treinamento online', included: true, tooltip: '2 treinamentos gratuitos' },
          { name: 'Blog institucional', included: true },
          { name: 'Suporte VIP', included: true },
          { name: 'Customer Success dedicado', included: true },
          { name: 'Acesso à API de imóveis', included: true },
          { name: 'Portal do Corretor', included: true }
        ]
      }
    ];
  }

  get showComparisonTable(): boolean {
    return this.config.showComparisonTable !== false;
  }

  get ctaText(): string {
    return this.config.ctaText || 'Fale com um especialista';
  }

  get showImplementationNotice(): boolean {
    return this.config.showImplementationNotice !== false;
  }

  toggleTooltip(planId: string, featureName: string): void {
    const key = `${planId}-${featureName}`;
    this.showTooltip[key] = !this.showTooltip[key];
  }

  isTooltipVisible(planId: string, featureName: string): boolean {
    const key = `${planId}-${featureName}`;
    return this.showTooltip[key] || false;
  }

  getWhatsAppLink(): string {
    return this.config.whatsappNumber 
      ? `https://wa.me/${this.config.whatsappNumber}?text=Olá! Gostaria de saber mais sobre os planos do CRM`
      : 'https://wa.me/5535997383030?text=Olá! Gostaria de saber mais sobre os planos do CRM';
  }
}
