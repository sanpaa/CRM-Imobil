import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomainDetectionService } from '../../services/domain-detection.service';
import { PublicSiteRendererComponent } from '../public-site-renderer/public-site-renderer';

@Component({
  selector: 'app-public-website',
  standalone: true,
  imports: [CommonModule, PublicSiteRendererComponent],
  templateUrl: './public-website.html',
  styleUrls: ['./public-website.css']
})
export class PublicWebsiteComponent implements OnInit {
  constructor(
    private domainService: DomainDetectionService
  ) {}

  ngOnInit() {
    // Domain detection happens automatically in the service
    // The PublicSiteRendererComponent will handle loading and rendering
  }
}
