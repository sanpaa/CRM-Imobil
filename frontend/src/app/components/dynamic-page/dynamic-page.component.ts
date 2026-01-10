import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DomainDetectionService, PageConfig } from '../../services/domain-detection.service';
import { SeoService } from '../../services/seo.service';
import { PublicSiteRendererComponent } from '../public-site-renderer/public-site-renderer';

/**
 * Componente responsável por renderizar páginas dinâmicas
 * baseadas na configuração do domínio
 */
@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [CommonModule, PublicSiteRendererComponent],
  template: `
    <div class="dynamic-page">
      <div *ngIf="isLoading" class="page-loading">
        <div class="spinner"></div>
        <p>Carregando página...</p>
      </div>

      <div *ngIf="!isLoading && pageNotFound" class="page-not-found">
        <h2>Página não encontrada</h2>
        <p>A página solicitada não existe.</p>
      </div>

      <div *ngIf="!isLoading && page" class="page-content">
        <app-public-site-renderer 
          [pageConfig]="page"
          [companyInfo]="companyInfo">
        </app-public-site-renderer>
      </div>
    </div>
  `,
  styles: [`
    .dynamic-page {
      min-height: 60vh;
    }

    .page-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      color: var(--text-secondary);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--surface);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .page-not-found {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text);
    }

    .page-not-found h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: var(--error);
    }

    .page-content {
      width: 100%;
    }
  `]
})
export class DynamicPageComponent implements OnInit, OnDestroy {
  page: PageConfig | null = null;
  companyInfo: any = null;
  isLoading = true;
  pageNotFound = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private domainService: DomainDetectionService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const slug = params['slug'] || '/';
        this.loadPage(slug);
      });
  }

  private loadPage(slug: string): void {
    this.isLoading = true;
    this.pageNotFound = false;

    // Aguardar config estar carregada
    this.domainService.isConfigLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        if (loaded) {
          this.page = this.domainService.getPageBySlug(slug);
          this.companyInfo = this.domainService.getCompanyInfo();

          if (this.page) {
            // Atualizar SEO da página
            this.seoService.updatePageSeo(this.page);
            this.pageNotFound = false;
          } else {
            this.pageNotFound = true;
          }

          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
