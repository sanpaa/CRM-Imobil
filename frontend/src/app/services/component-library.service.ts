import { Injectable } from '@angular/core';
import { ComponentLibraryItem, ComponentType } from '../models/website-component.model';

@Injectable({
  providedIn: 'root'
})
export class ComponentLibraryService {

  private componentLibrary: ComponentLibraryItem[] = [
    // Navigation
    {
      type: 'header',
      name: 'Cabeçalho',
      description: 'Barra de navegação com logo e menu',
      icon: '📋',
      category: 'navigation',
      defaultConfig: {
        logoUrl: '',
        companyName: 'Minha Imobiliária',
        menuItems: ['Home', 'Imóveis', 'Sobre', 'Contato']
      },
      defaultStyleConfig: {
        backgroundColor: '#004AAD',
        textColor: '#FFFFFF',
        padding: '1rem 2rem'
      }
    },
    {
      type: 'footer',
      name: 'Rodapé',
      description: 'Rodapé com links e informações',
      icon: '🔽',
      category: 'navigation',
      defaultConfig: {
        companyName: 'Minha Imobiliária',
        address: 'Endereço da empresa',
        phone: '(11) 1234-5678',
        email: 'contato@imobiliaria.com'
      },
      defaultStyleConfig: {
        backgroundColor: '#1a1a1a',
        textColor: '#FFFFFF',
        padding: '2rem'
      }
    },
    
    // Content
    {
      type: 'hero',
      name: 'Banner Principal',
      description: 'Banner com título e call-to-action',
      icon: '🎨',
      category: 'content',
      defaultConfig: {
        title: 'Encontre seu imóvel ideal',
        subtitle: 'As melhores opções do mercado',
        buttonText: 'Ver Imóveis',
        buttonLink: '/buscar',
        backgroundImage: '',
        height: 'large',
        alignment: 'center'
      },
      defaultStyleConfig: {
        backgroundColor: '#004AAD',
        textColor: '#FFFFFF',
        padding: '4rem 2rem'
      }
    },
    {
      type: 'text-block',
      name: 'Bloco de Texto',
      description: 'Texto livre formatado',
      icon: '📝',
      category: 'content',
      defaultConfig: {
        title: 'Título',
        content: 'Conteúdo do texto aqui...',
        alignment: 'left'
      },
      defaultStyleConfig: {
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        padding: '2rem'
      }
    },
    {
      type: 'image-gallery',
      name: 'Galeria de Imagens',
      description: 'Grade de imagens',
      icon: '🖼️',
      category: 'content',
      defaultConfig: {
        images: [],
        columns: 3,
        gap: '1rem'
      },
      defaultStyleConfig: {
        backgroundColor: '#F5F5F5',
        padding: '2rem'
      }
    },
    {
      type: 'video-section',
      name: 'Seção de Vídeo',
      description: 'Vídeo incorporado',
      icon: '🎥',
      category: 'content',
      defaultConfig: {
        videoUrl: '',
        title: 'Vídeo',
        description: ''
      },
      defaultStyleConfig: {
        backgroundColor: '#FFFFFF',
        padding: '2rem'
      }
    },
    
    // Properties
    {
      type: 'property-grid',
      name: 'Grade de Imóveis',
      description: 'Lista de imóveis em grade',
      icon: '🏘️',
      category: 'properties',
      defaultConfig: {
        limit: 6,
        columns: 3,
        showFeatured: false,
        showFilters: true
      },
      defaultStyleConfig: {
        backgroundColor: '#FFFFFF',
        padding: '2rem'
      }
    },
    {
      type: 'property-card',
      name: 'Card de Imóvel',
      description: 'Card individual de imóvel',
      icon: '🏠',
      category: 'properties',
      defaultConfig: {
        propertyId: '',
        layout: 'vertical'
      },
      defaultStyleConfig: {
        backgroundColor: '#FFFFFF',
        padding: '1rem'
      }
    },
    {
      type: 'search-bar',
      name: 'Barra de Busca',
      description: 'Filtros de busca de imóveis',
      icon: '🔍',
      category: 'properties',
      defaultConfig: {
        fields: ['type', 'city', 'bedrooms', 'price'],
        layout: 'horizontal'
      },
      defaultStyleConfig: {
        backgroundColor: '#F5F5F5',
        padding: '2rem'
      }
    },
    
    // Forms
    {
      type: 'contact-form',
      name: 'Formulário de Contato',
      description: 'Formulário para contato',
      icon: '📧',
      category: 'forms',
      defaultConfig: {
        title: 'Entre em Contato',
        fields: ['name', 'email', 'phone', 'message'],
        submitButtonText: 'Enviar',
        whatsappIntegration: true
      },
      defaultStyleConfig: {
        backgroundColor: '#FFFFFF',
        padding: '2rem'
      }
    },
    
    // Layout
    {
      type: 'divider',
      name: 'Linha Divisória',
      description: 'Linha horizontal de separação',
      icon: '➖',
      category: 'layout',
      defaultConfig: {
        thickness: '1px',
        style: 'solid'
      },
      defaultStyleConfig: {
        backgroundColor: '#E0E0E0',
        margin: '2rem 0'
      }
    },
    {
      type: 'spacer',
      name: 'Espaçamento',
      description: 'Espaço vertical',
      icon: '⬜',
      category: 'layout',
      defaultConfig: {
        height: '2rem'
      },
      defaultStyleConfig: {}
    },
    
    // Special
    {
      type: 'testimonials',
      name: 'Depoimentos',
      description: 'Depoimentos de clientes',
      icon: '💬',
      category: 'special',
      defaultConfig: {
        testimonials: [],
        layout: 'carousel'
      },
      defaultStyleConfig: {
        backgroundColor: '#F5F5F5',
        padding: '3rem 2rem'
      }
    },
    {
      type: 'stats-section',
      name: 'Estatísticas',
      description: 'Números em destaque',
      icon: '📊',
      category: 'special',
      defaultConfig: {
        stats: [
          { label: 'Imóveis Disponíveis', value: '100+' },
          { label: 'Clientes Satisfeitos', value: '500+' },
          { label: 'Anos de Mercado', value: '10+' }
        ]
      },
      defaultStyleConfig: {
        backgroundColor: '#004AAD',
        textColor: '#FFFFFF',
        padding: '3rem 2rem'
      }
    },
    {
      type: 'team-section',
      name: 'Equipe',
      description: 'Membros da equipe',
      icon: '👥',
      category: 'special',
      defaultConfig: {
        title: 'Nossa Equipe',
        members: []
      },
      defaultStyleConfig: {
        backgroundColor: '#FFFFFF',
        padding: '3rem 2rem'
      }
    },
    {
      type: 'map-section',
      name: 'Mapa',
      description: 'Localização no mapa',
      icon: '🗺️',
      category: 'special',
      defaultConfig: {
        latitude: -23.5505,
        longitude: -46.6333,
        zoom: 15,
        title: 'Nossa Localização'
      },
      defaultStyleConfig: {
        backgroundColor: '#FFFFFF',
        padding: '2rem'
      }
    },
    {
      type: 'about-section',
      name: 'Sobre Nós',
      description: 'Seção sobre a empresa',
      icon: 'ℹ️',
      category: 'special',
      defaultConfig: {
        title: 'Sobre Nós',
        content: 'Descrição da empresa...',
        imageUrl: ''
      },
      defaultStyleConfig: {
        backgroundColor: '#FFFFFF',
        padding: '3rem 2rem'
      }
    },
    {
      type: 'cta-button',
      name: 'Botão de Ação',
      description: 'Botão de chamada para ação',
      icon: '🔘',
      category: 'special',
      defaultConfig: {
        text: 'Clique Aqui',
        link: '#',
        size: 'large',
        alignment: 'center'
      },
      defaultStyleConfig: {
        backgroundColor: '#FF5722',
        textColor: '#FFFFFF',
        padding: '1rem 2rem',
        borderRadius: '0.5rem'
      }
    }
  ];

  getComponentLibrary(): ComponentLibraryItem[] {
    return this.componentLibrary;
  }

  getComponentByType(type: ComponentType): ComponentLibraryItem | undefined {
    return this.componentLibrary.find(c => c.type === type);
  }

  getComponentsByCategory(category: string): ComponentLibraryItem[] {
    return this.componentLibrary.filter(c => c.category === category);
  }

  getCategories(): string[] {
    return Array.from(new Set(this.componentLibrary.map(c => c.category)));
  }
}
