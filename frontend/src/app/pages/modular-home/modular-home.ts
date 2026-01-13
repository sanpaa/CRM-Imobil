import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { DynamicSectionComponent } from '../../components/dynamic-section/dynamic-section';
import { DomainDetectionService, PageConfig } from '../../services/domain-detection.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-modular-home',
  standalone: true,
  imports: [CommonModule, DynamicSectionComponent],
  templateUrl: './modular-home.html',
  styleUrls: ['./modular-home.css']
})
export class ModularHomeComponent implements OnInit, OnDestroy {
  pageConfig: PageConfig | null = null;
  sections: any[] = [];
  loading = true;
  error = false;
  companyData: any = null;
  footerConfig: any = {};
  
  private destroy$ = new Subject<void>();

  constructor(
    private domainService: DomainDetectionService,
    private seoService: SeoService
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
    
    // Se não tem componentes, criar fallback
    if (!homePage.components || homePage.components.length === 0) {
      console.warn('⚠️ Backend sem componentes, usando fallback');
      homePage = {
        slug: 'home',
        name: 'Home',
        pageType: 'home',
        components: [
          { type: 'header', order: 0, config: {} },
          { type: 'hero', order: 1, config: { title: 'Encontre seu Imóvel dos Sonhos', subtitle: 'As melhores ofertas do mercado' } },
          { type: 'property-grid', order: 2, config: { title: 'Imóveis em Destaque', limit: 6 } },
          { type: 'features-grid', order: 3, config: { title: 'Por que escolher a gente?' } },
          { type: 'faq', order: 4, config: { title: 'Perguntas Frequentes' } },
          { type: 'newsletter', order: 5, config: { title: 'Receba Novidades' } },
          { type: 'mortgage-calculator', order: 6, config: { title: 'Simule seu Financiamento' } },
          { type: 'footer', order: 7, config: {} }
        ],
        meta: { title: 'Home' }
      };
    }
    
    this.pageConfig = homePage;
    this.sections = homePage.components?.sort((a, b) => a.order - b.order) || [];
    this.companyData = this.domainService.getCompanyInfo();
    
    console.log('🔍 DEBUG companyData:', this.companyData);
    console.log('🔍 DEBUG footer_config:', this.companyData?.footer_config);
    console.log('🔍 DEBUG siteConfig.company completo:', this.domainService.getSiteConfigValue()?.company);
    console.log('🔍 DEBUG sections:', this.sections.map(s => s.type || s.component_type));
    
    // Extrair config do footer se existir nos componentes
    const footerComponent = homePage.components?.find(c => c.type === 'footer' || c.component_type === 'footer');
    if (footerComponent) {
      this.footerConfig = footerComponent.config || {};
    }
    
    this.loading = false;
    
    console.log('✅ Página carregada com', this.sections.length, 'componentes');
    console.log('📦 Componentes:', this.sections.map(s => s.type || s.component_type));
    
    // Update SEO
    if (homePage.meta) {
      this.seoService.updatePageSeo(homePage);
    }
  }
}
