import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicSectionComponent } from '../../components/dynamic-section/dynamic-section';
import { WebsiteCustomizationService } from '../../services/website-customization.service';
import { WebsiteLayout, FlexibleLayoutSection } from '../../models/website-layout.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface SiteConfigResponse {
  success: boolean;
  company?: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

@Component({
  selector: 'app-modular-home',
  standalone: true,
  imports: [CommonModule, DynamicSectionComponent],
  templateUrl: './modular-home.html',
  styleUrls: ['./modular-home.css']
})
export class ModularHomeComponent implements OnInit {
  layout: WebsiteLayout | null = null;
  sections: FlexibleLayoutSection[] = [];
  loading = true;
  error = false;
  companyId: string | null = null;

  constructor(
    private websiteService: WebsiteCustomizationService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadLayout();
  }

  loadLayout() {
    // Get the domain from window location
    const domain = window.location.hostname;
    
    // For local development or if no specific domain is configured,
    // try to get the first available default layout
    // In production, this would use the actual domain
    if (domain === 'localhost' || domain.startsWith('127.0.0.1')) {
      // Try to load default layout from first company with active default layout
      this.loadDefaultLayout();
    } else {
      // Load by domain
      this.loadByDomain(domain);
    }
  }

  loadDefaultLayout() {
    // For development: Try to get any active default home layout
    // We'll make a direct API call to get layouts and find the first active default one
    this.http.get<WebsiteLayout[]>(`${environment.apiUrl}/api/website/layouts?page_type=home`).subscribe({
      next: (layouts) => {
        // Find the first active default layout
        const defaultLayout = layouts.find(l => l.is_active && l.is_default);
        if (defaultLayout) {
          this.layout = defaultLayout;
          this.sections = defaultLayout.layout_config.sections.sort((a, b) => a.order - b.order);
        } else if (layouts.length > 0) {
          // If no default, use first active layout
          const activeLayout = layouts.find(l => l.is_active) || layouts[0];
          this.layout = activeLayout;
          this.sections = activeLayout.layout_config.sections.sort((a, b) => a.order - b.order);
        } else {
          // Use fallback template
          this.sections = this.websiteService.getDefaultTemplate('home');
        }
        this.loading = false;
      },
      error: (err) => {
        console.warn('Could not load layout from API, using default template', err);
        this.sections = this.websiteService.getDefaultTemplate('home');
        this.loading = false;
      }
    });
  }

  loadByDomain(domain: string) {
    // Get site config by domain which includes company_id
    this.http.get<SiteConfigResponse>(`${environment.apiUrl}/api/site-config?domain=${domain}`).subscribe({
      next: (config) => {
        if (config.success && config.company && config.company.id) {
          this.companyId = config.company.id;
          this.loadLayoutForCompany(config.company.id);
        } else {
          this.loadDefaultLayout();
        }
      },
      error: () => {
        this.loadDefaultLayout();
      }
    });
  }

  loadLayoutForCompany(companyId: string) {
    this.websiteService.getActiveLayout(companyId, 'home').subscribe({
      next: (layout) => {
        this.layout = layout;
        this.sections = layout.layout_config.sections.sort((a, b) => a.order - b.order);
        this.loading = false;
      },
      error: (err) => {
        console.warn('Could not load layout for company, using default template', err);
        this.sections = this.websiteService.getDefaultTemplate('home');
        this.loading = false;
      }
    });
  }
}
