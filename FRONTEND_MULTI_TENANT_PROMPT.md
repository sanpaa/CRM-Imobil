# 🎨 Prompt para Adaptar o Frontend CRM para Multi-Tenant

## 📋 Contexto

O backend do CRM já foi adaptado para multi-tenant com:
- ✅ Tabelas de assinatura (subscription_plans, tenant_subscriptions)
- ✅ Middleware de tenant context (tenantMiddleware.js)
- ✅ Serviço de assinaturas (SubscriptionService.js)
- ✅ Rotas de API para planos (/api/subscriptions/*)
- ✅ Tenant_id adicionado em todas as tabelas principais
- ✅ Validação de limites por plano

## 🎯 Objetivo da Adaptação do Frontend

Adaptar o frontend Angular para:
1. **Exibir informações de assinatura e limites**
2. **Restringir funcionalidades baseado no plano**
3. **Permitir upgrade/downgrade de planos**
4. **Mostrar uso atual vs limites (usuários, imóveis)**
5. **Corrigir acesso à página de pricing**
6. **Adicionar avisos quando limites forem atingidos**

## 🔧 Tarefas Específicas

### 1. Criar Serviço de Assinatura (subscription.service.ts)

```typescript
// frontend/src/app/services/subscription.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_properties: number;
  additional_user_price: number;
  activation_fee: number;
  features: {
    gestao_atendimentos: boolean;
    transferencia_leads: boolean;
    app_mobile: boolean;
    landing_page: boolean;
    treinamento_online: boolean;
    blog: boolean;
    suporte_vip: boolean;
    customer_success: boolean;
    api_imoveis: boolean;
    portal_corretor: boolean;
    treinamentos_gratuitos?: number;
  };
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  started_at: string;
  expires_at?: string;
  current_users: number;
  current_properties: number;
  subscription_plans: SubscriptionPlan;
}

export interface UsageStats {
  users: {
    current: number;
    max: number;
    percentage: number;
  };
  properties: {
    current: number;
    max: number | 'unlimited';
    percentage: number;
  };
  plan: string;
  features: any;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = '/api/subscriptions';

  constructor(private http: HttpClient) {}

  // Obter todos os planos disponíveis
  getPlans(): Observable<{ success: boolean; plans: SubscriptionPlan[] }> {
    return this.http.get<{ success: boolean; plans: SubscriptionPlan[] }>(`${this.apiUrl}/plans`);
  }

  // Obter plano específico
  getPlan(identifier: string): Observable<{ success: boolean; plan: SubscriptionPlan }> {
    return this.http.get<{ success: boolean; plan: SubscriptionPlan }>(`${this.apiUrl}/plans/${identifier}`);
  }

  // Obter assinatura atual do tenant
  getCurrentSubscription(): Observable<{ success: boolean; subscription: TenantSubscription | null }> {
    return this.http.get<{ success: boolean; subscription: TenantSubscription | null }>(`${this.apiUrl}/current`);
  }

  // Obter limites e uso atual
  getUsageStats(): Observable<{ success: boolean; stats: UsageStats }> {
    return this.http.get<{ success: boolean; stats: UsageStats }>(`${this.apiUrl}/usage`);
  }

  // Criar assinatura
  subscribe(planId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/subscribe`, { planId });
  }

  // Trocar plano
  changePlan(planId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/change-plan`, { planId });
  }

  // Cancelar assinatura
  cancelSubscription(): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancel`, {});
  }

  // Verificar acesso a feature
  checkFeatureAccess(featureName: string): Observable<{ success: boolean; hasAccess: boolean; planName: string }> {
    return this.http.get<any>(`${this.apiUrl}/feature/${featureName}`);
  }
}
```

### 2. Criar Componente de Gerenciamento de Assinatura

```typescript
// frontend/src/app/pages/subscription-management/subscription-management.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService, TenantSubscription, SubscriptionPlan, UsageStats } from '../../services/subscription.service';

@Component({
  selector: 'app-subscription-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-management.html',
  styleUrls: ['./subscription-management.css']
})
export class SubscriptionManagementComponent implements OnInit {
  currentSubscription: TenantSubscription | null = null;
  availablePlans: SubscriptionPlan[] = [];
  usageStats: UsageStats | null = null;
  loading = false;
  error: string | null = null;

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit() {
    this.loadSubscriptionData();
  }

  loadSubscriptionData() {
    this.loading = true;
    this.error = null;

    // Carregar assinatura atual
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (response) => {
        this.currentSubscription = response.subscription;
      },
      error: (err) => {
        console.error('Error loading subscription:', err);
        this.error = 'Erro ao carregar assinatura';
      }
    });

    // Carregar planos disponíveis
    this.subscriptionService.getPlans().subscribe({
      next: (response) => {
        this.availablePlans = response.plans;
      },
      error: (err) => {
        console.error('Error loading plans:', err);
      }
    });

    // Carregar estatísticas de uso
    this.subscriptionService.getUsageStats().subscribe({
      next: (response) => {
        this.usageStats = response.stats;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading usage stats:', err);
        this.loading = false;
      }
    });
  }

  changePlan(planId: string) {
    if (confirm('Deseja realmente alterar seu plano?')) {
      this.subscriptionService.changePlan(planId).subscribe({
        next: () => {
          alert('Plano alterado com sucesso!');
          this.loadSubscriptionData();
        },
        error: (err) => {
          console.error('Error changing plan:', err);
          alert('Erro ao alterar plano');
        }
      });
    }
  }

  cancelSubscription() {
    if (confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      this.subscriptionService.cancelSubscription().subscribe({
        next: () => {
          alert('Assinatura cancelada');
          this.loadSubscriptionData();
        },
        error: (err) => {
          console.error('Error cancelling subscription:', err);
          alert('Erro ao cancelar assinatura');
        }
      });
    }
  }

  getProgressBarColor(percentage: number): string {
    if (percentage < 70) return '#4CAF50'; // Verde
    if (percentage < 90) return '#FF9800'; // Laranja
    return '#F44336'; // Vermelho
  }
}
```

### 3. Template HTML para Gerenciamento de Assinatura

```html
<!-- frontend/src/app/pages/subscription-management/subscription-management.html -->
<div class="subscription-container">
  <h1>Gerenciamento de Assinatura</h1>

  <!-- Loading State -->
  <div *ngIf="loading" class="loading">
    <p>Carregando...</p>
  </div>

  <!-- Error State -->
  <div *ngIf="error" class="error-message">
    {{ error }}
  </div>

  <!-- Current Subscription Info -->
  <div *ngIf="currentSubscription && !loading" class="current-plan-card">
    <h2>Plano Atual: {{ currentSubscription.subscription_plans.display_name }}</h2>
    <p>{{ currentSubscription.subscription_plans.description }}</p>
    <p class="price">R$ {{ currentSubscription.subscription_plans.price_monthly }}/mês</p>
    <p class="status" [class.active]="currentSubscription.status === 'active'">
      Status: {{ currentSubscription.status }}
    </p>
  </div>

  <!-- Usage Stats -->
  <div *ngIf="usageStats && !loading" class="usage-stats">
    <h3>Uso Atual</h3>
    
    <div class="stat-card">
      <h4>Usuários</h4>
      <div class="progress-bar">
        <div class="progress-fill" 
             [style.width.%]="usageStats.users.percentage"
             [style.background-color]="getProgressBarColor(usageStats.users.percentage)">
        </div>
      </div>
      <p>{{ usageStats.users.current }} / {{ usageStats.users.max }} usuários ({{ usageStats.users.percentage }}%)</p>
      <p *ngIf="usageStats.users.percentage >= 90" class="warning">
        ⚠️ Você está próximo do limite! Considere fazer upgrade do plano.
      </p>
    </div>

    <div class="stat-card">
      <h4>Imóveis</h4>
      <div class="progress-bar">
        <div class="progress-fill" 
             [style.width.%]="usageStats.properties.percentage"
             [style.background-color]="getProgressBarColor(usageStats.properties.percentage)">
        </div>
      </div>
      <p>{{ usageStats.properties.current }} / {{ usageStats.properties.max }} imóveis 
         <span *ngIf="usageStats.properties.max === 'unlimited'">(ilimitado)</span>
         <span *ngIf="usageStats.properties.max !== 'unlimited'">({{ usageStats.properties.percentage }}%)</span>
      </p>
      <p *ngIf="usageStats.properties.percentage >= 90 && usageStats.properties.max !== 'unlimited'" class="warning">
        ⚠️ Você está próximo do limite! Considere fazer upgrade do plano.
      </p>
    </div>
  </div>

  <!-- Available Plans -->
  <div *ngIf="availablePlans.length > 0 && !loading" class="plans-grid">
    <h3>Planos Disponíveis</h3>
    
    <div *ngFor="let plan of availablePlans" class="plan-card" 
         [class.current]="currentSubscription?.plan_id === plan.id">
      <div class="plan-header">
        <h4>{{ plan.display_name }}</h4>
        <span *ngIf="currentSubscription?.plan_id === plan.id" class="badge">Plano Atual</span>
      </div>
      
      <p class="plan-description">{{ plan.description }}</p>
      
      <div class="plan-price">
        <span class="price-amount">R$ {{ plan.price_monthly }}</span>
        <span class="price-period">/mês</span>
      </div>
      
      <ul class="features-list">
        <li>👥 {{ plan.max_users }} usuários inclusos</li>
        <li *ngIf="plan.max_properties > 0">🏠 Até {{ plan.max_properties }} imóveis</li>
        <li *ngIf="plan.max_properties === 0">🏠 Imóveis ilimitados</li>
        <li>💰 Usuário adicional: R$ {{ plan.additional_user_price }}</li>
        <li *ngIf="plan.activation_fee > 0">🔧 Taxa de ativação: R$ {{ plan.activation_fee }}</li>
        <li *ngIf="plan.activation_fee === 0">✅ Ativação gratuita</li>
      </ul>

      <div class="plan-features">
        <h5>Recursos:</h5>
        <ul>
          <li *ngIf="plan.features.gestao_atendimentos">✅ Gestão de atendimentos</li>
          <li *ngIf="plan.features.transferencia_leads">✅ Transferência automática de leads</li>
          <li *ngIf="plan.features.app_mobile">✅ Aplicativo mobile</li>
          <li *ngIf="plan.features.landing_page">✅ Landing page integrada</li>
          <li *ngIf="plan.features.treinamento_online">✅ Treinamento online</li>
          <li *ngIf="plan.features.blog">✅ Blog institucional</li>
          <li *ngIf="plan.features.suporte_vip">✅ Suporte VIP</li>
          <li *ngIf="plan.features.customer_success">✅ Customer Success dedicado</li>
          <li *ngIf="plan.features.api_imoveis">✅ API de imóveis</li>
          <li *ngIf="plan.features.portal_corretor">✅ Portal do Corretor</li>
        </ul>
      </div>

      <button 
        *ngIf="currentSubscription?.plan_id !== plan.id"
        (click)="changePlan(plan.id)"
        class="btn-change-plan">
        Mudar para este plano
      </button>
    </div>
  </div>

  <!-- Cancel Subscription -->
  <div *ngIf="currentSubscription?.status === 'active'" class="cancel-section">
    <button (click)="cancelSubscription()" class="btn-cancel">
      Cancelar Assinatura
    </button>
    <p class="cancel-warning">
      ⚠️ Ao cancelar, você perderá acesso aos recursos do seu plano.
    </p>
  </div>
</div>
```

### 4. Adicionar Rota no app.routes.ts

```typescript
// frontend/src/app/app.routes.ts
import { SubscriptionManagementComponent } from './pages/subscription-management/subscription-management';

export const routes: Routes = [
  { path: '', component: ModularHomeComponent },
  { path: 'buscar', component: SearchComponent },
  { path: 'imovel/:id', component: PropertyDetailsComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'admin/website-builder', component: WebsiteBuilderComponent, canActivate: [authGuard] },
  { path: 'admin/domains', component: DomainSettingsComponent, canActivate: [authGuard] },
  
  // Nova rota de assinatura
  { path: 'admin/subscription', component: SubscriptionManagementComponent, canActivate: [authGuard] },
  
  // Rota de pricing público (corrigir acesso)
  { path: 'pricing', component: PublicWebsiteComponent }, // Ou criar componente específico
  
  { path: 'site', component: PublicWebsiteComponent },
  { path: '**', redirectTo: '' }
];
```

### 5. Criar Guard para Verificar Limites

```typescript
// frontend/src/app/guards/subscription.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from '../services/subscription.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const subscriptionGuard = (requiredFeature?: string) => {
  return () => {
    const subscriptionService = inject(SubscriptionService);
    const router = inject(Router);

    if (!requiredFeature) {
      return true; // Sem feature requerida, permite acesso
    }

    return subscriptionService.checkFeatureAccess(requiredFeature).pipe(
      map(response => {
        if (response.hasAccess) {
          return true;
        } else {
          alert(`Recurso '${requiredFeature}' não disponível no seu plano ${response.planName}. Faça upgrade!`);
          router.navigate(['/admin/subscription']);
          return false;
        }
      }),
      catchError(err => {
        console.error('Error checking feature access:', err);
        return of(true); // Permite acesso em caso de erro (graceful degradation)
      })
    );
  };
};
```

### 6. Adicionar Widget de Uso no Dashboard

```typescript
// frontend/src/app/components/usage-widget/usage-widget.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService, UsageStats } from '../../services/subscription.service';

@Component({
  selector: 'app-usage-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="usage-widget" *ngIf="stats">
      <h3>Uso do Plano</h3>
      <div class="usage-item">
        <span>Usuários:</span>
        <span [class.warning]="stats.users.percentage >= 90">
          {{ stats.users.current }}/{{ stats.users.max }}
        </span>
      </div>
      <div class="usage-item">
        <span>Imóveis:</span>
        <span [class.warning]="stats.properties.percentage >= 90 && stats.properties.max !== 'unlimited'">
          {{ stats.properties.current }}/{{ stats.properties.max === 'unlimited' ? '∞' : stats.properties.max }}
        </span>
      </div>
      <a routerLink="/admin/subscription" class="link-manage">
        Gerenciar Plano
      </a>
    </div>
  `,
  styles: [`
    .usage-widget {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .usage-item {
      display: flex;
      justify-content: space-between;
      margin: 0.5rem 0;
    }
    .warning {
      color: #f44336;
      font-weight: bold;
    }
    .link-manage {
      display: inline-block;
      margin-top: 1rem;
      color: #1976d2;
      text-decoration: none;
    }
  `]
})
export class UsageWidgetComponent implements OnInit {
  stats: UsageStats | null = null;

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit() {
    this.loadStats();
    // Atualizar a cada 5 minutos
    setInterval(() => this.loadStats(), 5 * 60 * 1000);
  }

  loadStats() {
    this.subscriptionService.getUsageStats().subscribe({
      next: (response) => {
        this.stats = response.stats;
      },
      error: (err) => {
        console.error('Error loading usage stats:', err);
      }
    });
  }
}
```

### 7. Adicionar Widget no Admin Dashboard

```typescript
// frontend/src/app/pages/admin/admin.ts
import { UsageWidgetComponent } from '../../components/usage-widget/usage-widget';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    // ... outros imports
    UsageWidgetComponent // Adicionar
  ],
  // ...
})
```

```html
<!-- frontend/src/app/pages/admin/admin.html -->
<div class="admin-dashboard">
  <h1>Painel Administrativo</h1>
  
  <!-- Adicionar widget de uso -->
  <app-usage-widget></app-usage-widget>
  
  <!-- Restante do conteúdo -->
</div>
```

### 8. Validar Limites ao Criar Usuário/Imóvel

```typescript
// frontend/src/app/pages/admin/admin.ts (ou onde cria imóveis/usuários)

// Ao tentar criar novo imóvel
createProperty() {
  this.subscriptionService.getUsageStats().subscribe({
    next: (response) => {
      const stats = response.stats;
      
      if (stats.properties.max !== 'unlimited' && 
          stats.properties.current >= stats.properties.max) {
        alert('Limite de imóveis atingido! Faça upgrade do seu plano.');
        this.router.navigate(['/admin/subscription']);
        return;
      }
      
      // Prosseguir com criação
      this.doCreateProperty();
    }
  });
}

// Ao tentar criar novo usuário
createUser() {
  this.subscriptionService.getUsageStats().subscribe({
    next: (response) => {
      const stats = response.stats;
      
      if (stats.users.current >= stats.users.max) {
        alert('Limite de usuários atingido! Faça upgrade do seu plano.');
        this.router.navigate(['/admin/subscription']);
        return;
      }
      
      // Prosseguir com criação
      this.doCreateUser();
    }
  });
}
```

### 9. Corrigir Acesso à Página de Pricing

```typescript
// Opção 1: Criar componente específico de pricing público
// frontend/src/app/pages/pricing/pricing.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService, SubscriptionPlan } from '../../services/subscription.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing.html',
  styleUrls: ['./pricing.css']
})
export class PricingComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  loading = true;

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit() {
    this.subscriptionService.getPlans().subscribe({
      next: (response) => {
        this.plans = response.plans;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading plans:', err);
        this.loading = false;
      }
    });
  }

  contactSales() {
    window.open('https://wa.me/5535997383030?text=Olá! Gostaria de saber mais sobre os planos do CRM', '_blank');
  }
}
```

Adicionar rota:
```typescript
import { PricingComponent } from './pages/pricing/pricing';

export const routes: Routes = [
  // ...
  { path: 'pricing', component: PricingComponent }, // Público
  { path: 'planos', component: PricingComponent },   // Alias em português
  // ...
];
```

### 10. Menu de Navegação - Adicionar Link para Assinatura

```html
<!-- No menu do admin -->
<nav class="admin-nav">
  <a routerLink="/admin">Dashboard</a>
  <a routerLink="/admin/subscription">💎 Meu Plano</a>
  <!-- ... outros links -->
</nav>
```

## 📝 Resumo das Mudanças

### Arquivos Novos:
1. `frontend/src/app/services/subscription.service.ts`
2. `frontend/src/app/pages/subscription-management/subscription-management.ts`
3. `frontend/src/app/pages/subscription-management/subscription-management.html`
4. `frontend/src/app/pages/subscription-management/subscription-management.css`
5. `frontend/src/app/pages/pricing/pricing.ts`
6. `frontend/src/app/pages/pricing/pricing.html`
7. `frontend/src/app/pages/pricing/pricing.css`
8. `frontend/src/app/components/usage-widget/usage-widget.ts`
9. `frontend/src/app/guards/subscription.guard.ts`

### Arquivos Modificados:
1. `frontend/src/app/app.routes.ts` (adicionar rotas)
2. `frontend/src/app/pages/admin/admin.ts` (adicionar widget e validações)
3. `frontend/src/app/pages/admin/admin.html` (incluir usage-widget)

## 🚀 Como Testar

1. Instalar dependências: `cd frontend && npm install`
2. Executar servidor: `npm run dev` (backend) e `cd frontend && npm start`
3. Acessar: `http://localhost:4200/pricing` (deve funcionar)
4. Login no admin
5. Acessar: `http://localhost:4200/admin/subscription`
6. Verificar widget de uso no dashboard
7. Tentar criar imóvel quando limite atingido

## ✅ Checklist de Validação

- [ ] Página de pricing acessível publicamente
- [ ] Serviço de assinatura conectando com backend
- [ ] Página de gerenciamento de assinatura funcional
- [ ] Widget de uso exibindo dados corretos
- [ ] Validação de limites ao criar usuários/imóveis
- [ ] Mensagens de alerta quando limite próximo
- [ ] Botão de upgrade funcionando
- [ ] Guards de feature funcionando
- [ ] Responsividade mobile
- [ ] Integração com WhatsApp para contato

## 🎨 Estilização CSS Base

```css
/* subscription-management.css */
.subscription-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.current-plan-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.usage-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.progress-bar {
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.warning {
  color: #f44336;
  font-weight: bold;
  margin-top: 0.5rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.plan-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: transform 0.2s, border-color 0.2s;
}

.plan-card:hover {
  transform: translateY(-4px);
  border-color: #667eea;
}

.plan-card.current {
  border-color: #4CAF50;
  background: #f1f8f4;
}

.btn-change-plan {
  width: 100%;
  padding: 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-change-plan:hover {
  background: #5568d3;
}

.btn-cancel {
  background: #f44336;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .plans-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🔐 Considerações de Segurança

1. **Validação dupla**: Sempre validar limites no backend também
2. **Não confiar apenas no frontend**: Guards podem ser contornados
3. **Token de autenticação**: Garantir que todas as chamadas à API incluam token
4. **Logs de auditoria**: Backend já registra mudanças de plano

## 📞 Contato e Suporte

Para dúvidas sobre a implementação:
- Backend já implementado: ✅ 
- Migration SQL criado: ✅
- APIs disponíveis: ✅
- Documentação: ✅

Próximo passo: Implementar o frontend seguindo este prompt!
