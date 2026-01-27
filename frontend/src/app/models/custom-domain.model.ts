export type DomainStatus = 'pending' | 'verified' | 'active' | 'failed' | 'disabled';

export interface CustomDomain {
  id: string;
  company_id: string;
  domain: string;
  subdomain?: string;
  is_primary: boolean;
  ssl_enabled: boolean;
  ssl_certificate?: string;
  ssl_expires_at?: string;
  dns_configured: boolean;
  verification_token: string;
  verified_at?: string;
  status: DomainStatus;
  created_at?: string;
  updated_at?: string;
}

export interface DomainVerificationResult {
  success: boolean;
  message: string;
  dns_records?: DNSRecord[];
}

export interface DNSRecord {
  type: 'CNAME' | 'A' | 'TXT';
  host: string;
  value: string;
  ttl: number;
}
