import { Component, OnInit, OnDestroy, Inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DomainDetectionService, PageConfig } from '../../services/domain-detection.service';
import { SeoService } from '../../services/seo.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-modular-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modular-home.html',
  styleUrls: ['./modular-home.css']
})
export class ModularHomeComponent implements OnInit, OnDestroy {
  pageConfig: PageConfig | null = null;
  loading = true;
  error = false;
  companyData: any = null;
  footerConfig: any = {};
  pageHtml: SafeHtml = '';
  private pageStyleEl: HTMLStyleElement | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private domainService: DomainDetectionService,
    private seoService: SeoService,
    private sanitizer: DomSanitizer,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    // Aguardar a configuração estar carregada
    this.domainService.isConfigLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        if (loaded) {
          this.loadPage();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearPageStyle();
  }

  loadPage() {
    // Get home page configuration
    let homePage = this.domainService.getHomePage();
    
    console.log('🔍 DEBUG homePage:', homePage);
    console.log('🔍 DEBUG siteConfig completo:', this.domainService.getSiteConfigValue());
    
    if (!homePage) {
      console.error('❌ Nenhuma página encontrada');
      this.loading = false;
      this.error = true;
      return;
    }
    
    this.pageConfig = homePage;
    this.companyData = this.domainService.getCompanyInfo();
    
    console.log('🔍 DEBUG companyData:', this.companyData);
    console.log('🔍 DEBUG footer_config:', this.companyData?.footer_config);
    console.log('🔍 DEBUG siteConfig.company completo:', this.domainService.getSiteConfigValue()?.company);
    
    this.applyCustomPageContent(homePage);
    this.loading = false;
    
    // Update SEO
    if (homePage.meta) {
      this.seoService.updatePageSeo(homePage);
    }
  }


  private applyCustomPageContent(page: PageConfig): void {
    const rawHtml = (page.html || '').trim();
    const rawCss = (page.css || '').trim();

    if (rawHtml) {
      const normalizedHtml = this.normalizeHtml(rawHtml);
      const styledHtml = rawCss ? `<style>${rawCss}</style>${normalizedHtml}` : normalizedHtml;
      this.pageHtml = this.sanitizer.bypassSecurityTrustHtml(styledHtml);
    } else {
      this.pageHtml = '';
    }

    this.clearPageStyle();
  }

  private normalizeHtml(html: string): string {
    return html
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<\/?(html|head|body)[^>]*>/gi, '');
  }

  private updatePageStyle(css: string): void {
    if (!this.document) {
      return;
    }

    if (!css) {
      this.clearPageStyle();
      return;
    }

    if (!this.pageStyleEl) {
      const styleEl = this.renderer.createElement('style') as HTMLStyleElement;
      styleEl.setAttribute('data-home-page-style', 'true');
      this.renderer.appendChild(this.document.head, styleEl);
      this.pageStyleEl = styleEl;
    }

    if (this.pageStyleEl) {
      this.pageStyleEl.textContent = css;
    }
  }

  private clearPageStyle(): void {
    if (this.pageStyleEl && this.document?.head) {
      this.renderer.removeChild(this.document.head, this.pageStyleEl);
      this.pageStyleEl = null;
    }
  }
}
