// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { PropertyCardComponent } from '../../components/property-card/property-card';
// import { PropertyService } from '../../services/property';
// import { Property } from '../../models/property.model';

// @Component({
//   selector: 'app-home',
//   imports: [CommonModule, RouterModule, PropertyCardComponent],
//   templateUrl: './home.html',
//   styleUrl: './home.css',
// })
// export class HomeComponent implements OnInit {
//   properties: Property[] = [];
//   visibleProperties: Property[] = [];

//   loading = true;
//   error = false;

//   pageSize = 3;
//   currentIndex = 0;
//   isMobile = false;

//   constructor(private propertyService: PropertyService) {}

//   ngOnInit(): void {
//     this.checkIfMobile();
//     this.loadProperties();

//     window.addEventListener('resize', () => {
//       this.checkIfMobile();
//       this.updateVisible();
//     });
//   }

//   checkIfMobile(): void {
//     const wasMobile = this.isMobile;

//     this.isMobile = window.innerWidth < 768;
//     this.pageSize = this.isMobile ? 1 : 3;

//     if (wasMobile !== this.isMobile) {
//       this.currentIndex = 0; // evita index quebrado
//     }
//   }

//   loadProperties(): void {
//     this.propertyService.getAllProperties().subscribe({
//       next: (properties) => {
//         this.properties = properties
//           .filter(p => !p.sold)
//           .slice(0, 9);

//         this.updateVisible();
//         this.loading = false;
//       },
//       error: () => {
//         this.error = true;
//         this.loading = false;
//       }
//     });
//   }

//   updateVisible(): void {
//     this.visibleProperties = this.properties.slice(
//       this.currentIndex,
//       this.currentIndex + this.pageSize
//     );
//   }

//   next(): void {
//     if (this.isMobile) {
//       if (this.currentIndex + 1 < this.properties.length) {
//         this.currentIndex++;
//         this.updateVisible();
//       }
//     } else {
//       if (this.currentIndex + this.pageSize < this.properties.length) {
//         this.currentIndex += this.pageSize;
//         this.updateVisible();
//       }
//     }
//   }

//   prev(): void {
//     if (this.isMobile) {
//       if (this.currentIndex > 0) {
//         this.currentIndex--;
//         this.updateVisible();
//       }
//     } else {
//       if (this.currentIndex - this.pageSize >= 0) {
//         this.currentIndex -= this.pageSize;
//         this.updateVisible();
//       }
//     }
//   }

//   get skeletonItems(): number[] {
//     return this.isMobile ? [1] : [1, 2, 3];
//   }

// }

/// <reference types="swiper/element" />

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PropertyCardComponent } from '../../components/property-card/property-card';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { Subject, takeUntil } from 'rxjs';
import { DomainDetectionService } from '../../services/domain-detection.service';
import { WebsiteCustomizationService } from '../../services/website-customization.service';
register();

