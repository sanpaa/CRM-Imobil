import { ApplicationRef, EnvironmentInjector, Injectable, NgZone, createComponent } from '@angular/core';
import { getRegistry } from '@crm-imobil/components';

export interface HydrationOptions {
  companyId?: string | null;
  lazy?: boolean;
  logMissing?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HtmlHydratorService {
  private hydratedNodes = new WeakSet<Element>();
  private lazyQueue = new Map<Element, () => void>();
  private observer?: IntersectionObserver;

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector,
    private zone: NgZone
  ) {}

  hydrate(root: HTMLElement, options: HydrationOptions = {}): void {
    if (!root) {
      return;
    }

    const registry = getRegistry();
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-component]'));

    nodes.forEach((node) => {
      this.hydrateNode(node, registry, options);
    });
  }

  private hydrateNode(
    node: HTMLElement,
    registry: Record<string, any>,
    options: HydrationOptions
  ): void {
    if (this.hydratedNodes.has(node)) {
      return;
    }

    const type = node.getAttribute('data-component');
    if (!type) {
      return;
    }

    const componentId = node.getAttribute('data-component-id');
    const config = this.safeParse(node.getAttribute('data-config'));
    const style = this.safeParse(node.getAttribute('data-style'));

    const ComponentClass = registry[type];
    if (!ComponentClass) {
      if (options.logMissing !== false) {
        console.warn(`[HtmlHydrator] Component not registered: ${type}`);
      }
      return;
    }

    const hydrateNow = () => {
      if (this.hydratedNodes.has(node)) {
        return;
      }

      const compRef = createComponent(ComponentClass as any, {
        environmentInjector: this.injector
      });

      Object.assign(compRef.instance as any, {
        config,
        style,
        companyId: options.companyId ?? null,
        componentId: componentId || null
      });

      this.appRef.attachView(compRef.hostView);
      node.replaceWith(compRef.location.nativeElement);
      compRef.changeDetectorRef.detectChanges();

      this.hydratedNodes.add(node);
    };

    if (options.lazy) {
      this.observe(node, hydrateNow);
      return;
    }

    hydrateNow();
  }

  private observe(node: HTMLElement, hydrateNow: () => void): void {
    this.ensureObserver();
    if (!this.observer) {
      hydrateNow();
      return;
    }

    this.lazyQueue.set(node, hydrateNow);
    this.observer.observe(node);
  }

  private ensureObserver(): void {
    if (this.observer || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const target = entry.target as HTMLElement;
            const hydrateNow = this.lazyQueue.get(target);
            if (!hydrateNow) {
              return;
            }

            this.lazyQueue.delete(target);
            this.observer?.unobserve(target);

            this.zone.run(() => {
              hydrateNow();
            });
          });
        },
        { rootMargin: '200px 0px' }
      );
    });
  }

  private safeParse(value: string | null): any {
    if (!value) {
      return {};
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('[HtmlHydrator] Failed to parse JSON:', value, error);
      return {};
    }
  }
}
