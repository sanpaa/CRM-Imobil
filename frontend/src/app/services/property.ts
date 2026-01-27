import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { Property, PropertyFilters } from '../models/property.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private apiUrl = `${environment.apiUrl}/properties`;
  private propertiesSubject = new BehaviorSubject<Property[]>([]);
  public properties$ = this.propertiesSubject.asObservable();

  constructor(private http: HttpClient) { }

  private isImageUrl(url: string): boolean {
    return /^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(url);
  }

  private normalizeProperty(p: any): Property {
    const imageUrls = p.image_urls?.length
      ? p.image_urls
      : p.image_url
        ? [p.image_url]
        : p.imageUrls?.length
          ? p.imageUrls
          : p.imageUrl
            ? [p.imageUrl]
            : [];

    const documentUrls = p.document_urls?.length
      ? p.document_urls
      : p.documentUrls?.length
        ? p.documentUrls
        : [];

    const imageDocs = documentUrls.filter((url: string) => this.isImageUrl(url));
    const mergedImageUrls = imageUrls.length ? imageUrls : imageDocs;

    return {
      ...p,
      parking: p.parking ?? p.garages,
      imageUrls: mergedImageUrls,
      imageUrl: mergedImageUrls[0] || p.image_url || p.imageUrl || undefined,
      documentUrls,
      customOptions: p.customOptions?.length ? p.customOptions : p.custom_options || []
    };
  }

  private serializeProperty(property: Partial<Property>): any {
    const payload: any = { ...property };
    if (property.customOptions) {
      payload.custom_options = property.customOptions;
      delete payload.customOptions;
    }
    return payload;
  }

  getAllProperties(): Observable<Property[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(res => {
        const list = res.data || res;

        return {
          ...res,
          data: list.map((p: any) => this.normalizeProperty(p))
        };
      })
    );
  }

  getPropertiesByCompany(companyId: string | null): Observable<Property[]> {
    if (!companyId) {
      return this.getAllProperties();
    }
    return this.http.get<any>(`${this.apiUrl}?company_id=${companyId}`).pipe(
      map(res => {
        const list = res.data || res;
        const mapped = Array.isArray(list) ? list.map((p: any) => this.normalizeProperty(p)) : list;
        return Array.isArray(res?.data) ? { ...res, data: mapped } : mapped;
      })
    );
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
    }>(this.apiUrl, { params }).pipe(
      map(res => ({
        ...res,
        data: res.data?.map((p: any) => this.normalizeProperty(p)) || []
      }))
    );
  }

  getStats(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/stats`);
  }

  getProperty(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`).pipe(
      map(res => this.normalizeProperty(res))
    );
  }

  createProperty(property: Partial<Property>): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, this.serializeProperty(property));
  }

  updateProperty(id: string, property: Partial<Property>): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/${id}`, this.serializeProperty(property));
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  uploadImages(files: File[]): Observable<{ imageUrls: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return this.http.post<{ imageUrls: string[] }>(`${environment.apiUrl}/upload`, formData);
  }

  uploadDocuments(files: File[], companyId?: string, propertyId?: string): Observable<{ documentUrls: string[] }> {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));

    // Add company_id and property_id if provided
    if (companyId) {
      formData.append('company_id', companyId);
    }
    if (propertyId) {
      formData.append('property_id', propertyId);
    }

    return this.http.post<{ documentUrls: string[] }>(`${environment.apiUrl}/upload-documents`, formData);
  }

  geocodeAddress(address: string): Observable<{ lat: number; lng: number }> {
    return this.http.post<{ lat: number; lng: number }>(`${environment.apiUrl}/geocode`, { address });
  }

  lookupCEP(cep: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/cep/${cep}`);
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