@Component({
  selector: 'app-home',
  standalone: true, // Se estiver usando Angular moderno
  schemas: [CUSTOM_ELEMENTS_SCHEMA], 
  imports: [CommonModule, RouterModule, PropertyCardComponent, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  properties: Property[] = [];
  visibleProperties: Property[] = [];

  loading = true;
  error = false;
  searchText = '';
  companyData: any = null;
  companyName = '';
  companyLogoUrl = '';
  whatsappNumber = '';
  heroTitle = 'Encontre o imóvel que combina com sua <strong>rotina</strong>.';
  heroSubtitle = 'Curadoria especializada. Consultoria real para quem busca mais que metros quadrados.';
  heroBackgroundImage = '';
  heroBackgroundColor = '';
  heroTextColor = '';
  heroStyle: { [key: string]: string } = {};

  pageSize = 3;
  currentIndex = 0;
  isMobile = false;
  @ViewChild('swiperRef', { static: false }) swiper?: ElementRef;
  private destroy$ = new Subject<void>();

  // Adicionado o Router no construtor
  constructor(
    private propertyService: PropertyService,
    private router: Router,
    private domainService: DomainDetectionService,
    private websiteService: WebsiteCustomizationService
  ) {}

  ngOnInit(): void {
    this.checkIfMobile();
    this.loadProperties();
    this.updateHeroStyle();
    this.bindLayoutData();

    window.addEventListener('resize', () => {
      this.checkIfMobile();
      this.updateVisible();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.swiper?.nativeElement) {
        const swiperEl = this.swiper.nativeElement;
        Object.assign(swiperEl, {
          slidesPerView: this.isMobile ? 1.1 : 3,
          spaceBetween: 24,
          breakpoints: {
            768: {
              slidesPerView: 3,
              spaceBetween: 24
            },
            0: {
              slidesPerView: 1.1,
              spaceBetween: 16
            }
          }
        });
        swiperEl.initialize();
      }
    }, 100);
  }

  // Função que resolve o erro do clique nos cards de Lifestyle
  filtrar(categoria: string): void {
    // Navega para a busca passando o estilo como parâmetro na URL
    // Ex: /buscar?estilo=home-office
    this.router.navigate(['/buscar'], { 
      queryParams: { estilo: categoria } 
    });
  }

  checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
    this.pageSize = this.isMobile ? 1 : 3;
    
    // Resetar o índice se mudar o tamanho da tela para evitar espaços vazios
    this.currentIndex = 0;
  }

  loadProperties(): void {
    this.propertyService.getAllProperties().subscribe({
      next: (properties : any) => {
      console.log('RESPOSTA DA API:', properties);
      
      const list = properties.data;
        this.properties = list
          .filter((p: Property) => !p.sold)
          .slice(0, 9);

        this.updateVisible();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  updateVisible(): void {
    this.visibleProperties = this.properties.slice(
      this.currentIndex,
      this.currentIndex + this.pageSize
    );
  }

  next(): void {
    const step = this.isMobile ? 1 : this.pageSize;
    if (this.currentIndex + step < this.properties.length) {
      this.currentIndex += step;
      this.updateVisible();
    }
  }

  prev(): void {
    const step = this.isMobile ? 1 : this.pageSize;
    if (this.currentIndex - step >= 0) {
      this.currentIndex -= step;
      this.updateVisible();
    }
  }

  get skeletonItems(): number[] {
    return this.isMobile ? [1] : Array(this.pageSize).fill(0).map((x, i) => i);
  }

  bindLayoutData(): void {
    this.domainService.isConfigLoaded()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loaded => {
        if (!loaded) return;

        const siteConfig = this.domainService.getSiteConfigValue();
        const company = siteConfig?.company || null;
        const visualConfig = siteConfig?.visualConfig;
        const homePage = this.domainService.getHomePage();

        this.companyData = company;
        this.companyName = company?.name || '';
        this.companyLogoUrl = company?.footer_config?.logoUrl ||
          company?.logo_url ||
          visualConfig?.branding?.logo ||
          visualConfig?.branding?.logo ||
          '';

        const rawWhatsapp = company?.footer_config?.whatsapp ||
          visualConfig?.contact?.whatsapp ||
          company?.whatsapp ||
          company?.phone ||
          visualConfig?.contact?.phone ||
          '';
        this.whatsappNumber = this.normalizePhone(rawWhatsapp);

        const heroComponent = homePage?.components?.find(c => c.type === 'hero' || c.component_type === 'hero');
        const heroConfig = heroComponent?.config || {};
        const heroStyle = heroComponent?.style || heroComponent?.style_config || {};
        this.heroTitle = heroConfig.title || this.heroTitle;
        this.heroSubtitle = heroConfig.subtitle || this.heroSubtitle;
        this.heroBackgroundImage = heroConfig.backgroundImage || heroConfig.image || '';
        this.heroBackgroundColor = heroStyle.backgroundColor || heroConfig.backgroundColor || '';
        this.heroTextColor = heroStyle.textColor || '';
        this.updateHeroStyle();

        if (company?.id) {
          const cachedLayout = this.websiteService.getActiveLayoutValue(company.id, 'home');
          if (cachedLayout) {
            this.applyHeroLayout(cachedLayout);
          }

          this.websiteService.getActiveLayoutCached(company.id, 'home')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (layout) => {
                this.applyHeroLayout(layout);
              },
              error: () => {
                // Keep hero from site config when layout lookup fails.
              }
            });
        }
      });
  }

  goToSearch(): void {
    console.log('Buscando por:', this.searchText);
    if (!this.searchText.trim()) return;

    this.router.navigate(['/buscar'], {
      queryParams: {
        search: this.searchText.trim()
      }
    });
  }

  normalizePhone(value: string): string {
    return (value || '').replace(/\D/g, '');
  }

  getWhatsAppLink(): string {
    if (!this.whatsappNumber) return '';
    return `https://wa.me/${this.whatsappNumber}`;
  }

  updateHeroStyle(): void {
    if (this.heroBackgroundImage) {
      this.heroStyle = {
        backgroundImage: `url('${this.heroBackgroundImage}')`
      };
      if (this.heroTextColor) {
        this.heroStyle = { ...this.heroStyle, color: this.heroTextColor };
      }
      return;
    }

    if (this.heroBackgroundColor) {
      this.heroStyle = {
        background: this.heroBackgroundColor,
        backgroundImage: 'none'
      };
      if (this.heroTextColor) {
        this.heroStyle = { ...this.heroStyle, color: this.heroTextColor };
      }
      return;
    }

    this.heroStyle = {
      backgroundImage: 'linear-gradient(135deg, #0f4c5c, #1b998b)'
    };
    if (this.heroTextColor) {
      this.heroStyle = { ...this.heroStyle, color: this.heroTextColor };
    }
  }

  private applyHeroLayout(layout: any): void {
    const sections = layout?.layout_config?.sections || [];
    const heroSection = sections.find((s: any) => (s.component_type || s.type) === 'hero');
    if (!heroSection) return;

    const heroAny = heroSection as any;
    const layoutConfig = heroAny.config || {};
    const layoutStyle = heroAny.style || heroAny.style_config || {};
    this.heroTitle = layoutConfig['title'] || this.heroTitle;
    this.heroSubtitle = layoutConfig['subtitle'] || this.heroSubtitle;
    this.heroBackgroundImage = layoutConfig['backgroundImage'] || layoutConfig['image'] || '';
    this.heroBackgroundColor = layoutStyle['backgroundColor'] || this.heroBackgroundColor;
    this.heroTextColor = layoutStyle['textColor'] || this.heroTextColor;
    this.updateHeroStyle();
  }

  swiperNext(): void {
    this.swiper?.nativeElement.swiper.slideNext();
  }

  swiperPrev(): void {
    this.swiper?.nativeElement.swiper.slidePrev();
  }
}
