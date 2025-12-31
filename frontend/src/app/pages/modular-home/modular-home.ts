import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicSectionComponent } from '../../components/dynamic-section/dynamic-section';
import { WebsiteCustomizationService } from '../../services/website-customization.service';
import { WebsiteLayout, LayoutSection } from '../../models/website-layout.model';

@Component({
  selector: 'app-modular-home',
  standalone: true,
  imports: [CommonModule, DynamicSectionComponent],
  templateUrl: './modular-home.html',
  styleUrls: ['./modular-home.css']
})
export class ModularHomeComponent implements OnInit {
  layout: WebsiteLayout | null = null;
  sections: LayoutSection[] = [];
  loading = true;
  error = false;
  companyId = 'demo-company-id'; // TODO: Get from auth service

  constructor(
    private websiteService: WebsiteCustomizationService
  ) {}

  ngOnInit() {
    this.loadLayout();
  }

  loadLayout() {
    // Try to load from API first, fallback to default template
    this.websiteService.getActiveLayout(this.companyId, 'home').subscribe({
      next: (layout) => {
        this.layout = layout;
        this.sections = layout.layout_config.sections.sort((a, b) => a.order - b.order);
        this.loading = false;
      },
      error: (err) => {
        console.warn('Could not load layout from API, using default template', err);
        // Use default template as fallback
        this.sections = this.websiteService.getDefaultTemplate('home');
        this.loading = false;
      }
    });
  }
}
