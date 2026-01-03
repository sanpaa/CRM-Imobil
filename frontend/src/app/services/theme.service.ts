import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ThemeConfig {
  // Core colors
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  
  // Component specific
  headerBg: string;
  headerText: string;
  footerBg: string;
  footerText: string;
  buttonPrimary: string;
  buttonSecondary: string;
  
  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Typography
  fontFamily: string;
  fontFamilyHeading: string;
  
  // Spacing (optional)
  borderRadius: string;
  shadowColor: string;
}

const DEFAULT_THEME: ThemeConfig = {
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#f59e0b',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#0f172a',
  textSecondary: '#64748b',
  headerBg: '#ffffff',
  headerText: '#0f172a',
  footerBg: '#0f172a',
  footerText: '#ffffff',
  buttonPrimary: '#2563eb',
  buttonSecondary: '#64748b',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontFamilyHeading: 'Inter, system-ui, sans-serif',
  borderRadius: '0.5rem',
  shadowColor: 'rgba(0, 0, 0, 0.1)'
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme$ = new BehaviorSubject<ThemeConfig>(DEFAULT_THEME);
  private isThemeLoaded$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // Apply default theme on initialization
    this.applyTheme(DEFAULT_THEME);
  }

  /**
   * Get current theme as observable
   */
  getCurrentTheme(): Observable<ThemeConfig> {
    return this.currentTheme$.asObservable();
  }

  /**
   * Get current theme value
   */
  getCurrentThemeValue(): ThemeConfig {
    return this.currentTheme$.value;
  }

  /**
   * Check if theme is loaded
   */
  isThemeLoaded(): Observable<boolean> {
    return this.isThemeLoaded$.asObservable();
  }

  /**
   * Apply theme to the document
   */
  applyTheme(theme: Partial<ThemeConfig>): void {
    if (typeof document === 'undefined') {
      return;
    }

    const mergedTheme = { ...DEFAULT_THEME, ...theme };
    const root = document.documentElement;

    // Apply all theme variables to CSS custom properties
    root.style.setProperty('--primary', mergedTheme.primary);
    root.style.setProperty('--secondary', mergedTheme.secondary);
    root.style.setProperty('--accent', mergedTheme.accent);
    root.style.setProperty('--background', mergedTheme.background);
    root.style.setProperty('--surface', mergedTheme.surface);
    root.style.setProperty('--text', mergedTheme.text);
    root.style.setProperty('--text-secondary', mergedTheme.textSecondary);
    
    root.style.setProperty('--header-bg', mergedTheme.headerBg);
    root.style.setProperty('--header-text', mergedTheme.headerText);
    root.style.setProperty('--footer-bg', mergedTheme.footerBg);
    root.style.setProperty('--footer-text', mergedTheme.footerText);
    root.style.setProperty('--button-primary', mergedTheme.buttonPrimary);
    root.style.setProperty('--button-secondary', mergedTheme.buttonSecondary);
    
    root.style.setProperty('--success', mergedTheme.success);
    root.style.setProperty('--error', mergedTheme.error);
    root.style.setProperty('--warning', mergedTheme.warning);
    root.style.setProperty('--info', mergedTheme.info);
    
    root.style.setProperty('--font-family', mergedTheme.fontFamily);
    root.style.setProperty('--font-family-heading', mergedTheme.fontFamilyHeading);
    root.style.setProperty('--border-radius', mergedTheme.borderRadius);
    root.style.setProperty('--shadow-color', mergedTheme.shadowColor);

    // Update state
    this.currentTheme$.next(mergedTheme);
    this.isThemeLoaded$.next(true);
  }

  /**
   * Load theme from site configuration
   */
  loadThemeFromConfig(visualConfig: any, companyData?: any): void {
    const theme: Partial<ThemeConfig> = {};

    // Map visualConfig to ThemeConfig
    if (visualConfig.theme) {
      if (visualConfig.theme.primaryColor) theme.primary = visualConfig.theme.primaryColor;
      if (visualConfig.theme.secondaryColor) theme.secondary = visualConfig.theme.secondaryColor;
      if (visualConfig.theme.fontFamily) theme.fontFamily = visualConfig.theme.fontFamily;
      if (visualConfig.theme.backgroundColor) theme.background = visualConfig.theme.backgroundColor;
      if (visualConfig.theme.textColor) theme.text = visualConfig.theme.textColor;
      if (visualConfig.theme.accentColor) theme.accent = visualConfig.theme.accentColor;
    }

    // Header/Footer colors from footer_config (highest priority)
    if (companyData?.footer_config) {
      if (companyData.footer_config.backgroundColor) {
        theme.headerBg = companyData.footer_config.backgroundColor;
        theme.footerBg = companyData.footer_config.backgroundColor;
      }
      if (companyData.footer_config.textColor) {
        theme.headerText = companyData.footer_config.textColor;
        theme.footerText = companyData.footer_config.textColor;
      }
    }

    // Header colors from visualConfig.layout (fallback)
    if (visualConfig.layout?.header) {
      if (!theme.headerBg && visualConfig.layout.header.backgroundColor) 
        theme.headerBg = visualConfig.layout.header.backgroundColor;
      if (!theme.headerText && visualConfig.layout.header.textColor) 
        theme.headerText = visualConfig.layout.header.textColor;
    }

    // Footer colors from visualConfig.layout (fallback)
    if (visualConfig.layout?.footer) {
      if (!theme.footerBg && visualConfig.layout.footer.backgroundColor) 
        theme.footerBg = visualConfig.layout.footer.backgroundColor;
      if (!theme.footerText && visualConfig.layout.footer.textColor) 
        theme.footerText = visualConfig.layout.footer.textColor;
    }

    this.applyTheme(theme);
  }

  /**
   * Reset to default theme
   */
  resetTheme(): void {
    this.applyTheme(DEFAULT_THEME);
  }
}
