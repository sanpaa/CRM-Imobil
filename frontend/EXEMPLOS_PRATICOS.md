# 💡 Exemplos Práticos - Sistema Multi-Tenant

## 📘 Casos de Uso Comuns

### 1. Criar um Novo Componente que usa o Tema

```typescript
// src/app/components/meu-componente/meu-componente.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meu-componente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>{{ titulo }}</h2>
      <button class="btn-primary">Clique aqui</button>
    </div>
  `,
  styles: [`
    /* ✅ CORRETO - Usar CSS Variables */
    .container {
      background: var(--background);
      color: var(--text);
      padding: 2rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-md);
    }

    h2 {
      color: var(--primary);
      font-family: var(--font-family-heading);
    }

    .btn-primary {
      background: var(--button-primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }

    /* ❌ ERRADO - Nunca fazer isso */
    /* 
    .container {
      background: #ffffff;  // ❌ Hardcode
      color: #000000;       // ❌ Hardcode
    }
    */
  `]
})
export class MeuComponente {
  titulo = 'Meu Componente';
}
```

---

### 2. Acessar Informações da Empresa no Componente

```typescript
// src/app/components/info-empresa/info-empresa.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomainDetectionService } from '../../services/domain-detection.service';

@Component({
  selector: 'app-info-empresa',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="company-info">
      <img [src]="logo" [alt]="nome" />
      <h3>{{ nome }}</h3>
      <p>{{ descricao }}</p>
      <div class="contact">
        <a [href]="'tel:' + telefone">{{ telefone }}</a>
        <a [href]="'mailto:' + email">{{ email }}</a>
      </div>
    </div>
  `,
  styles: [`
    .company-info {
      text-align: center;
      padding: 2rem;
      background: var(--surface);
      border-radius: var(--border-radius);
    }

    img {
      max-width: 200px;
      height: auto;
    }

    h3 {
      color: var(--primary);
      margin: 1rem 0;
    }

    p {
      color: var(--text-secondary);
    }

    .contact a {
      color: var(--primary);
      margin: 0 1rem;
      text-decoration: none;
    }
  `]
})
export class InfoEmpresaComponent implements OnInit {
  logo = '';
  nome = '';
  descricao = '';
  telefone = '';
  email = '';

  constructor(private domainService: DomainDetectionService) {}

  ngOnInit(): void {
    const config = this.domainService.getSiteConfigValue();
    
    if (config) {
      const company = config.company;
      const visual = config.visualConfig;

      this.logo = visual.branding?.logo || company.logo_url || '';
      this.nome = company.name;
      this.descricao = company.description || '';
      this.telefone = company.phone || '';
      this.email = company.email || '';
    }
  }
}
```

---

### 3. Criar Página Dinâmica com SEO

```typescript
// src/app/pages/sobre/sobre.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomainDetectionService } from '../../services/domain-detection.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sobre-page">
      <section class="hero">
        <h1>Sobre {{ nomeEmpresa }}</h1>
        <p>{{ tagline }}</p>
      </section>

      <section class="content">
        <div class="container">
          <img [src]="logo" [alt]="nomeEmpresa" />
          <div class="text">
            <h2>Nossa História</h2>
            <p>{{ descricao }}</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      padding: 4rem 2rem;
      text-align: center;
    }

    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: white;
    }

    .content {
      padding: 4rem 2rem;
      background: var(--background);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 2rem;
      align-items: center;
    }

    img {
      max-width: 100%;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
    }

    .text h2 {
      color: var(--primary);
      margin-bottom: 1rem;
    }

    .text p {
      color: var(--text);
      line-height: 1.8;
    }

    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SobreComponent implements OnInit {
  nomeEmpresa = '';
  tagline = '';
  logo = '';
  descricao = '';

  constructor(
    private domainService: DomainDetectionService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    const config = this.domainService.getSiteConfigValue();
    
    if (config) {
      this.nomeEmpresa = config.company.name;
      this.tagline = config.visualConfig.branding?.tagline || '';
      this.logo = config.visualConfig.branding?.logo || '';
      this.descricao = config.company.description || '';

      // Atualizar SEO
      this.seoService.setTitle(`Sobre ${this.nomeEmpresa}`);
      this.seoService.setDescription(`Conheça a história de ${this.nomeEmpresa}`);
    }
  }
}
```

---

### 4. Componente com Loading e Error States

```typescript
// src/app/components/imoveis-destaque/imoveis-destaque.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyService } from '../../services/property';
import { DomainDetectionService } from '../../services/domain-detection.service';

@Component({
  selector: 'app-imoveis-destaque',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="featured-properties">
      <h2>Imóveis em Destaque</h2>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Carregando imóveis...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="hasError" class="error">
        <p>⚠️ Erro ao carregar imóveis</p>
        <button (click)="carregar()">Tentar novamente</button>
      </div>

      <!-- Success State -->
      <div *ngIf="!isLoading && !hasError" class="grid">
        <div *ngFor="let imovel of imoveis" class="card">
          <img [src]="imovel.images[0]" [alt]="imovel.title" />
          <h3>{{ imovel.title }}</h3>
          <p class="price">{{ imovel.price | currency:'BRL' }}</p>
          <button class="btn">Ver Detalhes</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .featured-properties {
      padding: 4rem 2rem;
      background: var(--surface);
    }

    h2 {
      text-align: center;
      color: var(--primary);
      margin-bottom: 2rem;
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--surface);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .card {
      background: var(--background);
      border-radius: var(--border-radius);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      transition: var(--transition);
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .card img {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .card h3 {
      padding: 1rem;
      color: var(--text);
      font-size: 1.125rem;
    }

    .price {
      padding: 0 1rem;
      color: var(--primary);
      font-size: 1.5rem;
      font-weight: 700;
    }

    .btn {
      width: 100%;
      padding: 1rem;
      background: var(--button-primary);
      color: white;
      border: none;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn:hover {
      opacity: 0.9;
    }
  `]
})
export class ImoveisDestaqueComponent implements OnInit {
  imoveis: any[] = [];
  isLoading = true;
  hasError = false;

