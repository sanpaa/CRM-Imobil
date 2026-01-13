import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';
import * as L from 'leaflet';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

// Fix Leaflet's default icon path issue with webpack
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-property-details',
  imports: [CommonModule, RouterModule],
  templateUrl: './property-details.html',
  styleUrl: './property-details.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PropertyDetailsComponent implements OnInit, AfterViewInit {
  property: Property | null = null;
  loading = true;
  error = false;
  currentImageIndex = 0;
  private map: L.Map | null = null;
  @ViewChild('gallerySwiper') gallerySwiper!: ElementRef;
  isImageViewerOpen = false;
  viewerImage = '';
  linkCopied = false;

  isMobile = false;

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
    private location: Location,
    private router: Router

  ) { }

  ngOnInit(): void {
    this.checkIfMobile();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProperty(id);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    // Map will be initialized after property loads
  }

  checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
  }


  goBack() {
    // Se houver histórico de navegação, volta
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // Se entrou direto no link
      this.router.navigate(['/']);
    }
  }

  openImageViewer(img: string) {
    this.viewerImage = img;
    this.isImageViewerOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeImageViewer() {
    this.isImageViewerOpen = false;
    this.viewerImage = '';
    document.body.style.overflow = '';
  }


  galleryPrev() {
    this.gallerySwiper.nativeElement.swiper.slidePrev();
  }

  galleryNext() {
    this.gallerySwiper.nativeElement.swiper.slideNext();
  }

  goToSlide(index: number) {
    this.currentImageIndex = index;
    this.gallerySwiper.nativeElement.swiper.slideTo(index);
    this.scrollThumbIntoView(index);
  }

  onSlideChange() {
    if (this.gallerySwiper?.nativeElement?.swiper) {
      const swiper = this.gallerySwiper.nativeElement.swiper;
      this.currentImageIndex = swiper.activeIndex;
      this.scrollThumbIntoView(swiper.activeIndex);
    }
  }

  shareWhatsApp() {
    const text = `Olá! Gostaria de mais informações sobre ${this.property?.title}`;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}%0A${url}`, '_blank');
  }

  
  copyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied = true;
      setTimeout(() => {
        this.linkCopied = false;
      }, 2000);
    });
  }

  async shareProperty() {
    const shareData = {
      title: this.property?.title || 'Imóvel',
      text: `Confira este imóvel: ${this.property?.title}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Erro ao compartilhar:', err);
      }
    } else {
      // Fallback: copia o link
      this.copyLink();
    }
  }



  private scrollThumbIntoView(index: number) {
    setTimeout(() => {
      const thumbsContainer = document.querySelector('.thumbs');
      const activeThumb = thumbsContainer?.querySelectorAll('img')[index];

      if (thumbsContainer && activeThumb) {
        const thumbRect = (activeThumb as HTMLElement).getBoundingClientRect();
        const containerRect = thumbsContainer.getBoundingClientRect();

        const scrollLeft = (activeThumb as HTMLElement).offsetLeft -
          (containerRect.width / 2) +
          (thumbRect.width / 2);

        thumbsContainer.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }, 100);
  }


  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.isImageViewerOpen) {
      this.closeImageViewer();
    }
  }


  loadProperty(id: string): void {
    this.loading = true;
    this.propertyService.getAllProperties().subscribe({
      next: (properties: any) => {
        // console.log('RESPOSTA DA API:', properties);
        const list = properties.data;

        this.property = list.find((p: Property) => p.id === id) || null;
        this.loading = false;
        if (!this.property) {
          this.error = true;
        } else {
          // Initialize map after a short delay to ensure DOM is ready
          setTimeout(() => this.initMap(), 200);
        }
      },
      error: (err) => {
        console.error('Error loading property:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  private initMap(): void {
    if (!this.property || !this.property.latitude || !this.property.longitude) return;

    const mapElement = document.getElementById('property-map');
    if (!mapElement) return;

    const lat = parseFloat(String(this.property.latitude));
    const lng = parseFloat(String(this.property.longitude));

    if (isNaN(lat) || isNaN(lng)) return;

    this.map = L.map('property-map').setView([lat, lng], 15);

    // Add CartoDB Positron tiles - cleaner, easier to see style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    L.marker([lat, lng])
      .addTo(this.map)
      .bindPopup(`<strong>${this.property.title}</strong><br>${this.getLocation()}`)
      .openPopup();
  }

  nextImage(): void {
    if (!this.property || !this.property.imageUrls) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.property.imageUrls.length;
  }

  prevImage(): void {
    if (!this.property || !this.property.imageUrls) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.property.imageUrls.length) % this.property.imageUrls.length;
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  getLocation(): string {
    if (!this.property) return '';
    if (this.property.city) {
      return `${this.property.street ? this.property.street + ', ' : ''}${this.property.neighborhood || ''}, ${this.property.city} - ${this.property.state}`;
    }
    return this.property.location || '';
  }

  formatPrice(price: number): string {
    return this.propertyService.formatPrice(price);
  }

  getWhatsAppLink(): string {
    if (!this.property) return '#';
    const phone = this.property.contact.replace(/\D/g, '');
    const message = `Olá, tenho interesse no imóvel: ${encodeURIComponent(this.property.title)}`;
    return `https://wa.me/${phone}?text=${message}`;
  }

  getMapsLink(): string {
    if (!this.property) return '#';
    return `https://www.google.com/maps?q=${this.property.latitude},${this.property.longitude}`;
  }

  get images(): string[] {
    if (!this.property) return ['https://picsum.photos/200'];
    const propertyImages = this.property.imageUrls || (this.property.imageUrl ? [this.property.imageUrl] : []);
    return propertyImages.length > 0 ? propertyImages : ['https://picsum.photos/200'];
  }

  get currentImage(): string {
    const imgs = this.images;
    return imgs[this.currentImageIndex];
  }
}
