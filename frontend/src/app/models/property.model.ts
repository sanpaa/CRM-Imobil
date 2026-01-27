export interface Property {
  id: string;
  company_id?: string;
  companyId?: string;
  owner_id?: string;
  ownerId?: string;
  tenant_id?: string;
  tenantId?: string;
  title: string;
  description: string;
  type: string;
  price: number;
  image_url?: string;
  image_urls?: string[];

  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  parking?: number;
  garages?: number;
  suites?: number;
  kitchens?: number;
  areaPrivativa?: number;
  area_privativa?: number;
  areaConstrutiva?: number;
  area_construtiva?: number;
  areaTerreno?: number;
  area_terreno?: number;
  totalArea?: number;
  total_area?: number;
  builtArea?: number;
  built_area?: number;
  diningRoom?: boolean;
  dining_room?: boolean;
  livingRoom?: boolean;
  living_room?: boolean;
  serviceArea?: boolean;
  service_area?: boolean;
  closet?: boolean;
  status?: string;
  floor?: number;
  furnished?: boolean;

  // 🔥 NOVOS CAMPOS
  condoFee?: number;   // valor condomínio
  iptu?: number;       // IPTU anual
  condoIncludes?: string; // ex: Água, gás, portaria

  imageUrl?: string;
  imageUrls?: string[];

  documentUrls?: string[];
  document_urls?: string[];

  customOptions?: Array<{
    label: string;
    value: boolean;
  }>;

  location?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zip_code?: string;

  latitude?: number;
  longitude?: number;

  contact: string;
  featured?: boolean;
  sold?: boolean;

  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
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
