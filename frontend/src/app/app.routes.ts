import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { SearchComponent } from './pages/search/search';
import { PropertyDetailsComponent } from './pages/property-details/property-details';
import { AdminComponent } from './pages/admin/admin';
import { AdminLoginComponent } from './pages/admin-login/admin-login';
import { WebsiteBuilderComponent } from './components/website-builder/website-builder';
import { DomainSettingsComponent } from './components/domain-settings/domain-settings';
import { PublicWebsiteComponent } from './components/public-website/public-website';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'buscar', component: SearchComponent },
  { path: 'imovel/:id', component: PropertyDetailsComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'admin/website-builder', component: WebsiteBuilderComponent, canActivate: [authGuard] },
  { path: 'admin/domains', component: DomainSettingsComponent, canActivate: [authGuard] },
  { path: 'site', component: PublicWebsiteComponent },
  { path: '**', redirectTo: '' }
];
