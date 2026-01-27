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
        secondaryButtonText: 'Falar no WhatsApp',
        secondaryButtonLink: 'https://wa.me/5511999999999',
        backgroundImage: '',
        eyebrow: 'Imoveis selecionados',
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
        ],
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
        eyebrow: 'Nossa historia',
        title: 'Sobre a imobiliaria',
        subtitle: 'Atendimento humano e consultoria completa.',
        content: 'Nossa equipe acompanha cada etapa da jornada, garantindo seguranca, transparencia e o melhor resultado.',
        imageUrl: '',
        highlightText: '10+ anos no mercado',
        imagePosition: 'left',
        bullets: [
          { icon: 'fas fa-user-check', title: 'Consultoria de verdade', description: 'Especialistas que entendem o seu momento.' },
          { icon: 'fas fa-map-marked-alt', title: 'Curadoria local', description: 'Conhecimento profundo de bairros e tendencias.' },
          { icon: 'fas fa-handshake', title: 'Negociacao segura', description: 'Suporte juridico e financeiro completo.' }
        ],
        buttonText: 'Agendar conversa',
        buttonLink: 'https://wa.me/5511999999999'
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
        title: 'Agende sua visita hoje',
        subtitle: 'Receba uma consultoria personalizada e visite os melhores imoveis.',
        buttonText: 'Falar no WhatsApp',
        buttonLink: 'https://wa.me/5511999999999',
        secondaryButtonText: 'Ver catalogo',
        secondaryButtonLink: '/buscar',
        badgeText: 'Atendimento rapido',
        overlayColor: 'rgba(15, 23, 42, 0.7)',
        overlayOpacity: 1,
        accentColor: '#38bdf8',
        backgroundImage: ''
      },
      defaultStyleConfig: {
        backgroundColor: '#0f172a',
        textColor: '#FFFFFF',
        padding: '4rem 0',
        borderRadius: '1rem'
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
