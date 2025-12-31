import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WebsiteLayout, LayoutSection } from '../models/website-layout.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class WebsiteCustomizationService {
  private apiUrl = `${environment.apiUrl}/api/website`;

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
    return this.http.get<WebsiteLayout[]>(
      `${this.apiUrl}/layouts?company_id=${companyId}`,
      { headers: this.getHeaders() }
    );
  }

  getLayout(id: string): Observable<WebsiteLayout> {
    return this.http.get<WebsiteLayout>(
      `${this.apiUrl}/layouts/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getActiveLayout(companyId: string, pageType: string): Observable<WebsiteLayout> {
    return this.http.get<WebsiteLayout>(
      `${this.apiUrl}/layouts/active?company_id=${companyId}&page_type=${pageType}`,
      { headers: this.getHeaders() }
    );
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
            menuItems: ['Home', 'Imóveis', 'Sobre', 'Contato']
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
            height: 'large',
            alignment: 'center'
          },
          style_config: {
            backgroundColor: '#004AAD',
            textColor: '#FFFFFF',
            padding: '4rem 2rem'
          },
          order: 1
        },
        {
          id: this.generateId(),
          component_type: 'property-grid',
          config: {
            limit: 6,
            columns: 3,
            showFeatured: true,
            showFilters: false
          },
          style_config: {
            backgroundColor: '#FFFFFF',
            padding: '3rem 2rem'
          },
          order: 2
        },
        {
          id: this.generateId(),
          component_type: 'contact-form',
          config: {
            title: 'Entre em Contato',
            fields: ['name', 'email', 'phone', 'message'],
            submitButtonText: 'Enviar',
            whatsappIntegration: true
          },
          style_config: {
            backgroundColor: '#F5F5F5',
            padding: '3rem 2rem'
          },
          order: 3
        },
        {
          id: this.generateId(),
          component_type: 'footer',
          config: {
            companyName: 'Minha Imobiliária',
            address: 'Endereço da empresa',
            phone: '(11) 1234-5678',
            email: 'contato@imobiliaria.com'
          },
          style_config: {
            backgroundColor: '#1a1a1a',
            textColor: '#FFFFFF',
            padding: '2rem'
          },
          order: 4
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
