import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { siteConfigGuard } from './guards/site-config.guard';

/**
 * ROTAS MULTI-TENANT
 * 
 * Estrutura:
 * - Rotas públicas: Acessíveis por qualquer domínio
 * - Rotas administrativas: Apenas com autenticação
 * - Rotas dinâmicas: Baseadas na configuração do domínio
 */

export const routes: Routes = [
  // ==========================================
  // ROTAS PÚBLICAS DO SITE (MULTI-TENANT)
  // ==========================================
  
  // Home - Renderizada dinamicamente por domínio
  {
    path: '',
    loadComponent: () => import('./pages/modular-home/modular-home').then(m => m.ModularHomeComponent),
    canActivate: [siteConfigGuard],
    title: 'Home'
  },

  // Busca de imóveis
  {
    path: 'buscar',
    loadComponent: () => import('./pages/search/search').then(m => m.SearchComponent),
    canActivate: [siteConfigGuard],
    title: 'Buscar Imóveis'
  },

  // Detalhes do imóvel
  {
    path: 'imovel/:id',
    loadComponent: () => import('./pages/property-details/property-details').then(m => m.PropertyDetailsComponent),
    canActivate: [siteConfigGuard],
    title: 'Detalhes do Imóvel'
  },

  // Páginas dinâmicas (criadas no CRM)
  // Ex: /sobre-nos, /contato, /servicos
  {
    path: 'p/:slug',
    loadComponent: () => import('./components/dynamic-page/dynamic-page.component').then(m => m.DynamicPageComponent),
    canActivate: [siteConfigGuard]
  },

  // ==========================================
  // ROTAS ADMINISTRATIVAS (CRM)
  // ==========================================
  
  // Login administrativo
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin-login/admin-login').then(m => m.AdminLoginComponent),
    title: 'Login - Área Administrativa'
  },

  // Dashboard administrativo
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent),
    canActivate: [authGuard],
    title: 'Dashboard - CRM'
  },

  // Editor de website
  {
    path: 'admin/website-builder',
    loadComponent: () => import('./components/website-builder/website-builder').then(m => m.WebsiteBuilderComponent),
    canActivate: [authGuard],
    title: 'Editor de Website - CRM'
  },

  // Gerenciamento de domínios
  {
    path: 'admin/domains',
    loadComponent: () => import('./components/domain-settings/domain-settings').then(m => m.DomainSettingsComponent),
    canActivate: [authGuard],
    title: 'Gerenciar Domínios - CRM'
  },

  // ==========================================
  // ROTAS DE ERRO
  // ==========================================
  
  // 404 - Página não encontrada
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Página não encontrada'
  },

  // Wildcard - Redireciona para 404
  {
    path: '**',
    redirectTo: '404'
  }
];

/**
 * COMO FUNCIONA:
 * 
 * 1. Usuário acessa: https://alancarmo.com.br
 *    - APP_INITIALIZER detecta domínio
 *    - Carrega config do backend
 *    - Aplica tema
 *    - Renderiza home page
 * 
 * 2. Usuário acessa: https://alancarmo.com.br/buscar
 *    - siteConfigGuard valida config
 *    - Renderiza página de busca com tema aplicado
 * 
 * 3. Usuário acessa: https://alancarmo.com.br/p/sobre-nos
 *    - DynamicPageComponent busca página "sobre-nos" na config
 *    - Renderiza componentes dinamicamente
 * 
 * 4. Usuário acessa: https://alancarmo.com.br/admin
 *    - authGuard valida autenticação
 *    - Renderiza área administrativa
 */
