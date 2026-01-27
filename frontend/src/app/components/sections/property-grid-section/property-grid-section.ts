import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyCardComponent } from '../../property-card/property-card';
import { PropertyService } from '../../../services/property';
import { ComponentDataCacheService } from '../../../services/component-data-cache.service';
import { Property } from '../../../models/property.model';
import { register } from 'swiper/element/bundle';
register();

@Component({
  selector: 'app-property-grid-section',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, RouterModule, PropertyCardComponent],
  templateUrl: './property-grid-section.html',
  styleUrls: ['./property-grid-section.css']
})
export class PropertyGridSectionComponent implements OnInit, AfterViewInit {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  @Input() companyId: string | null = null;
  @Input() componentId: string | null = null;
  @ViewChild('swiperRef', { static: false }) swiperRef?: ElementRef;
  
  properties: Property[] = [];
  loading = true;
  error = false;

  constructor(
    private propertyService: PropertyService,
    private cacheService: ComponentDataCacheService
  ) {}

  ngOnInit() {
    this.loadProperties();
  }

  ngAfterViewInit() {
    this.initSwiper();
  }

  initSwiper() {
    setTimeout(() => {
      if (this.swiperRef?.nativeElement) {
        const swiperEl = this.swiperRef.nativeElement;
        Object.assign(swiperEl, {
          slidesPerView: this.isMobile ? 1.1 : 3,
          spaceBetween: 24,
          navigation: !this.isMobile,
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

  swiperNext(): void {
    this.swiperRef?.nativeElement.swiper.slideNext();
  }

  swiperPrev(): void {
    this.swiperRef?.nativeElement.swiper.slidePrev();
  }

  get title(): string {
    return this.config.title || 'Imóveis à venda';
  }

  get limit(): number {
    return this.config.limit || 12;
  }

  get columns(): number {
    return parseInt(this.config.columns) || 3;
  }

  get showFeatured(): boolean {
    return this.config.showFeatured || false;
  }

  get showViewAll(): boolean {
    return this.config.showViewAll !== false;
  }

  get showCarousel(): boolean {
    return this.config.showCarousel !== false;
  }

  loadProperties(): void {
    const cacheKey = this.getCacheKey();
    if (cacheKey && this.cacheService.has(cacheKey)) {
      this.properties = this.cacheService.get<Property[]>(cacheKey) || [];
      this.loading = false;
      setTimeout(() => this.initSwiper(), 0);
      return;
    }

    this.propertyService.getPropertiesByCompany(this.companyId).subscribe({
      next: (properties: any) => {
        const list = properties.data || properties;
        console.log('[PropertyGridSection] Total from API:', list.length);
        let filtered = list.filter((p: Property) => !p.sold);
        console.log('[PropertyGridSection] After sold filter:', filtered.length);
        
        if (this.showFeatured) {
          const featuredProps = filtered.filter((p: Property) => p.featured);
          // Se tiver featured, usar só eles. Senão, usar todos
          if (featuredProps.length > 0) {
            filtered = featuredProps;
          }
        }
        
        this.properties = filtered.slice(0, this.limit);
        if (cacheKey) {
          this.cacheService.set(cacheKey, this.properties);
        }
        this.loading = false;
        console.log('[PropertyGridSection] Final properties:', this.properties.length);
        setTimeout(() => this.initSwiper(), 200);
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  get skeletonItems(): number[] {
    return Array(Math.min(this.limit, 3)).fill(0).map((x, i) => i);
  }

  get isMobile(): boolean {
    return window.innerWidth < 768;
  }

  private getCacheKey(): string | null {
    return this.componentId ? `property-grid:${this.componentId}` : null;
  }
}
