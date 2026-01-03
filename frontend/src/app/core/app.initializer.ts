import { APP_INITIALIZER, Provider } from '@angular/core';
import { DomainDetectionService } from '../services/domain-detection.service';
import { ThemeService } from '../services/theme.service';

/**
 * Factory function for APP_INITIALIZER
 * This ensures the domain and site config are loaded before the app starts
 */
export function initializeApp(
  domainService: DomainDetectionService,
  themeService: ThemeService
) {
  return (): Promise<any> => {
    return new Promise((resolve) => {
      domainService.initialize()
        .then(config => {
          // Apply theme from loaded config
          if (config?.visualConfig) {
            themeService.loadThemeFromConfig(config.visualConfig, config.company);
          }
          console.log('✅ App initialized successfully');
          resolve(true);
        })
        .catch(error => {
          console.warn('⚠️ Continuing without backend config');
          themeService.applyTheme({});
          resolve(true);
        });
    });
  };
}

/**
 * Provider for app initialization
 * Add this to your app.config.ts providers array
 */
export const appInitializerProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeApp,
  deps: [DomainDetectionService, ThemeService],
  multi: true
};
