import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyCardComponent } from '../../components/property-card/property-card';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, PropertyCardComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  properties: Property[] = [];
  visibleProperties: Property[] = [];

  loading = true;
  error = false;

  pageSize = 3;
  currentIndex = 0;
  isMobile = false;

  constructor(private propertyService: PropertyService) {}

  ngOnInit(): void {
    this.checkIfMobile();
    this.loadProperties();

    window.addEventListener('resize', () => {
      this.checkIfMobile();
      this.updateVisible();
    });
  }

  checkIfMobile(): void {
    const wasMobile = this.isMobile;

    this.isMobile = window.innerWidth < 768;
    this.pageSize = this.isMobile ? 1 : 3;

    if (wasMobile !== this.isMobile) {
      this.currentIndex = 0; // evita index quebrado
    }
  }

  loadProperties(): void {
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.properties = properties
          .filter(p => !p.sold)
          .slice(0, 9);

        this.updateVisible();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  updateVisible(): void {
    this.visibleProperties = this.properties.slice(
      this.currentIndex,
      this.currentIndex + this.pageSize
    );
  }

  next(): void {
    if (this.isMobile) {
      if (this.currentIndex + 1 < this.properties.length) {
        this.currentIndex++;
        this.updateVisible();
      }
    } else {
      if (this.currentIndex + this.pageSize < this.properties.length) {
        this.currentIndex += this.pageSize;
        this.updateVisible();
      }
    }
  }

  prev(): void {
    if (this.isMobile) {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.updateVisible();
      }
    } else {
      if (this.currentIndex - this.pageSize >= 0) {
        this.currentIndex -= this.pageSize;
        this.updateVisible();
      }
    }
  }

  get skeletonItems(): number[] {
    return this.isMobile ? [1] : [1, 2, 3];
  }

}

