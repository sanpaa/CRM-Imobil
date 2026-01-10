import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { DomainDetectionService } from '../services/domain-detection.service';
import { map } from 'rxjs/operators';

/**
 * Guard to ensure site config is loaded before accessing routes
 * Redirects to error page if domain is not found
 */
export const siteConfigGuard: CanActivateFn = (route, state) => {
  const domainService = inject(DomainDetectionService);
  const router = inject(Router);

  return domainService.isConfigLoaded().pipe(
    map(loaded => {
      if (!loaded) {
        // Still loading
        return false;
      }

      const error = domainService.getConfigErrorValue();
      if (error) {
        // Domain not found or error loading config
        console.error('Site config error:', error);
        return false;
      }

      const config = domainService.getSiteConfigValue();
      if (!config) {
        console.error('No site config available');
        return false;
      }

      // Config loaded successfully
      return true;
    })
  );
};

/**
 * Guard to check if a specific page exists
 * Used for dynamic routing
 */
export const pageExistsGuard: CanActivateFn = (route, state) => {
  const domainService = inject(DomainDetectionService);
  const router = inject(Router);

  const slug = route.params['slug'] || '/';
  const page = domainService.getPageBySlug(slug);

  if (!page) {
    console.warn('Page not found:', slug);
    router.navigate(['/404']);
    return false;
  }

  return true;
};
