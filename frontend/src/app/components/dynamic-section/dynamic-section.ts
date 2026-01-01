import { Component, Input, OnInit, ViewChild, ViewContainerRef, ComponentRef, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutSection } from '../../models/website-layout.model';

// Import all section component types
import { HeroSectionComponent } from '../sections/hero-section/hero-section';
import { PropertyGridSectionComponent } from '../sections/property-grid-section/property-grid-section';
import { SearchBarSectionComponent } from '../sections/search-bar-section/search-bar-section';
import { ContactFormSectionComponent } from '../sections/contact-form-section/contact-form-section';
import { TextBlockSectionComponent } from '../sections/text-block-section/text-block-section';
import { StatsSectionComponent } from '../sections/stats-section/stats-section';
import { TestimonialsSectionComponent } from '../sections/testimonials-section/testimonials-section';
import { TeamSectionComponent } from '../sections/team-section/team-section';
import { AboutSectionComponent } from '../sections/about-section/about-section';
import { MapSectionComponent } from '../sections/map-section/map-section';
import { ImageGallerySectionComponent } from '../sections/image-gallery-section/image-gallery-section';
import { VideoSectionComponent } from '../sections/video-section/video-section';
import { CtaButtonSectionComponent } from '../sections/cta-button-section/cta-button-section';
import { DividerSectionComponent } from '../sections/divider-section/divider-section';
import { SpacerSectionComponent } from '../sections/spacer-section/spacer-section';
import { LifestyleSectionComponent } from '../sections/lifestyle-section/lifestyle-section';

@Component({
  selector: 'app-dynamic-section',
  standalone: true,
  imports: [CommonModule],
  template: `<div #container [ngStyle]="getSectionStyles()"></div>`,
  styles: []
})
export class DynamicSectionComponent implements OnInit {
  @Input() section!: LayoutSection;
  @Input() companyData: any;
  @ViewChild('container', { read: ViewContainerRef, static: true }) container!: ViewContainerRef;

  private componentMap: { [key: string]: Type<any> } = {
    'hero': HeroSectionComponent,
    'property-grid': PropertyGridSectionComponent,
    'search-bar': SearchBarSectionComponent,
    'contact-form': ContactFormSectionComponent,
    'text-block': TextBlockSectionComponent,
    'stats-section': StatsSectionComponent,
    'testimonials': TestimonialsSectionComponent,
    'team-section': TeamSectionComponent,
    'about-section': AboutSectionComponent,
    'map-section': MapSectionComponent,
    'image-gallery': ImageGallerySectionComponent,
    'video-section': VideoSectionComponent,
    'cta-button': CtaButtonSectionComponent,
    'divider': DividerSectionComponent,
    'spacer': SpacerSectionComponent,
    'lifestyle-section': LifestyleSectionComponent
  };

  ngOnInit() {
    this.loadComponent();
  }

  loadComponent() {
    const componentType = this.componentMap[this.section.component_type];
    
    if (!componentType) {
      console.warn(`Component type ${this.section.component_type} not found`);
      return;
    }

    this.container.clear();
    const componentRef: ComponentRef<any> = this.container.createComponent(componentType);
    
    // Pass configuration to the component
    componentRef.instance.config = this.section.config || {};
    componentRef.instance.styleConfig = this.section.style_config || {};
    
    // Pass company data if available
    if (this.companyData) {
      componentRef.instance.companyData = this.companyData;
    }
  }

  getSectionStyles(): any {
    const styles: any = {};
    
    if (this.section.style_config) {
      if (this.section.style_config.backgroundColor) {
        styles['background-color'] = this.section.style_config.backgroundColor;
      }
      if (this.section.style_config.textColor) {
        styles['color'] = this.section.style_config.textColor;
      }
      if (this.section.style_config.padding) {
        styles['padding'] = this.section.style_config.padding;
      }
      if (this.section.style_config.margin) {
        styles['margin'] = this.section.style_config.margin;
      }
    }
    
    return styles;
  }
}
