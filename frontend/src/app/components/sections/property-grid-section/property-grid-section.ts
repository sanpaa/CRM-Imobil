import { Component, Input, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyCardComponent } from '../../property-card/property-card';
import { PropertyService } from '../../../services/property';
import { Property } from '../../../models/property.model';

@Component({
  selector: 'app-property-grid-section',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, RouterModule, PropertyCardComponent],
  templateUrl: './property-grid-section.html',
  styleUrls: ['./property-grid-section.css']
})
export class PropertyGridSectionComponent implements OnInit {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  
  properties: Property[] = [];
  loading = true;
  error = false;

  constructor(private propertyService: PropertyService) {}

  ngOnInit() {
    this.loadProperties();
  }

  get title(): string {
    return this.config.title || 'Imóveis à venda';
  }

  get limit(): number {
    return this.config.limit || 6;
  }

  get columns(): number {
    return this.config.columns || 3;
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
    this.propertyService.getAllProperties().subscribe({
      next: (properties: any) => {
        const list = properties.data || properties;
        let filtered = list.filter((p: Property) => !p.sold);
        
        if (this.showFeatured) {
          filtered = filtered.filter((p: Property) => p.featured);
        }
        
        this.properties = filtered.slice(0, this.limit);
        this.loading = false;
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
}
