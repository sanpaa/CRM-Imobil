import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar-section',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <section class="search-bar-section" [ngStyle]="styleConfig">
      <div class="container">
        <div class="search-bar">
          <input 
            type="text" 
            [(ngModel)]="searchText" 
            (keyup.enter)="performSearch()"
            [placeholder]="placeholder"
            class="search-input"
          />
          <button class="search-button" (click)="performSearch()">
            <i class="fas fa-search"></i>
            {{ buttonText }}
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .search-bar-section {
      padding: 2rem 0;
    }
    .search-bar {
      display: flex;
      gap: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .search-input {
      flex: 1;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }
    .search-button {
      padding: 1rem 2rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .search-button:hover {
      background: #5568d3;
    }
  `]
})
export class SearchBarSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  searchText = '';

  constructor(private router: Router) {}

  get placeholder(): string {
    return this.config.placeholder || 'Buscar imóveis...';
  }

  get buttonText(): string {
    return this.config.buttonText || 'Buscar';
  }

  performSearch(): void {
    if (!this.searchText.trim()) return;
    this.router.navigate(['/buscar'], {
      queryParams: { search: this.searchText.trim() }
    });
  }
}
