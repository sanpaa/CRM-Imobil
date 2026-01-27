import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomainDetectionService } from '../../services/domain-detection.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <h1 class="error-code">404</h1>
        <h2>Página não encontrada</h2>
        <p class="error-message">
          A página que você está procurando não existe ou foi removida.
        </p>
        <div class="actions">
          <button (click)="goHome()" class="btn-primary">
            Voltar para Home
          </button>
          <button (click)="goBack()" class="btn-secondary">
            Voltar
          </button>
        </div>
        <div *ngIf="companyName" class="company-info">
          <p>{{ companyName }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 2rem;
      background: var(--background);
    }

    .not-found-content {
      text-align: center;
      max-width: 600px;
    }

    .error-code {
      font-size: 8rem;
      font-weight: 700;
      color: var(--primary);
      margin: 0;
      line-height: 1;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    h2 {
      font-size: 2rem;
      color: var(--text);
      margin: 1rem 0;
    }

    .error-message {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin-bottom: 2rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: var(--border-radius);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-primary {
      background: var(--button-primary);
      color: white;
    }

    .btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .btn-secondary {
      background: var(--surface);
      color: var(--text);
      border: 2px solid var(--button-secondary);
    }

    .btn-secondary:hover {
      background: var(--button-secondary);
      color: white;
    }

    .company-info {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--surface);
    }

    .company-info p {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .error-code {
        font-size: 5rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      .actions {
        flex-direction: column;
      }

      .btn-primary, .btn-secondary {
        width: 100%;
      }
    }
  `]
})
export class NotFoundComponent implements OnInit {
  companyName: string = '';

  constructor(
    private router: Router,
    private domainService: DomainDetectionService
  ) {}

  ngOnInit(): void {
    const company = this.domainService.getCompanyInfo();
    if (company) {
      this.companyName = company.name;
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }
}
