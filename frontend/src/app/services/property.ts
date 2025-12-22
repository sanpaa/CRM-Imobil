import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Property, PropertyFilters } from '../models/property.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private apiUrl = `${environment.apiUrl}/api/properties`;
  private propertiesSubject = new BehaviorSubject<Property[]>([]);
  public properties$ = this.propertiesSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAllProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl);
  }

  getProperties(
    filters: PropertyFilters,
    page = 1,
    limit = 9
  ): Observable<{
    data: Property[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params: any = {
      page,
      limit
    };

    if (filters.searchText) params.search = filters.searchText;
    if (filters.type) params.type = filters.type;
    if (filters.city) params.city = filters.city;
    if (filters.bedrooms) params.bedrooms = filters.bedrooms;
    if (filters.priceMin) params.priceMin = filters.priceMin;
    if (filters.priceMax) params.priceMax = filters.priceMax;

    return this.http.get<{
      data: Property[];
      total: number;
      page: number;
      totalPages: number;
    }>(this.apiUrl, { params });
  }


  getProperty(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }

  createProperty(property: Partial<Property>): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, property);
  }

  updateProperty(id: string, property: Partial<Property>): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/${id}`, property);
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  uploadImages(files: File[]): Observable<{ imageUrls: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post<{ imageUrls: string[] }>(`${environment.apiUrl}/api/upload`, formData);
  }

  geocodeAddress(address: string): Observable<{ lat: number; lng: number }> {
    return this.http.post<{ lat: number; lng: number }>(`${environment.apiUrl}/api/geocode`, { address });
  }

  lookupCEP(cep: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/cep/${cep}`);
  }

  filterProperties(properties: Property[], filters: PropertyFilters): Property[] {
    return properties.filter(property => {
      // Text search
      if (filters.searchText) {
        const searchableText = `${property.title} ${property.description} ${property.neighborhood} ${property.city}`.toLowerCase();
        if (!searchableText.includes(filters.searchText.toLowerCase())) return false;
      }

      // Type filter
      if (filters.type && property.type !== filters.type) return false;

      // City filter
      if (filters.city && property.city !== filters.city) return false;

      // Bedrooms filter
      if (filters.bedrooms && property.bedrooms && property.bedrooms < filters.bedrooms) return false;

      // Price range filter
      if (filters.priceMin && property.price < filters.priceMin) return false;
      if (filters.priceMax && property.price > filters.priceMax) return false;

      return true;
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
