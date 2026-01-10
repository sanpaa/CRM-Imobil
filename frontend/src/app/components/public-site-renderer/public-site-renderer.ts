import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { DomainDetectionService, SiteConfig, PageConfig } from '../../services/domain-detection.service';
import { DynamicSectionComponent } from '../dynamic-section/dynamic-section';

/**
 * Component for rendering public site pages dynamically
 * Supports both standalone mode and input-driven mode
 */
@Component({
  selector: 'app-public-site-renderer',
  standalone: true,
  imports: [CommonModule, DynamicSectionComponent],
  template: `
    <div class="public-site" *ngIf="!loading && !error">
      <!-- Render dynamic sections -->
      <div *ngFor="let section of currentPageSections">
        <app-dynamic-section 
          [section]="section"
          [companyData]="companyData || siteConfig?.company">
        </app-dynamic-section>
      </div>
    </div>

    <!-- Loading state -->
    <div class="loading-container" *ngIf="loading">
      <div class="loading-spinner"></div>
      <p>Carregando site...</p>
    </div>

    <!-- Error state -->
    <div class="error-container" *ngIf="error">
      <h2>Site não encontrado</h2>
      <p>{{ errorMessage }}</p>
    </div>
  `,
  styles: [`
    .public-site {
      min-height: 100vh;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-color, #004AAD);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
    }

    .error-container h2 {
      color: #d32f2f;
      margin-bottom: 1rem;
    }
  `]
})
export class PublicSiteRendererComponent implements OnInit, OnDestroy, OnChanges {
  // Optional inputs for direct page rendering (allows component to work standalone or with external data)
  @Input() pageConfig?: PageConfig;
  @Input() companyInfo?: any;
  
  siteConfig: SiteConfig | null = null;
  currentPage: PageConfig | null = null;
  currentPageSections: any[] = [];
  loading = true;
  error = false;
  errorMessage = '';
  
  // Computed property for company data
  get companyData() {
    return this.companyInfo || this.siteConfig?.company;
  }
  
  private destroy$ = new Subject<void>();

  constructor(
    private domainService: DomainDetectionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If pageConfig is provided as input, use it directly
    if (this.pageConfig) {
      this.currentPage = this.pageConfig;
      this.currentPageSections = this.pageConfig.components || [];
      this.loading = false;
      return;
    }

    // Otherwise, load site configuration
    this.loadSiteConfig();

    // Listen to route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadCurrentPage();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to input properties
    if (changes['pageConfig'] && this.pageConfig) {
      this.currentPage = this.pageConfig;
      this.currentPageSections = this.pageConfig.components || [];
      this.loading = false;
    }
  }

  /**
   * Load site configuration from API
   */
  loadSiteConfig(): void {
    const domain = this.domainService.getCurrentDomainValue();
    
    this.domainService.fetchSiteConfig(domain).subscribe({
      next: (config) => {
        this.siteConfig = config;
        this.loading = false;
        this.loadCurrentPage();
        this.updateMetaTags();
      },
      error: (err) => {
        console.error('Failed to load site config:', err);
        this.error = true;
        this.loading = false;
        this.errorMessage = err.error?.error || 'Site não disponível no momento.';
      }
    });
  }

  /**
   * Load page configuration based on current route
   */
  loadCurrentPage(): void {
    if (!this.siteConfig) {
      return;
    }

    const currentPath = this.router.url.split('?')[0];
    
    // Find matching page by slug
    this.currentPage = this.siteConfig.pages.find(page => {
      // Exact match
      if (page.slug === currentPath) {
        return true;
      }
      
      // Dynamic route match (e.g., /imovel/:id)
      const slugPattern = page.slug.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${slugPattern}$`);
      return regex.test(currentPath);
    }) || null;

    // Default to home page if no match
    if (!this.currentPage) {
      this.currentPage = this.siteConfig.pages.find(page => page.slug === '/') || null;
    }

    if (this.currentPage) {
      this.currentPageSections = this.currentPage.components.sort((a, b) => a.order - b.order);
      this.updateMetaTags();
    }
  }

  /**
   * Update meta tags for SEO
   */
  updateMetaTags(): void {
    if (!this.currentPage || typeof document === 'undefined') {
      return;
    }

    const meta = this.currentPage.meta;
    
    // Update title
    if (meta.title) {
      document.title = meta.title;
    } else if (this.siteConfig?.company.name) {
      document.title = this.siteConfig.company.name;
    }

    // Update meta description
    this.updateMetaTag('description', meta.description || this.siteConfig?.company.description || '');

    // Update meta keywords
    if (meta.keywords) {
      this.updateMetaTag('keywords', meta.keywords);
    }
  }

  /**
   * Update or create a meta tag
   */
  private updateMetaTag(name: string, content: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    let metaTag = document.querySelector(`meta[name="${name}"]`);
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', name);
      document.head.appendChild(metaTag);
    }
    
    metaTag.setAttribute('content', content);
  }
}
