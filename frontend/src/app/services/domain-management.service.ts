import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CustomDomain, DomainVerificationResult, DNSRecord } from '../models/custom-domain.model';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class DomainManagementService {
  private apiUrl = `${environment.apiUrl}/api/domains`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Domain operations
  getDomains(companyId: string): Observable<CustomDomain[]> {
    return this.http.get<CustomDomain[]>(
      `${this.apiUrl}?company_id=${companyId}`,
      { headers: this.getHeaders() }
    );
  }

  getDomain(id: string): Observable<CustomDomain> {
    return this.http.get<CustomDomain>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getPrimaryDomain(companyId: string): Observable<CustomDomain | null> {
    return this.http.get<CustomDomain | null>(
      `${this.apiUrl}/primary?company_id=${companyId}`,
      { headers: this.getHeaders() }
    );
  }

  addDomain(domain: Partial<CustomDomain>): Observable<CustomDomain> {
    return this.http.post<CustomDomain>(
      this.apiUrl,
      domain,
      { headers: this.getHeaders() }
    );
  }

  updateDomain(id: string, domain: Partial<CustomDomain>): Observable<CustomDomain> {
    return this.http.put<CustomDomain>(
      `${this.apiUrl}/${id}`,
      domain,
      { headers: this.getHeaders() }
    );
  }

  deleteDomain(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // Domain verification
  verifyDomain(id: string): Observable<DomainVerificationResult> {
    return this.http.post<DomainVerificationResult>(
      `${this.apiUrl}/${id}/verify`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Set primary domain
  setPrimaryDomain(id: string): Observable<CustomDomain> {
    return this.http.post<CustomDomain>(
      `${this.apiUrl}/${id}/set-primary`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // SSL operations
  enableSSL(id: string): Observable<CustomDomain> {
    return this.http.post<CustomDomain>(
      `${this.apiUrl}/${id}/ssl/enable`,
      {},
      { headers: this.getHeaders() }
    );
  }

  disableSSL(id: string): Observable<CustomDomain> {
    return this.http.post<CustomDomain>(
      `${this.apiUrl}/${id}/ssl/disable`,
      {},
      { headers: this.getHeaders() }
    );
  }

  renewSSL(id: string): Observable<CustomDomain> {
    return this.http.post<CustomDomain>(
      `${this.apiUrl}/${id}/ssl/renew`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // DNS configuration helpers
  getDNSInstructions(domain: string, subdomain?: string): DNSRecord[] {
    const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;
    const targetDomain = 'your-site.netlify.app'; // This should be configured per deployment
    
    const records: DNSRecord[] = [];

    if (subdomain) {
      // For subdomain (e.g., www.example.com)
      records.push({
        type: 'CNAME',
        host: subdomain,
        value: targetDomain,
        ttl: 3600
      });
    } else {
      // For root domain (e.g., example.com)
      // Option 1: CNAME for @ (if supported by DNS provider)
      records.push({
        type: 'CNAME',
        host: '@',
        value: targetDomain,
        ttl: 3600
      });
    }

    // Verification TXT record
    records.push({
      type: 'TXT',
      host: '_crm-verification',
      value: this.generateVerificationToken(),
      ttl: 3600
    });

    return records;
  }

  private generateVerificationToken(): string {
    return `crm-verify-${Date.now()}-${Math.random().toString(36).substring(2, 18)}`;
  }

  // Generate automatic subdomain for company
  generateAutoSubdomain(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
