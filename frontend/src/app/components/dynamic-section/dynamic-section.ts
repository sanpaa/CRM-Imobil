import { Component, Input, OnInit, ViewChild, ViewContainerRef, ComponentRef, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexibleLayoutSection, DatabaseLayoutSection } from '../../models/website-layout.model';

// Import all section component types
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
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
import { FaqSectionComponent } from '../sections/faq-section/faq-section';
import { FeaturesGridSectionComponent } from '../sections/features-grid-section/features-grid-section';
import { NewsletterSectionComponent } from '../sections/newsletter-section/newsletter-section';
import { MortgageCalculatorSectionComponent } from '../sections/mortgage-calculator-section/mortgage-calculator-section';
import { CustomCodeSectionComponent } from '../sections/custom-code-section/custom-code-section';
import { FlexContainerSectionComponent } from '../sections/flex-container-section/flex-container-section';
import { GridContainerSectionComponent } from '../sections/grid-container-section/grid-container-section';

@Component({
  selector: 'app-dynamic-section',
  standalone: true,
  imports: [CommonModule],
  template: `<div #container [ngStyle]="getSectionStyles()"></div>`,
  styles: []
})
export class DynamicSectionComponent implements OnInit {
  @Input() section!: FlexibleLayoutSection;
  @Input() companyData: any;
  @Input() companyId: string | null = null;
  @ViewChild('container', { read: ViewContainerRef, static: true }) container!: ViewContainerRef;

  private componentMap: { [key: string]: Type<any> } = {
    'header': HeaderComponent,
    'footer': FooterComponent,
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
    'lifestyle-section': LifestyleSectionComponent,
    'faq': FaqSectionComponent,
    'features-grid': FeaturesGridSectionComponent,
    'newsletter': NewsletterSectionComponent,
    'mortgage-calculator': MortgageCalculatorSectionComponent,
    'custom-code': CustomCodeSectionComponent,
    'flex-container': FlexContainerSectionComponent,
    'grid-container': GridContainerSectionComponent
  };

  ngOnInit() {
    this.loadComponent();
  }

  // Helper to check if section is using database structure
  private isDatabaseSection(section: FlexibleLayoutSection): section is DatabaseLayoutSection {
    return 'type' in section;
  }

  // Helper to get component type from either structure
  private getComponentType(section: FlexibleLayoutSection): string {
    return this.isDatabaseSection(section) ? section.type : section.component_type;
  }

  // Helper to get config from either structure
  private getConfig(section: FlexibleLayoutSection): any {
    if (this.isDatabaseSection(section)) {
      return section.config || {};
    }
    return section.config || {};
  }

  // Helper to get style config from either structure
  private getStyleConfig(section: FlexibleLayoutSection): any {
    if (this.isDatabaseSection(section)) {
      return section.style || {};
    }
    return section.style_config || {};
  }

  loadComponent() {
    const componentType = this.getComponentType(this.section);
    const component = this.componentMap[componentType];
    
    if (!component) {
      console.warn(`Component type ${componentType} not found`);
      return;
    }

    this.container.clear();
    const componentRef: ComponentRef<any> = this.container.createComponent(component);
    
    // Pass companyId to the component if it accepts it
    if (componentRef.instance.companyId !== undefined) {
      componentRef.instance.companyId = this.companyId;
    }
    
    // Pass configuration to the component
    componentRef.instance.config = this.getConfig(this.section);
    componentRef.instance.styleConfig = this.getStyleConfig(this.section);
    
    // Pass company data if available
    if (this.companyData) {
      componentRef.instance.companyData = this.companyData;
    }
  }

  getSectionStyles(): any {
    const componentType = this.getComponentType(this.section);
    
    // Header e Footer aplicam suas próprias cores do footer_config
    // Não aplicar estilos no wrapper para evitar duplicação
    if (componentType === 'header' || componentType === 'footer') {
      return {};
    }
    
    const styles: any = {};
    const styleConfig = this.getStyleConfig(this.section);
    
    if (styleConfig.backgroundColor) {
      styles['background-color'] = styleConfig.backgroundColor;
    }
    if (styleConfig.textColor) {
      styles['color'] = styleConfig.textColor;
    }
    if (styleConfig.padding) {
      styles['padding'] = styleConfig.padding;
    }
    if (styleConfig.margin) {
      styles['margin'] = styleConfig.margin;
    }
    
    return styles;
  }
}
