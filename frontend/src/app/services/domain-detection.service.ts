import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SiteConfig {
  success: boolean;
  company: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logo_url?: string;
    description?: string;
    whatsapp?: string;
  };
  pages: PageConfig[];
  visualConfig: VisualConfig;
  domain: string;
}

export interface PageConfig {
  slug: string;
  pageType: string;
  name: string;
  components: any[];
  meta: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}

export interface VisualConfig {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  branding: {
    logo?: string;
    companyName: string;
    tagline?: string;
  };
  contact: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
  };
  socialLinks: any;
  businessHours: any;
  layout: any;
}

@Injectable({
  providedIn: 'root'
})
export class DomainDetectionService {
  private apiUrl = `${environment.apiUrl}/api/public`;
  private currentDomain$ = new BehaviorSubject<string>('');
  private siteConfig$ = new BehaviorSubject<SiteConfig | null>(null);

  constructor(private http: HttpClient) {
    this.detectDomain();
  }

  /**
   * Detect current domain from window.location
   */
  detectDomain(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const hostname = window.location.hostname;
    
    // Development/localhost fallback
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Check for query parameter override
      const urlParams = new URLSearchParams(window.location.search);
      const domainOverride = urlParams.get('domain');
      
      if (domainOverride) {
        this.currentDomain$.next(domainOverride);
        return domainOverride;
      }
      
      // Default demo domain for development
      const defaultDomain = 'demo.imobiliaria.com';
      this.currentDomain$.next(defaultDomain);
      return defaultDomain;
    }

    this.currentDomain$.next(hostname);
    return hostname;
  }

  /**
   * Get current domain as observable
   */
  getCurrentDomain(): Observable<string> {
    return this.currentDomain$.asObservable();
  }

  /**
   * Get current domain value
   */
  getCurrentDomainValue(): string {
    return this.currentDomain$.value;
  }

  /**
   * Fetch site configuration for current domain
   */
  fetchSiteConfig(domain?: string): Observable<SiteConfig> {
    const targetDomain = domain || this.getCurrentDomainValue();
    
    return this.http.get<SiteConfig>(
      `${this.apiUrl}/site-config?domain=${encodeURIComponent(targetDomain)}`
    ).pipe(
      tap(config => {
        this.siteConfig$.next(config);
        this.applyVisualConfig(config.visualConfig);
      }),
      catchError(error => {
        console.error('Error fetching site config:', error);
        throw error;
      })
    );
  }

  /**
   * Get site configuration by company ID (for testing/preview)
   */
  fetchSiteConfigByCompany(companyId: string): Observable<SiteConfig> {
    return this.http.get<SiteConfig>(
      `${this.apiUrl}/site-config/by-company/${companyId}`
    ).pipe(
      tap(config => {
        this.siteConfig$.next(config);
        this.applyVisualConfig(config.visualConfig);
      })
    );
  }

  /**
   * Get current site config as observable
   */
  getSiteConfig(): Observable<SiteConfig | null> {
    return this.siteConfig$.asObservable();
  }

  /**
   * Get current site config value
   */
  getSiteConfigValue(): SiteConfig | null {
    return this.siteConfig$.value;
  }

  /**
   * Apply visual configuration to the page
   */
  private applyVisualConfig(visualConfig: VisualConfig): void {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    
    // Apply theme colors
    if (visualConfig.theme.primaryColor) {
      root.style.setProperty('--primary-color', visualConfig.theme.primaryColor);
    }
    
    if (visualConfig.theme.secondaryColor) {
      root.style.setProperty('--secondary-color', visualConfig.theme.secondaryColor);
    }
    
    if (visualConfig.theme.fontFamily) {
      root.style.setProperty('--font-family', visualConfig.theme.fontFamily);
    }
  }

  /**
   * Get page configuration by slug
   */
  getPageBySlug(slug: string): PageConfig | null {
    const config = this.getSiteConfigValue();
    if (!config) {
      return null;
    }

    return config.pages.find(page => page.slug === slug) || null;
  }

  /**
   * Check if we're in public site mode
   */
  isPublicSite(): boolean {
    const domain = this.getCurrentDomainValue();
    
    // If domain is set and not localhost, we're in public mode
    if (domain && domain !== 'localhost' && domain !== '127.0.0.1') {
      return true;
    }

    // Check if URL has public indicator
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      return path.startsWith('/site') || path.startsWith('/public');
    }

    return false;
  }
}
