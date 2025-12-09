import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyCardComponent } from '../../components/property-card/property-card';
import { PropertyService } from '../../services/property';
import { Property, PropertyFilters } from '../../models/property.model';

// Declare global L to access Leaflet and markerClusterGroup loaded from CDN
declare const L: any;

// Fix Leaflet's default icon path issue with webpack
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// We'll configure the icon after ensuring L is loaded

@Component({
  selector: 'app-search',
  imports: [CommonModule, RouterModule, FormsModule, PropertyCardComponent],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  allProperties: Property[] = [];
  filteredProperties: Property[] = [];
  displayedProperties: Property[] = [];
  
  // Filters
  filters: PropertyFilters = {
    searchText: '',
    type: '',
    city: '',
    bedrooms: undefined,
    priceMin: undefined,
    priceMax: undefined
  };
  
  // Pagination
  currentPage = 1;
  propertiesPerPage = 9;
  totalPages = 0;
  
  // View state
  loading = true;
  error = false;
  currentView: 'grid' | 'map' = 'grid';
  sortBy = 'featured';
  
  // Available cities
  availableCities: string[] = [];
  
  // Map
  private map: any = null;
  private markerCluster: any = null;
  private mapInitRetryCount = 0;
  private readonly MAX_MAP_INIT_RETRIES = 3;
  
  constructor(private propertyService: PropertyService) {}
  
  ngOnInit(): void {
    this.loadProperties();
  }
  
  ngAfterViewInit(): void {
    // Map will be initialized when user switches to map view
  }
  
  ngOnDestroy(): void {
    // Clean up the map when component is destroyed
    this.destroyMap();
  }
  
  loadProperties(): void {
    this.loading = true;
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.allProperties = properties.filter(p => !p.sold);
        this.populateCityFilter();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
  
  populateCityFilter(): void {
    const cities = this.allProperties
      .map(p => p.city)
      .filter((c): c is string => !!c);
    this.availableCities = Array.from(new Set(cities)).sort();
  }
  
  applyFilters(): void {
    this.filteredProperties = this.propertyService.filterProperties(this.allProperties, this.filters);
    this.currentPage = 1;
    this.sortProperties();
    
    // Update map markers if in map view
    if (this.currentView === 'map' && this.map) {
      this.updateMapMarkers();
    }
  }
  
  clearFilters(): void {
    this.filters = {
      searchText: '',
      type: '',
      city: '',
      bedrooms: undefined,
      priceMin: undefined,
      priceMax: undefined
    };
    this.sortBy = 'featured';
    this.applyFilters();
  }
  
  sortProperties(): void {
    switch (this.sortBy) {
      case 'price-asc':
        this.filteredProperties.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        this.filteredProperties.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        this.filteredProperties.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'featured':
      default:
        this.filteredProperties.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
    }
    
    this.updatePagination();
  }
  
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProperties.length / this.propertiesPerPage);
    const startIndex = (this.currentPage - 1) * this.propertiesPerPage;
    const endIndex = Math.min(startIndex + this.propertiesPerPage, this.filteredProperties.length);
    this.displayedProperties = this.filteredProperties.slice(startIndex, endIndex);
  }
  
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }
  
  private isLeafletAvailable(): boolean {
    if (typeof L === 'undefined') {
      console.error('Leaflet library not loaded! Please check if leaflet.js is included in index.html');
      return false;
    }
    return true;
  }

  switchView(view: 'grid' | 'map'): void {
    this.currentView = view;
    if (view === 'map') {
      // Reset retry counter when switching to map view
      this.mapInitRetryCount = 0;
      // Give Angular time to render the map div and ensure Leaflet is loaded
      setTimeout(() => {
        if (!this.isLeafletAvailable()) {
          return;
        }
        this.initMap();
      }, 500);
    } else {
      // When switching away from map view, clean up the map reference
      // because *ngIf will destroy the DOM element
      this.destroyMap();
    }
  }
  
  private destroyMap(): void {
    if (this.markerCluster) {
      if (this.map) {
        this.map.removeLayer(this.markerCluster);
      }
      this.markerCluster = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
  
  private initMap(): void {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      // Try again after a short delay, but limit retries
      if (this.mapInitRetryCount < this.MAX_MAP_INIT_RETRIES) {
        this.mapInitRetryCount++;
        console.warn(`Map element not found! Retry attempt ${this.mapInitRetryCount}/${this.MAX_MAP_INIT_RETRIES}`);
        setTimeout(() => this.initMap(), 200);
      } else {
        console.error(`Map element not found after ${this.MAX_MAP_INIT_RETRIES} retries. Giving up.`);
      }
      return;
    }

    if (this.map) {
      // Map already exists, just update markers and invalidate size
      this.map.invalidateSize();
      this.updateMapMarkers();
      return;
    }

    if (!this.isLeafletAvailable()) {
      return;
    }

    console.log('Initializing map...');
    console.log('Properties to display:', this.filteredProperties.length);
    console.log('Properties with coordinates:', this.filteredProperties.filter(p => p.latitude && p.longitude).length);
    
    // Configure default Leaflet icon
    const iconDefault = L.icon({
      iconRetinaUrl: iconRetinaUrl,
      iconUrl: iconUrl,
      shadowUrl: shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
    
    // Default center (São Paulo)
    this.map = L.map('map').setView([-23.550520, -46.633308], 12);

    // Add CartoDB Positron tiles - cleaner, easier to see style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    console.log('Map initialized, adding markers...');
    this.updateMapMarkers();
  }

  private updateMapMarkers(): void {
    if (!this.map) {
      console.error('Map not initialized!');
      return;
    }

    // Clear existing marker cluster
    if (this.markerCluster) {
      this.map.removeLayer(this.markerCluster);
    }

    const validProperties = this.filteredProperties.filter(p => p.latitude && p.longitude);
    
    console.log(`Found ${validProperties.length} properties with coordinates out of ${this.filteredProperties.length} total`);
    
    // Log sample property coordinates for debugging (avoid logging sensitive data)
    if (this.filteredProperties.length > 0) {
      const sample = this.filteredProperties[0];
      console.log('Sample property coordinates:', {
        id: sample?.id,
        latitude: sample?.latitude,
        longitude: sample?.longitude
      });
    }

    if (validProperties.length === 0) {
      console.warn('No properties with valid coordinates');
      this.map.setView([-23.550520, -46.633308], 12);
      return;
    }

    const bounds: L.LatLngTuple[] = [];

    // Check if markerClusterGroup is available from CDN
    if (typeof L === 'undefined' || typeof L.markerClusterGroup !== 'function') {
      console.error('L.markerClusterGroup is not available! Make sure leaflet.markercluster.js is loaded from CDN.');
      return;
    }

    // Create marker cluster group exactly like the original
    this.markerCluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false
    });

    validProperties.forEach(property => {
      const lat = parseFloat(String(property.latitude));
      const lng = parseFloat(String(property.longitude));

      if (isNaN(lat) || isNaN(lng)) return;

      bounds.push([lat, lng]);

      // Create custom icon for properties - featured get gold star, others get blue house icon
      const icon = property.featured ? 
        L.divIcon({
          html: '<div style="background: linear-gradient(135deg, #FFD700, #FFA500); border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.4); border: 2px solid white;"><i class="fas fa-star" style="color: white; font-size: 18px;"></i></div>',
          className: 'custom-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -18]
        }) :
        L.divIcon({
          html: '<div style="background: linear-gradient(135deg, #004AAD, #0066CC); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.4); border: 2px solid white;"><i class="fas fa-home" style="color: white; font-size: 16px;"></i></div>',
          className: 'custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

      const images = property.imageUrls || (property.imageUrl ? [property.imageUrl] : []);
      const firstImage = images.length > 0 ? images[0] : null;
      const location = property.city ? 
        `${property.neighborhood || ''}, ${property.city} - ${property.state}` : 
        (property.location || '');

      const marker = L.marker([lat, lng], { icon });

      // Create popup content exactly like original
      const popupContent = `
        <div class="map-popup" style="min-width: 250px;">
          ${firstImage ? `<img src="${firstImage}" alt="${property.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" onerror="this.style.display='none'">` : ''}
          <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">${property.title}</h3>
          <div style="color: #666; font-size: 14px; margin-bottom: 10px;">
            <i class="fas fa-map-marker-alt" style="color: #004AAD;"></i> ${location}
          </div>
          <div style="font-size: 18px; font-weight: bold; color: #004AAD; margin-bottom: 10px;">
            R$ ${this.propertyService.formatPrice(property.price)}
          </div>
          <div style="color: #666; font-size: 14px; margin-bottom: 15px;">
            ${property.bedrooms ? `<i class="fas fa-bed"></i> ${property.bedrooms} quartos | ` : ''}
            ${property.area ? `<i class="fas fa-ruler-combined"></i> ${property.area}m²` : ''}
          </div>
          <a href="https://wa.me/${property.contact.replace(/\D/g, '')}?text=Olá, tenho interesse no imóvel: ${encodeURIComponent(property.title)}" 
             class="btn btn-primary" target="_blank" 
             style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 14px; width: 100%; text-align: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
            <i class="fab fa-whatsapp"></i> Tenho Interesse
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      // Add marker to cluster group instead of directly to map
      this.markerCluster!.addLayer(marker);
    });

    // Add cluster group to map
    this.map.addLayer(this.markerCluster);
    
    console.log(`Added ${validProperties.length} markers to the map`);

    // Fit map to show all markers
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
      console.log('Map bounds fitted to show all markers');
    }
  }
  
  get resultsCount(): string {
    const total = this.filteredProperties.length;
    return `${total} ${total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`;
  }
  
  get paginationPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      if (i === 1 || i === this.totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        pages.push(i);
      } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
        pages.push(-1); // Represents ellipsis
      }
    }
    return pages;
  }
}
