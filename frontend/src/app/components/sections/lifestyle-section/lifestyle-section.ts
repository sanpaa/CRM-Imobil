import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lifestyle-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="lifestyle-nav" [ngStyle]="styleConfig">
      <div class="container">
        <h2 *ngIf="title" class="section-title">{{ title }}</h2>
        <div class="lifestyle-grid">
          <div 
            *ngFor="let item of lifestyleItems" 
            class="life-card"
            (click)="navigateToStyle(item.style)"
          >
            <div class="icon-box">
              <i [class]="item.icon"></i>
            </div>
            <h4>{{ item.title }}</h4>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .lifestyle-nav {
      padding: 3rem 0;
      background: #f8f9fa;
    }
    .section-title {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 2rem;
      color: #333;
    }
    .lifestyle-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }
    .life-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .life-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    .icon-box {
      width: 60px;
      height: 60px;
      margin: 0 auto 1rem;
      background: #667eea;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
    }
    .life-card h4 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }
    .life-card p {
      color: #666;
      font-size: 0.95rem;
    }
  `]
})
export class LifestyleSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};

  constructor(private router: Router) {}

  get title(): string {
    return this.config.title || '';
  }

  get lifestyleItems(): any[] {
    return this.config.items || [
      {
        icon: 'fas fa-laptop-house',
        title: 'Home Office Perfeito',
        description: 'Silêncio e conectividade',
        style: 'home-office'
      },
      {
        icon: 'fas fa-dog',
        title: 'Perto de Parques',
        description: 'Espaço para o seu pet',
        style: 'pet-friendly'
      },
      {
        icon: 'fas fa-wine-glass-alt',
        title: 'Refúgio Gourmet',
        description: 'Para quem ama receber',
        style: 'gourmet'
      },
      {
        icon: 'fas fa-cloud-moon',
        title: 'Silêncio Absoluto',
        description: 'Longe do caos urbano',
        style: 'quiet'
      }
    ];
  }

  navigateToStyle(style: string): void {
    this.router.navigate(['/buscar'], {
      queryParams: { estilo: style }
    });
  }
}
