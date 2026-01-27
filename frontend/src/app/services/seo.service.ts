import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { DomainDetectionService, PageConfig } from './domain-detection.service';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private isBrowser: boolean;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private domainService: DomainDetectionService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Update page title
   */
  setTitle(title: string): void {
    if (this.isBrowser) {
      this.titleService.setTitle(title);
    }
  }

  /**
   * Update meta description
   */
  setDescription(description: string): void {
    if (this.isBrowser) {
      this.metaService.updateTag({ name: 'description', content: description });
      this.metaService.updateTag({ property: 'og:description', content: description });
    }
  }

  /**
   * Update meta keywords
   */
  setKeywords(keywords: string): void {
    if (this.isBrowser) {
      this.metaService.updateTag({ name: 'keywords', content: keywords });
    }
  }

  /**
   * Update Open Graph tags
   */
  setOpenGraph(config: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  }): void {
    if (!this.isBrowser) return;

    if (config.title) {
      this.metaService.updateTag({ property: 'og:title', content: config.title });
    }
    if (config.description) {
      this.metaService.updateTag({ property: 'og:description', content: config.description });
    }
    if (config.image) {
      this.metaService.updateTag({ property: 'og:image', content: config.image });
    }
    if (config.url) {
      this.metaService.updateTag({ property: 'og:url', content: config.url });
    }
    if (config.type) {
      this.metaService.updateTag({ property: 'og:type', content: config.type });
    }
  }

  /**
   * Update Twitter Card tags
   */
  setTwitterCard(config: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  }): void {
    if (!this.isBrowser) return;

    if (config.card) {
      this.metaService.updateTag({ name: 'twitter:card', content: config.card });
    }
    if (config.title) {
      this.metaService.updateTag({ name: 'twitter:title', content: config.title });
    }
    if (config.description) {
      this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    }
    if (config.image) {
      this.metaService.updateTag({ name: 'twitter:image', content: config.image });
    }
  }

  /**
   * Update favicon
   */
  setFavicon(iconUrl: string): void {
    if (!this.isBrowser) return;

    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = iconUrl;
    
    if (!document.querySelector("link[rel*='icon']")) {
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }

  /**
   * Update all SEO tags based on company config
   */
  updateCompanySeo(): void {
    const config = this.domainService.getSiteConfigValue();
    if (!config) return;

    const company = config.company;
    const visualConfig = config.visualConfig;

    // Set company name as default title
    const defaultTitle = `${company.name}${visualConfig.branding?.tagline ? ' - ' + visualConfig.branding.tagline : ''}`;
    this.setTitle(defaultTitle);

    // Set company description
    if (company.description) {
      this.setDescription(company.description);
    }

    // Set Open Graph
    this.setOpenGraph({
      title: defaultTitle,
      description: company.description || '',
      image: visualConfig.branding?.logo || company.logo_url || '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      type: 'website'
    });

    // Set Twitter Card
    this.setTwitterCard({
      card: 'summary_large_image',
      title: defaultTitle,
      description: company.description || '',
      image: visualConfig.branding?.logo || company.logo_url || ''
    });

    // Set favicon
    if (visualConfig.branding?.logo || company.logo_url) {
      this.setFavicon(visualConfig.branding?.logo || company.logo_url || '');
    }
  }

  /**
   * Update SEO tags based on page config
   */
  updatePageSeo(page: PageConfig): void {
    const config = this.domainService.getSiteConfigValue();
    if (!config) return;

    const company = config.company;
    const pageMeta = page.meta;

    // Page title with company name
    const pageTitle = pageMeta.title 
      ? `${pageMeta.title} - ${company.name}`
      : `${page.name} - ${company.name}`;
    
    this.setTitle(pageTitle);

    // Page description
    if (pageMeta.description) {
      this.setDescription(pageMeta.description);
    }

    // Page keywords
    if (pageMeta.keywords) {
      this.setKeywords(pageMeta.keywords);
    }

    // Update Open Graph
    this.setOpenGraph({
      title: pageTitle,
      description: pageMeta.description || company.description || '',
      image: config.visualConfig.branding?.logo || company.logo_url || '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      type: 'website'
    });

    // Update Twitter Card
    this.setTwitterCard({
      card: 'summary_large_image',
      title: pageTitle,
      description: pageMeta.description || company.description || '',
      image: config.visualConfig.branding?.logo || company.logo_url || ''
    });
  }

  /**
   * Reset to default company SEO
   */
  resetToDefaultSeo(): void {
    this.updateCompanySeo();
  }
}
