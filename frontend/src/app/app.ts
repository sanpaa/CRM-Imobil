import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, filter } from 'rxjs';
import { DomainDetectionService } from './services/domain-detection.service';
import { ThemeService } from './services/theme.service';
import { SeoService } from './services/seo.service';
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
  
  private destroy$ = new Subject<void>();

  constructor(
    private domainService: DomainDetectionService,
    private themeService: ThemeService,
    private seoService: SeoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set initial state based on current URL
    const currentUrl = this.router.url;
    const isHome = currentUrl === '/' || currentUrl.startsWith('/?') || currentUrl.startsWith('/#');
    this.showHeaderFooter = !isHome;

    // Detect current route to show/hide header/footer
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      // Show header/footer on all pages EXCEPT home (home has dynamic components)
      // Home pode ser: /, /?, /#sobre, /?#sobre
      const url = event.url;
      const isHome = url === '/' || url.startsWith('/?') || url.startsWith('/#');
      this.showHeaderFooter = !isHome;
    });

    // Check if config is loaded
    this.domainService.isConfigLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        if (loaded) {
          this.isLoading = false;
          
          // Check for errors
          const error = this.domainService.getConfigErrorValue();
          if (error) {
            this.hasError = true;
            this.errorMessage = error;
          } else {
            // Load company data and configs
            const config = this.domainService.getSiteConfigValue();
            if (config) {
              this.companyData = config.company;
              
              // Find header and footer configs from pages
              const homePage = config.pages?.find((p: any) => p.slug === 'home' || p.isHome);
              if (homePage?.components) {
                const headerComp = homePage.components.find((c: any) => c.type === 'header' || c.component_type === 'header');
                const footerComp = homePage.components.find((c: any) => c.type === 'footer' || c.component_type === 'footer');
                
                this.headerConfig = headerComp?.config || {};
                this.footerConfig = footerComp?.config || {};
              }
            }
            
            // Apply SEO
            this.seoService.updateCompanySeo();
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
}