  constructor(
    private propertyService: PropertyService,
    private domainService: DomainDetectionService
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.isLoading = true;
    this.hasError = false;

    const companyId = this.domainService.getCompanyInfo()?.id;

    if (!companyId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.propertyService.getProperties({ 
      companyId, 
      featured: true, 
      limit: 6 
    }).subscribe({
      next: (response) => {
        this.imoveis = response.data || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar imóveis:', error);
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }
}
```

---

### 5. Guard Customizado para Página Específica

```typescript
// src/app/guards/empresa-ativa.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { DomainDetectionService } from '../services/domain-detection.service';
import { map } from 'rxjs/operators';

export const empresaAtivaGuard: CanActivateFn = (route, state) => {
  const domainService = inject(DomainDetectionService);
  const router = inject(Router);

  return domainService.getSiteConfig().pipe(
    map(config => {
      if (!config) {
        router.navigate(['/404']);
        return false;
      }

      // Verificar se empresa está ativa (exemplo)
      const companyId = config.company.id;
      if (!companyId) {
        router.navigate(['/manutencao']);
        return false;
      }

      return true;
    })
  );
};

// Uso nas rotas:
{
  path: 'area-cliente',
  component: AreaClienteComponent,
  canActivate: [empresaAtivaGuard]
}
```

---

### 6. Service para WhatsApp com Info da Empresa

```typescript
// src/app/services/whatsapp.service.ts
import { Injectable } from '@angular/core';
import { DomainDetectionService } from './domain-detection.service';

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  constructor(private domainService: DomainDetectionService) {}

  /**
   * Abre conversa no WhatsApp com mensagem pré-definida
   */
  enviarMensagem(mensagem: string): void {
    const company = this.domainService.getCompanyInfo();
    
    if (!company?.whatsapp) {
      console.error('WhatsApp não configurado para esta empresa');
      return;
    }

    const numero = company.whatsapp.replace(/\D/g, '');
    const mensagemEncoded = encodeURIComponent(mensagem);
    const url = `https://wa.me/${numero}?text=${mensagemEncoded}`;

    window.open(url, '_blank');
  }

  /**
   * Mensagem padrão para interesse em imóvel
   */
  interesseImovel(imovelId: string, imovelTitulo: string): void {
    const company = this.domainService.getCompanyInfo();
    const mensagem = `Olá ${company?.name}! Tenho interesse no imóvel: ${imovelTitulo} (ID: ${imovelId})`;
    this.enviarMensagem(mensagem);
  }
}

// Uso no componente:
constructor(private whatsappService: WhatsappService) {}

entrarEmContato() {
  this.whatsappService.interesseImovel('123', 'Apartamento Jardins');
}
```

---

### 7. Pipe Customizado com Tema

```typescript
// src/app/pipes/cor-status.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { ThemeService } from '../services/theme.service';

@Pipe({
  name: 'corStatus',
  standalone: true
})
export class CorStatusPipe implements PipeTransform {
  constructor(private themeService: ThemeService) {}

  transform(status: string): string {
    const theme = this.themeService.getCurrentThemeValue();

    const cores: { [key: string]: string } = {
      'disponivel': theme.success,
      'vendido': theme.error,
      'reservado': theme.warning,
      'alugado': theme.info
    };

    return cores[status] || theme.text;
  }
}

// Uso no template:
<span [style.color]="imovel.status | corStatus">
  {{ imovel.status }}
</span>
```

---

## 🎓 Boas Práticas

### ✅ SEMPRE:
1. Usar CSS Variables para cores e estilos
2. Obter dados da empresa via `DomainDetectionService`
3. Atualizar SEO em páginas importantes
4. Tratar estados de loading e erro
5. Testar com múltiplos domínios

### ❌ NUNCA:
1. Hardcode de cores (#fff, #000, rgb(), etc)
2. Hardcode de logos ou assets
3. Lógica específica baseada em nome de empresa
4. Código duplicado por cliente

---

**Versão:** 1.0.0  
**Data:** Janeiro 2026
