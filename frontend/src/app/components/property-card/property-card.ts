import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Property } from '../../models/property.model';

@Component({
  selector: 'app-property-card',
  imports: [CommonModule, RouterModule],
  templateUrl: './property-card.html',
  styleUrl: './property-card.css',
})
export class PropertyCardComponent {
  @Input() property!: Property;
  images: string[] = [];
  currentIndex = 0;
  getFirstImage(): string {
    const images = this.property.imageUrls || (this.property.imageUrl ? [this.property.imageUrl] : []);
    return images.length > 0 ? images[0] : 'https://picsum.photos/200';
  }

  getImagesCount(): number {
    const images = this.property.imageUrls || (this.property.imageUrl ? [this.property.imageUrl] : []);
    return images.length;
  }

  getLocation(): string {
    if (this.property.city) {
      return `${this.property.neighborhood || ''}, ${this.property.city} - ${this.property.state}`;
    }
    return this.property.location || 'Localização não informada';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  hasDetails(): boolean {
    return !!(this.property.bedrooms || this.property.bathrooms || this.property.area || this.property.parking);
  }

  getWhatsAppLink(): string {
    const phone = this.property.contact.replace(/\D/g, '');
    const message = `Olá, tenho interesse no imóvel: ${encodeURIComponent(this.property.title)}`;
    return `https://wa.me/${phone}?text=${message}`;
  }

  getMapsLink(): string {
    return `https://www.google.com/maps?q=${this.property.latitude},${this.property.longitude}`;
  }

  onImageError(event: any): void {
    event.target.parentElement.innerHTML = '<i class="fas fa-image fa-3x"></i>';
  }

  ngOnInit() {
    this.images =
      this.property.imageUrls?.length
        ? this.property.imageUrls
        : this.property.imageUrl
          ? [this.property.imageUrl]
          : ['https://picsum.photos/600/400'];
  }

  get currentImage(): string {
    return this.images[this.currentIndex];
  }

  nextImage(event: Event) {
    event.stopPropagation();
    this.currentIndex =
      (this.currentIndex + 1) % this.images.length;
  }

  prevImage(event: Event) {
    event.stopPropagation();
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }
}
