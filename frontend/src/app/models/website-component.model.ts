export type ComponentType =
  | 'header'
  | 'footer'
  | 'hero'
  | 'property-grid'
  | 'property-card'
  | 'search-bar'
  | 'contact-form'
  | 'testimonials'
  | 'about-section'
  | 'stats-section'
  | 'team-section'
  | 'map-section'
  | 'text-block'
  | 'image-gallery'
  | 'video-section'
  | 'cta-button'
  | 'divider'
  | 'spacer'
  | 'lifestyle-section';

export interface WebsiteComponent {
  id: string;
  company_id: string;
  name: string;
  component_type: ComponentType;
  config: ComponentConfig;
  style_config: StyleConfig;
  is_reusable: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ComponentConfig {
  [key: string]: any;
}

export interface StyleConfig {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  [key: string]: any;
}

export interface ComponentLibraryItem {
  type: ComponentType;
  name: string;
  description: string;
  icon: string;
  category: 'navigation' | 'content' | 'properties' | 'forms' | 'layout' | 'special';
  defaultConfig: ComponentConfig;
  defaultStyleConfig: StyleConfig;
}
