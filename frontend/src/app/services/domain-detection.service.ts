import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, forkJoin } from 'rxjs';
import { tap, catchError, shareReplay, switchMap, map } from 'rxjs/operators';
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
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
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
  private apiUrl = `${environment.apiUrl}/api`;
  private currentDomain$ = new BehaviorSubject<string>('');
  private siteConfig$ = new BehaviorSubject<SiteConfig | null>(null);
  private isConfigLoaded$ = new BehaviorSubject<boolean>(false);
  private configError$ = new BehaviorSubject<string | null>(null);
  
  // Cache for site config to avoid multiple API calls
  private configCache: Map<string, Observable<SiteConfig>> = new Map();

  constructor(private http: HttpClient) {
    // Don't auto-detect on construction - let APP_INITIALIZER handle it
  }

  /**
   * Initialize the service - detect domain and load config
   * Called by APP_INITIALIZER
   */
  initialize(): Promise<SiteConfig> {
    const domain = this.detectDomain();
    return this.fetchSiteConfig(domain).toPromise() as Promise<SiteConfig>;
  }

  /**
   * Detect current domain from window.location
   */
  detectDomain(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const hostname = window.location.hostname;
    
    // Development/localhost - usar "crm-imobil.netlify.app" para testes
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      this.currentDomain$.next('crm-imobil.netlify.app');
      return 'crm-imobil.netlify.app';
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
   * Get config loading status
   */
  isConfigLoaded(): Observable<boolean> {
    return this.isConfigLoaded$.asObservable();
  }

  /**
   * Get config error if any
   */
  getConfigError(): Observable<string | null> {
    return this.configError$.asObservable();
  }

  /**
   * Get config error value
   */
  getConfigErrorValue(): string | null {
    return this.configError$.value;
  }

  /**
   * Fetch site configuration for current domain with caching
   */
  fetchSiteConfig(domain?: string): Observable<SiteConfig> {
    const targetDomain = domain || this.getCurrentDomainValue();
    
    if (!targetDomain) {
      const error = 'No domain detected';
      this.configError$.next(error);
      this.isConfigLoaded$.next(true);
      return throwError(() => new Error(error));
    }

    // Check cache first
    if (this.configCache.has(targetDomain)) {
      return this.configCache.get(targetDomain)!;
    }

    // Make request and cache it
    const request$ = this.http.get<SiteConfig>(
      `${this.apiUrl}/site-config?domain=${encodeURIComponent(targetDomain)}`
    ).pipe(
      tap(config => {
        this.siteConfig$.next(config);
        this.isConfigLoaded$.next(true);
        this.configError$.next(null);
        console.log('Site config loaded for domain:', targetDomain);
        console.log('Company data with footer_config:', config.company);
        console.log('Pages loaded:', config.pages);
      }),
      catchError(error => {
        const errorMsg = error.status === 404 
          ? `Domain not found: ${targetDomain}` 
          : 'Error loading site configuration';
        
        this.configError$.next(errorMsg);
        this.isConfigLoaded$.next(true);
        this.siteConfig$.next(null);
        
        console.error('Error fetching site config:', error);
        return throwError(() => error);
      }),
      shareReplay(1) // Share the result with multiple subscribers
    );

    this.configCache.set(targetDomain, request$);
    return request$;
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
        this.isConfigLoaded$.next(true);
        this.configError$.next(null);
      }),
      catchError(error => {
        this.configError$.next('Error loading site configuration');
        this.isConfigLoaded$.next(true);
        console.error('Error fetching site config by company:', error);
        return throwError(() => error);
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
   * Clear cache for a specific domain
   */
  clearCache(domain?: string): void {
    if (domain) {
      this.configCache.delete(domain);
    } else {
      this.configCache.clear();
    }
  }

  /**
   * Reload current site configuration
   */
  reloadConfig(): Observable<SiteConfig> {
    const domain = this.getCurrentDomainValue();
    this.clearCache(domain);
    return this.fetchSiteConfig(domain);
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
   * Get all pages
   */
  getAllPages(): PageConfig[] {
    const config = this.getSiteConfigValue();
    return config?.pages || [];
  }

  /**
   * Get home page
   */
  getHomePage(): PageConfig | null {
    const config = this.getSiteConfigValue();
    if (!config || !config.pages || config.pages.length === 0) {
      return null;
    }

    // Find page with slug '/' or 'home' or the first page
    return config.pages.find(p => p.slug === '/' || p.slug === 'home') || config.pages[0];
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

  /**
   * Get company info
   */
  getCompanyInfo() {
    return this.siteConfig$.value?.company;
  }

  /**
   * Get visual config
   */
  getVisualConfig() {
    return this.siteConfig$.value?.visualConfig;
  }
}
