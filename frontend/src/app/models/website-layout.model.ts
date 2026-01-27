import { ComponentType, ComponentConfig, StyleConfig } from './website-component.model';

export type PageType = 'home' | 'properties' | 'property-detail' | 'about' | 'contact' | 'custom';

export interface WebsiteLayout {
  id: string;
  company_id: string;
  name: string;
  page_type: PageType;
  slug?: string;
  is_active: boolean;
  is_default: boolean;
  layout_config: LayoutConfig;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LayoutConfig {
  sections: LayoutSection[];
}

export interface LayoutSection {
  id: string;
  component_type: ComponentType;
  config: ComponentConfig;
  style_config: StyleConfig;
  order: number;
}

// Database structure uses different field names
export interface DatabaseLayoutSection {
  id: string;
  type: ComponentType;  // Database uses 'type' instead of 'component_type'
  config?: ComponentConfig;
  style?: StyleConfig;  // Database uses 'style' instead of 'style_config'
  order: number;
}

// Union type that supports both structures
export type FlexibleLayoutSection = LayoutSection | DatabaseLayoutSection;
