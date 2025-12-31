import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { WebsiteCustomizationService } from '../../services/website-customization.service';
import { WebsiteLayout, LayoutSection } from '../../models/website-layout.model';

@Component({
  selector: 'app-public-website',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-website.html',
  styleUrls: ['./public-website.css']
})
export class PublicWebsiteComponent implements OnInit {
  layout: WebsiteLayout | null = null;
  companyId: string = '';
  pageType: string = 'home';
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private websiteService: WebsiteCustomizationService
  ) {}

  ngOnInit() {
    // Get company ID and page type from route or hostname
    this.route.queryParams.subscribe(params => {
      this.companyId = params['company_id'] || 'demo-company-id';
      this.pageType = params['page_type'] || 'home';
      this.loadLayout();
    });
  }

  loadLayout() {
    this.loading = true;
    this.websiteService.getActiveLayout(this.companyId, this.pageType).subscribe({
      next: (layout) => {
        this.layout = layout;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading layout:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  getSectionStyles(section: LayoutSection): any {
    return {
      'background-color': section.style_config.backgroundColor || '#ffffff',
      'color': section.style_config.textColor || '#333333',
      'padding': section.style_config.padding || '2rem',
      'margin': section.style_config.margin || '0'
    };
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }
}
