import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter } from 'rxjs';
import { DomainDetectionService } from './services/domain-detection.service';
import { ThemeService } from './services/theme.service';
import { SeoService } from './services/seo.service';
import { WebsiteCustomizationService } from './services/website-customization.service';
import { HeaderComponent } from './components/header/header';
import { FooterComponent } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'CRM Imobiliário - Site Público';
  
  isLoading = true;
  hasError = false;
  errorMessage = '';
  showHeaderFooter = false;
  companyData: any = null;
  headerConfig: any = null;
  footerConfig: any = null;
  private siteConfig: any = null;
  
  private destroy$ = new Subject<void>();
  private isReady = false;

  constructor(
    private domainService: DomainDetectionService,
    private themeService: ThemeService,
    private seoService: SeoService,
    private websiteService: WebsiteCustomizationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Detect current route to show/hide header/footer
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      if (this.companyData?.id && this.siteConfig) {
        const currentUrl = event?.urlAfterRedirects || event?.url || this.router.url;
        this.updateHeaderFooterVisibility(currentUrl);
        this.loadLayoutForRoute(currentUrl, false);
      } else {
        const currentUrl = event?.urlAfterRedirects || event?.url || this.router.url;
        this.updateHeaderFooterVisibility(currentUrl);
      }
    });

    // Check if config is loaded
    this.domainService.isConfigLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        if (loaded) {
          // Check for errors
          const error = this.domainService.getConfigErrorValue();
          if (error) {
            this.hasError = true;
            this.errorMessage = error;
            this.finishLoading();
          } else {
            // Load company data and configs
            const config = this.domainService.getSiteConfigValue();
            if (config) {
              this.siteConfig = config;
              this.companyData = config.company;
              
              // Find header and footer configs from pages
              const homePage = this.domainService.getHomePage();
              if (homePage?.components) {
                const headerComp = homePage.components.find((c: any) => c.type === 'header' || c.component_type === 'header');
                const footerComp = homePage.components.find((c: any) => c.type === 'footer' || c.component_type === 'footer');
                
                const headerStyle = headerComp?.style || headerComp?.style_config || {};
                const footerStyle = footerComp?.style || footerComp?.style_config || {};
                this.headerConfig = { ...(headerComp?.config || {}), style: headerStyle };
                this.footerConfig = { ...(footerComp?.config || {}), style: footerStyle };
              }

              // Apply SEO as soon as config is available.
              this.seoService.updateCompanySeo();

              if (this.companyData?.id) {
                const currentUrl = this.router.url || '/';
                this.updateHeaderFooterVisibility(currentUrl);
                this.loadLayoutForRoute(currentUrl, true);
                return;
              }
            }
            
            this.finishLoading();
          }
        }
      });

    // Listen to theme changes
    this.themeService.isThemeLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        if (loaded) {
          console.log('Theme loaded successfully');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyLayoutConfig(layout: any): void {
    const sections = layout?.layout_config?.sections || [];
    const headerSection = sections.find((s: any) => (s.component_type || s.type) === 'header');
    const footerSection = sections.find((s: any) => (s.component_type || s.type) === 'footer');

    if (headerSection) {
      const headerAny = headerSection as any;
      const style = headerAny.style || headerAny.style_config || {};
      this.headerConfig = { ...(headerAny.config || {}), style };
    }

    if (footerSection) {
      const footerAny = footerSection as any;
      const style = footerAny.style || footerAny.style_config || {};
      this.footerConfig = { ...(footerAny.config || {}), style };
    }
  }

  private finishLoading(): void {
    if (this.isReady) {
      return;
    }
    this.isReady = true;
    this.isLoading = false;
  }

  private loadLayoutForRoute(url: string, isInitial: boolean): void {
    const pageType = this.resolvePageType(url);
    if (!pageType) {
      if (isInitial) {
        this.finishLoading();
      }
      return;
    }

    this.websiteService.getActiveLayoutCached(this.companyData.id, pageType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (layout) => {
          const sections = layout?.layout_config?.sections || [];
          if (sections.length === 0) {
            if (isInitial) {
              this.finishLoading();
            }
            return;
          }
          this.hasError = false;
          this.errorMessage = '';
          this.applyLayoutConfig(layout);
          if (isInitial) {
            this.finishLoading();
          }
        },
        error: () => {
          if (isInitial) {
            this.finishLoading();
          }
        }
      });
  }

  private resolvePageType(url: string): string | null {
    const normalized = this.normalizePath(url);
    const pages = this.siteConfig?.pages || [];

    if (normalized === '/') {
      const homePage = this.domainService.getHomePage();
      return homePage?.pageType || 'home';
    }

    const match = pages.find((p: any) => {
      if (!p?.slug) return false;
      const slug = this.normalizePath(p.slug);
      return slug === normalized || `/${slug.replace(/^\//, '')}` === normalized;
    });

    return match?.pageType || null;
  }

  private updateHeaderFooterVisibility(url: string): void {
    const normalized = this.normalizePath(url);
    const lookupPath = normalized.startsWith('/site') ? '/' : normalized;
    const page = this.getPageForPath(lookupPath);
    const hasCustomHtml = typeof page?.html === 'string' && page.html.trim().length > 0;
    if (hasCustomHtml) {
      this.showHeaderFooter = false;
      return;
    }
    if (!page?.components || page.components.length === 0) {
      this.showHeaderFooter = true;
      return;
    }

    const hasHeaderOrFooter = page.components.some((c: any) => {
      const type = c?.type || c?.component_type;
      return type === 'header' || type === 'footer';
    });
    this.showHeaderFooter = !hasHeaderOrFooter;
  }

  private getPageForPath(path: string): any | null {
    const pages = this.siteConfig?.pages || [];
    if (path === '/') {
      return this.domainService.getHomePage();
    }

    return pages.find((p: any) => {
      if (!p?.slug) return false;
      const slug = this.normalizePath(p.slug);
      return slug === path || `/${slug.replace(/^\//, '')}` === path;
    }) || null;
  }

  private normalizePath(value: string): string {
    const clean = (value || '').split('?')[0].split('#')[0].trim();
    if (!clean || clean === '') return '/';
    return clean.startsWith('/') ? clean : `/${clean}`;
  }
}
