export interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  custom_domain?: string;
  website_enabled: boolean;
  website_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StoreSettings {
  id?: string;
  company_id: string;
  layout_config?: LayoutConfigSettings;
  theme_config?: ThemeConfig;
  social_links?: SocialLinks;
  business_hours?: BusinessHours;
  header_image?: string;
  footer_text?: string;
  show_properties_count?: boolean;
  contact_form_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LayoutConfigSettings {
  [key: string]: any;
}

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  [key: string]: any;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  whatsapp?: string;
  [key: string]: any;
}

export interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
  [key: string]: any;
}
