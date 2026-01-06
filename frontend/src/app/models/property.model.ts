export interface Property {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;

  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  parking?: number;

  // 🔥 NOVOS CAMPOS
  condoFee?: number;   // valor condomínio
  iptu?: number;       // IPTU anual
  condoIncludes?: string; // ex: Água, gás, portaria

  imageUrl?: string;
  imageUrls?: string[];

  documentUrls?: string[];

  location?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  latitude?: number;
  longitude?: number;

  contact: string;
  featured?: boolean;
  sold?: boolean;

  createdAt?: string;
  updatedAt?: string;
}


export interface PropertyFilters {
  searchText?: string;
  type?: string;
  city?: string;
  bedrooms?: number;
  priceMin?: number;
  priceMax?: number;
}

export interface AIPropertySuggestion {
  title?: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  parking?: number;
  priceHint?: string;
}
