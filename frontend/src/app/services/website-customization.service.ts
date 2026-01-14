import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { WebsiteLayout, LayoutSection } from '../models/website-layout.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class WebsiteCustomizationService {
  private apiUrl = `${environment.apiUrl}/api/website`;
  private activeLayoutCache = new Map<string, Observable<WebsiteLayout>>();
  private activeLayoutValue = new Map<string, WebsiteLayout>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Layout operations
  getLayouts(companyId: string): Observable<WebsiteLayout[]> {
    // Public endpoint - no auth required for viewing layouts
    return this.http.get<WebsiteLayout[]>(
      `${this.apiUrl}/layouts?company_id=${companyId}`
    );
  }

  getLayout(id: string): Observable<WebsiteLayout> {
    return this.http.get<WebsiteLayout>(
      `${this.apiUrl}/layouts/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getActiveLayout(companyId: string, pageType: string): Observable<WebsiteLayout> {
    // Public endpoint - no auth required for viewing active layouts
    return this.http.get<WebsiteLayout>(
      `${this.apiUrl}/layouts/active?company_id=${companyId}&page_type=${pageType}`
    );
  }

  getActiveLayoutCached(companyId: string, pageType: string): Observable<WebsiteLayout> {
    const cacheKey = `${companyId}:${pageType}`;
    const cached = this.activeLayoutCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request$ = this.getActiveLayout(companyId, pageType).pipe(
      tap(layout => this.activeLayoutValue.set(cacheKey, layout)),
      shareReplay(1)
    );

    this.activeLayoutCache.set(cacheKey, request$);
    return request$;
  }

  getActiveLayoutValue(companyId: string, pageType: string): WebsiteLayout | null {
    const cacheKey = `${companyId}:${pageType}`;
    return this.activeLayoutValue.get(cacheKey) || null;
  }

  createLayout(layout: Partial<WebsiteLayout>): Observable<WebsiteLayout> {
    return this.http.post<WebsiteLayout>(
      `${this.apiUrl}/layouts`,
      layout,
      { headers: this.getHeaders() }
    );
  }

  updateLayout(id: string, layout: Partial<WebsiteLayout>): Observable<WebsiteLayout> {
    return this.http.put<WebsiteLayout>(
      `${this.apiUrl}/layouts/${id}`,
      layout,
      { headers: this.getHeaders() }
    );
  }

  deleteLayout(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/layouts/${id}`,
      { headers: this.getHeaders() }
    );
  }

  publishLayout(id: string): Observable<WebsiteLayout> {
    return this.http.post<WebsiteLayout>(
      `${this.apiUrl}/layouts/${id}/publish`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Section operations
  addSection(layoutId: string, section: LayoutSection): Observable<WebsiteLayout> {
    return this.http.post<WebsiteLayout>(
      `${this.apiUrl}/layouts/${layoutId}/sections`,
      section,
      { headers: this.getHeaders() }
    );
  }

  updateSection(layoutId: string, sectionId: string, section: Partial<LayoutSection>): Observable<WebsiteLayout> {
    return this.http.put<WebsiteLayout>(
      `${this.apiUrl}/layouts/${layoutId}/sections/${sectionId}`,
      section,
      { headers: this.getHeaders() }
    );
  }

  deleteSection(layoutId: string, sectionId: string): Observable<WebsiteLayout> {
    return this.http.delete<WebsiteLayout>(
      `${this.apiUrl}/layouts/${layoutId}/sections/${sectionId}`,
      { headers: this.getHeaders() }
    );
  }

  reorderSections(layoutId: string, sectionIds: string[]): Observable<WebsiteLayout> {
    return this.http.put<WebsiteLayout>(
      `${this.apiUrl}/layouts/${layoutId}/sections/reorder`,
      { sectionIds },
      { headers: this.getHeaders() }
    );
  }

  // Template operations
  getDefaultTemplate(pageType: string): LayoutSection[] {
    const templates: { [key: string]: LayoutSection[] } = {
      home: [
        {
          id: this.generateId(),
          component_type: 'header',
          config: {
            logoUrl: '',
            companyName: 'Minha Imobiliária',
            showLogo: true,
            showMenu: true,
            navigation: [
              { label: 'Inicio', link: '/' },
              { label: 'Imoveis', link: '/buscar' },
              { label: 'Sobre', link: '/#sobre' },
              { label: 'Contato', link: '/#contato' }
            ],
            phone: '5511999999999'
          },
          style_config: {
            backgroundColor: '#004AAD',
            textColor: '#FFFFFF',
            padding: '1rem 2rem'
          },
          order: 0
        },
        {
          id: this.generateId(),
          component_type: 'hero',
          config: {
            title: 'Encontre seu imóvel ideal',
            subtitle: 'As melhores opções do mercado',
            buttonText: 'Ver Imóveis',
            buttonLink: '/buscar',
            secondaryButtonText: 'Falar no WhatsApp',
            secondaryButtonLink: 'https://wa.me/5511999999999',
            height: 'large',
            alignment: 'center',
            overlayColor: 'rgba(15, 23, 42, 0.55)',
            overlayOpacity: 1,
            badges: [
              { text: 'Consultoria premium' },
              { text: 'Atendimento personalizado' }
            ],
            highlights: [
              { value: '250+', label: 'Imoveis ativos', description: 'Curadoria semanal' },
              { value: '98%', label: 'Satisfacao', description: 'Atendimento humanizado' },
              { value: '15 anos', label: 'Experiencia', description: 'Equipe especialista' }
            ]
          },
          style_config: {
            backgroundColor: 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
            textColor: '#FFFFFF',
            padding: '4rem 2rem'
          },
          order: 1
        },
        {
          id: this.generateId(),
          component_type: 'stats-section',
          config: {
            title: 'Resultados que geram confianca',
            subtitle: 'Numeros que comprovam nosso cuidado em cada negociacao.',
            badgeText: 'Prova social',
            accentColor: '#38bdf8',
            stats: [
              { label: 'Imoveis Disponiveis', value: '180+', description: 'Novas oportunidades toda semana' },
              { label: 'Clientes Atendidos', value: '1.200+', description: 'Acompanhamento do inicio ao fim' },
              { label: 'Taxa de Fechamento', value: '92%', description: 'Alto nivel de satisfacao' }
            ]
          },
          style_config: {
            backgroundColor: '#0f172a',
            textColor: '#FFFFFF',
            padding: '4rem 2rem'
          },
          order: 2
        },
        {
          id: this.generateId(),
          component_type: 'property-grid',
          config: {
            title: 'Vitrine em destaque',
            limit: 6,
            columns: 3,
            showFeatured: true,
            showFilters: false
          },
          style_config: {
            backgroundColor: '#FFFFFF',
            padding: '3rem 2rem'
          },
          order: 3
        },
        {
          id: this.generateId(),
          component_type: 'about-section',
          config: {
            eyebrow: 'Nossa historia',
            title: 'Sobre a imobiliaria',
            subtitle: 'Atendimento humano e consultoria completa.',
            content: 'Nossa equipe acompanha cada etapa da jornada, garantindo seguranca, transparencia e o melhor resultado.',
            imageUrl: '',
            highlightText: '10+ anos no mercado',
            bullets: [
              { icon: 'fas fa-user-check', title: 'Consultoria de verdade', description: 'Especialistas que entendem o seu momento.' },
              { icon: 'fas fa-map-marked-alt', title: 'Curadoria local', description: 'Conhecimento profundo de bairros e tendencias.' },
              { icon: 'fas fa-handshake', title: 'Negociacao segura', description: 'Suporte juridico e financeiro completo.' }
            ],
            buttonText: 'Agendar conversa',
            buttonLink: 'https://wa.me/5511999999999'
          },
          style_config: {
            backgroundColor: '#FFFFFF',
            padding: '3rem 2rem'
          },
          order: 4
        },
        {
          id: this.generateId(),
          component_type: 'features-grid',
          config: {
            title: 'Por que escolher a gente?',
            subtitle: 'Experiencia completa para comprar ou vender.',
            features: [
              { icon: 'fas fa-shield-alt', title: 'Seguranca Total', description: 'Transacoes seguras e acompanhamento do inicio ao fim' },
              { icon: 'fas fa-clock', title: 'Atendimento Agil', description: 'Retorno rapido e suporte em todas as etapas' },
              { icon: 'fas fa-star', title: 'Avaliacao Gratuita', description: 'Estimativa profissional sem custo' },
              { icon: 'fas fa-handshake', title: 'Consultoria Especializada', description: 'Corretores experientes e qualificados' }
            ]
          },
          style_config: {
            backgroundColor: '#F8FAFC',
            padding: '3rem 2rem'
          },
          order: 5
        },
        {
          id: this.generateId(),
          component_type: 'faq',
          config: {
            title: 'Perguntas Frequentes',
            subtitle: 'Tire suas duvidas sobre nossos servicos',
            items: [
              { question: 'Como funciona o processo de compra?', answer: 'Ajudamos desde a escolha do imovel ate a assinatura do contrato.' },
              { question: 'Quais documentos sao necessarios?', answer: 'Documentos pessoais, comprovante de renda e outros conforme o tipo de negociacao.' },
              { question: 'Oferecem consultoria de financiamento?', answer: 'Sim, simulamos condicoes e orientamos na melhor opcao.' }
            ]
          },
          style_config: {
            backgroundColor: '#FFFFFF',
            padding: '3rem 2rem'
          },
          order: 6
        },
        {
          id: this.generateId(),
          component_type: 'cta-button',
          config: {
            title: 'Agende sua visita hoje',
            subtitle: 'Receba uma consultoria personalizada e visite os melhores imoveis.',
            buttonText: 'Falar no WhatsApp',
            buttonLink: 'https://wa.me/5511999999999',
            secondaryButtonText: 'Ver catalogo',
            secondaryButtonLink: '/buscar',
            badgeText: 'Atendimento rapido',
            overlayColor: 'rgba(15, 23, 42, 0.7)',
            overlayOpacity: 1,
            accentColor: '#38bdf8'
          },
          style_config: {
            backgroundColor: '#0f172a',
            textColor: '#FFFFFF',
            padding: '4rem 2rem'
          },
          order: 7
        },
        {
          id: this.generateId(),
          component_type: 'footer',
          config: {
            companyName: 'Minha Imobiliária',
            address: 'Endereço da empresa',
            phone: '(11) 1234-5678',
            email: 'contato@imobiliaria.com',
            description: 'Especialistas em compra e venda de imoveis.',
            showLogo: true,
            showCopyright: true,
            logoUrl: '',
            instagram: '',
            facebook: '',
            whatsapp: '',
            quickLinks: [
              { label: 'Inicio', route: '/' },
              { label: 'Imoveis', route: '/buscar' }
            ],
            services: [
              { label: 'Compra de Imoveis', route: '/buscar?tipo=venda' },
              { label: 'Venda de Imoveis', route: '/buscar?tipo=aluguel' }
            ]
          },
          style_config: {
            backgroundColor: '#1a1a1a',
            textColor: '#FFFFFF',
            padding: '2rem'
          },
          order: 8
        }
      ],
      properties: [
        {
          id: this.generateId(),
          component_type: 'header',
          config: {},
          style_config: {},
          order: 0
        },
        {
          id: this.generateId(),
          component_type: 'search-bar',
          config: {
            fields: ['type', 'city', 'bedrooms', 'price'],
            layout: 'horizontal'
          },
          style_config: {},
          order: 1
        },
        {
          id: this.generateId(),
          component_type: 'property-grid',
          config: {
            limit: 12,
            columns: 3,
            showFeatured: false,
            showFilters: true
          },
          style_config: {},
          order: 2
        },
        {
          id: this.generateId(),
          component_type: 'footer',
          config: {},
          style_config: {},
          order: 3
        }
      ],
      contact: [
        {
          id: this.generateId(),
          component_type: 'header',
          config: {},
          style_config: {},
          order: 0
        },
        {
          id: this.generateId(),
          component_type: 'contact-form',
          config: {
            title: 'Entre em Contato',
            fields: ['name', 'email', 'phone', 'message'],
            submitButtonText: 'Enviar'
          },
          style_config: {},
          order: 1
        },
        {
          id: this.generateId(),
          component_type: 'map-section',
          config: {
            latitude: -23.5505,
            longitude: -46.6333,
            zoom: 15
          },
          style_config: {},
          order: 2
        },
        {
          id: this.generateId(),
          component_type: 'footer',
          config: {},
          style_config: {},
          order: 3
        }
      ]
    };

    return templates[pageType] || [];
  }

  private generateId(): string {
    return `section-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
