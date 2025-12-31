import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomainManagementService } from '../../services/domain-management.service';
import { CustomDomain, DNSRecord } from '../../models/custom-domain.model';

@Component({
  selector: 'app-domain-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './domain-settings.html',
  styleUrls: ['./domain-settings.css']
})
export class DomainSettingsComponent implements OnInit {
  domains: CustomDomain[] = [];
  showAddDomainForm = false;
  
  newDomain = {
    domain: '',
    subdomain: ''
  };

  selectedDomain: CustomDomain | null = null;
  dnsInstructions: DNSRecord[] = [];

  companyId = 'demo-company-id'; // In real app, get from auth service

  constructor(private domainService: DomainManagementService) {}

  ngOnInit() {
    this.loadDomains();
  }

  loadDomains() {
    this.domainService.getDomains(this.companyId).subscribe({
      next: (domains) => {
        this.domains = domains;
      },
      error: (err) => console.error('Error loading domains:', err)
    });
  }

  addDomain() {
    if (!this.newDomain.domain) return;

    const verificationToken = this.generateToken();

    const domain: Partial<CustomDomain> = {
      company_id: this.companyId,
      domain: this.newDomain.domain,
      subdomain: this.newDomain.subdomain || undefined,
      is_primary: this.domains.length === 0,
      ssl_enabled: false,
      dns_configured: false,
      verification_token: verificationToken,
      status: 'pending'
    };

    this.domainService.addDomain(domain).subscribe({
      next: (newDomain) => {
        this.domains.push(newDomain);
        this.showAddDomainForm = false;
        this.newDomain = { domain: '', subdomain: '' };
        this.selectDomain(newDomain);
      },
      error: (err) => console.error('Error adding domain:', err)
    });
  }

  selectDomain(domain: CustomDomain) {
    this.selectedDomain = domain;
    this.dnsInstructions = this.domainService.getDNSInstructions(
      domain.domain,
      domain.subdomain
    );
  }

  verifyDomain(domain: CustomDomain) {
    this.domainService.verifyDomain(domain.id).subscribe({
      next: (result) => {
        if (result.success) {
          alert('Domínio verificado com sucesso!');
          this.loadDomains();
        } else {
          alert('Falha na verificação: ' + result.message);
        }
      },
      error: (err) => console.error('Error verifying domain:', err)
    });
  }

  enableSSL(domain: CustomDomain) {
    this.domainService.enableSSL(domain.id).subscribe({
      next: () => {
        alert('SSL habilitado com sucesso!');
        this.loadDomains();
      },
      error: (err) => console.error('Error enabling SSL:', err)
    });
  }

  setPrimary(domain: CustomDomain) {
    this.domainService.setPrimaryDomain(domain.id).subscribe({
      next: () => {
        alert('Domínio principal definido!');
        this.loadDomains();
      },
      error: (err) => console.error('Error setting primary domain:', err)
    });
  }

  deleteDomain(domain: CustomDomain) {
    if (confirm('Tem certeza que deseja remover este domínio?')) {
      this.domainService.deleteDomain(domain.id).subscribe({
        next: () => {
          this.domains = this.domains.filter(d => d.id !== domain.id);
          if (this.selectedDomain?.id === domain.id) {
            this.selectedDomain = null;
          }
        },
        error: (err) => console.error('Error deleting domain:', err)
      });
    }
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'pending': '⏳',
      'verified': '✅',
      'active': '🟢',
      'failed': '❌',
      'disabled': '⚪'
    };
    return icons[status] || '⚪';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'pending': 'Pendente',
      'verified': 'Verificado',
      'active': 'Ativo',
      'failed': 'Falhou',
      'disabled': 'Desabilitado'
    };
    return texts[status] || status;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  }

  private generateToken(): string {
    return `crm-verify-${Date.now()}-${Math.random().toString(36).substring(2, 18)}`;
  }
}
