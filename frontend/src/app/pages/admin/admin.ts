import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../services/property';
import { AiService } from '../../services/ai';
import { AuthService } from '../../services/auth';
import { Property } from '../../models/property.model';
import { CustomDropdownComponent } from '../../components/custom-dropdown/custom-dropdown';

declare var Swal: any;

@Component({
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, CustomDropdownComponent, RouterModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit {
  properties: Property[] = [];
  loading = true;
  editingId: string | null = null;
  showForm = false;
  rawValues: Record<'price' | 'condoFee' | 'iptu', string> = {
    price: '',
    condoFee: '',
    iptu: ''
  };
  saving = false;


  // Stats
  stats = {
    total: 0,
    available: 0,
    featured: 0,
    sold: 0
  };

  // Form data
  formData: Partial<Property> = {
    title: '',
    description: '',
    type: '',
    price: 0,
    bedrooms: undefined,
    bathrooms: undefined,
    area: undefined,
    parking: undefined,
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    latitude: undefined,
    longitude: undefined,
    contact: '',
    imageUrls: [],
    featured: false,
    sold: false
  };

  selectedFiles: File[] = [];
  uploadingImages = false;
  aiLoading = false;
  geocoding = false;

  constructor(
    private propertyService: PropertyService,
    private aiService: AiService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadProperties();
  }

  loadStats(): void {
    this.propertyService.getStats().subscribe({
      next: stats => this.stats = stats,
      error: err => console.error('Erro ao carregar stats', err)
    });
  }

  private currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });

  formatCurrency(value?: number): string {
    const v = value ?? 0;

    return v.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  }

  onCurrencyInput(event: Event, field: 'price' | 'condoFee' | 'iptu') {
    const input = event.target as HTMLInputElement;

    let raw = input.value
      .replace(/[^\d,]/g, '')
      .replace(',', '.');

    const numericValue = parseFloat(raw);

    this.formData[field] = isNaN(numericValue) ? 0 : numericValue;
  }

  onCurrencyBlur(field: 'price' | 'condoFee' | 'iptu') {
    this.formData[field] = Number(this.formData[field] || 0);
  }

  selectAll(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    setTimeout(() => input.select());
  }

  loadProperties(): void {
    this.loading = true;
    this.propertyService.getAllProperties().subscribe({
      next: (response: any) => {
        this.properties = response.data; // ou response.results
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading properties:', err);
        this.loading = false;
      }
    });
  }

  applyCurrencyFormat(field: 'price' | 'condoFee' | 'iptu') {
    const raw = this.rawValues[field].replace(/[^\d]/g, '');

    const value = raw ? Number(raw) / 100 : 0;

    this.formData[field] = value;
    this.rawValues[field] = this.formatCurrency(value);
  }


  newProperty(): void {
    this.editingId = null;
    this.formData = {
      title: '',
      description: '',
      type: '',
      price: 0,

      condoFee: undefined,
      iptu: undefined,
      condoIncludes: '',

      bedrooms: undefined,
      bathrooms: undefined,
      area: undefined,
      parking: undefined,

      street: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: undefined,
      longitude: undefined,

      contact: '',
      imageUrls: [],
      featured: false,
      sold: false
    };
    this.selectedFiles = [];
    this.showForm = true;
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  }

  editProperty(property: Property): void {
    this.editingId = property.id;
    this.formData = { ...property };
    this.showForm = true;
    this.rawValues.price = this.formatCurrency(property.price);
    this.rawValues.condoFee = this.formatCurrency(property.condoFee);
    this.rawValues.iptu = this.formatCurrency(property.iptu);

    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  }

  cancelEdit(): void {
    this.showForm = false;
    this.editingId = null;
    this.formData = {};
    this.selectedFiles = [];
  }

  async saveProperty(): Promise<void> {
    if (this.saving) return;

    if (!this.formData.title || !this.formData.description || !this.formData.type || !this.formData.price || !this.formData.contact) {
      Swal.fire({
        icon: 'error',
        title: 'Campos obrigatórios',
        text: 'Preencha título, descrição, tipo, preço e contato'
      });
      return;
    }

    this.saving = true;

    Swal.fire({
      title: 'Salvando imóvel...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      if (this.selectedFiles.length > 0) {
        const result = await this.propertyService.uploadImages(this.selectedFiles).toPromise();
        this.formData.imageUrls = [...(this.formData.imageUrls || []), ...(result?.imageUrls || [])];
      }

      const request$ = this.editingId
        ? this.propertyService.updateProperty(this.editingId, this.formData)
        : this.propertyService.createProperty(this.formData);

      request$.subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: this.editingId ? 'Imóvel atualizado' : 'Imóvel criado',
            timer: 1800,
            showConfirmButton: false
          });

          this.closeModal();
          this.loadProperties();
          this.loadStats();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: err?.error?.error || 'Erro ao salvar imóvel'
          });
        },
        complete: () => {
          this.saving = false;
        }
      });

    } catch {
      this.saving = false;
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro inesperado ao salvar'
      });
    }
  }


  closeModal() {
    const modalEl = document.getElementById('propertyModal');
    if (!modalEl) return;

    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    modal?.hide();

    this.cancelEdit();
  }

  deleteProperty(id: string): void {
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Esta ação não pode ser desfeita',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, deletar',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.propertyService.deleteProperty(id).subscribe({
          next: () => {
            Swal.fire('Deletado!', 'Imóvel removido com sucesso', 'success');
            this.loadProperties();
            this.loadStats();
          },
          error: (err) => {
            Swal.fire('Erro', 'Erro ao deletar imóvel', 'error');
          }
        });
      }
    });
  }

  onFileSelected(event: any): void {
    const files: File[] = Array.from(event.target.files);
    
    // ✅ VALIDAR QUANTIDADE
    if (files.length > 20) {
      Swal.fire({
        icon: 'warning',
        title: 'Muitos arquivos',
        text: 'Você pode enviar no máximo 20 imagens por vez'
      });
      
      // Pegar apenas os primeiros 20
      this.selectedFiles = files.slice(0, 20);
    } else {
      this.selectedFiles = files;
    }
    
    console.log(`📁 ${this.selectedFiles.length} arquivo(s) selecionado(s)`);
  }

  removeImage(index: number): void {
    if (this.formData.imageUrls) {
      this.formData.imageUrls.splice(index, 1);
    }
  }

  lookupCEP(): void {
    const cep = this.formData.zipCode?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) return;

    this.propertyService.lookupCEP(cep).subscribe({
      next: (data) => {
        if (data.street) this.formData.street = data.street;
        if (data.neighborhood) this.formData.neighborhood = data.neighborhood;
        if (data.city) this.formData.city = data.city;
        if (data.state) this.formData.state = data.state;

        // Auto-geocode the address to get coordinates for the map (silent mode)
        this.geocodeAddress(true);

        Swal.fire({
          icon: 'success',
          title: 'CEP encontrado!',
          text: 'Endereço preenchido. Coordenadas do mapa serão obtidas automaticamente.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'warning',
          title: 'CEP não encontrado',
          text: 'Preencha o endereço manualmente',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  geocodeAddress(silent: boolean = false): void {
    // Build the full address for geocoding
    const addressParts = [
      this.formData.street,
      this.formData.neighborhood,
      this.formData.city,
      this.formData.state,
      'Brasil'
    ].filter(part => part && part.trim());

    if (addressParts.length < 2) {
      if (!silent) {
        Swal.fire({
          icon: 'info',
          title: 'Endereço incompleto',
          text: 'Preencha pelo menos cidade e estado para obter as coordenadas',
          timer: 3000,
          showConfirmButton: false
        });
      }
      return;
    }

    const fullAddress = addressParts.join(', ');

    this.geocoding = true;
    this.propertyService.geocodeAddress(fullAddress).subscribe({
      next: (coords) => {
        this.geocoding = false;
        // Validate that coords exists and has valid numeric lat/lng values
        if (coords &&
          typeof coords.lat === 'number' && !isNaN(coords.lat) &&
          typeof coords.lng === 'number' && !isNaN(coords.lng)) {
          this.formData.latitude = coords.lat;
          this.formData.longitude = coords.lng;
          console.log('Geocoded address:', fullAddress, 'to:', coords);
          if (!silent) {
            Swal.fire({
              icon: 'success',
              title: 'Coordenadas obtidas!',
              text: 'O imóvel será exibido no mapa',
              timer: 2000,
              showConfirmButton: false
            });
          }
        } else if (!silent) {
          Swal.fire({
            icon: 'warning',
            title: 'Coordenadas inválidas',
            text: 'O serviço não retornou coordenadas válidas',
            timer: 3000,
            showConfirmButton: false
          });
        }
      },
      error: (err) => {
        this.geocoding = false;
        console.warn('Could not geocode address:', err);
        if (!silent) {
          Swal.fire({
            icon: 'warning',
            title: 'Não foi possível obter coordenadas',
            text: 'Verifique se o endereço está correto',
            timer: 3000,
            showConfirmButton: false
          });
        }
      }
    });
  }

  getAiSuggestions(): void {
    if (!this.formData.title && !this.formData.description) {
      Swal.fire({
        icon: 'info',
        title: 'Dados insuficientes',
        text: 'Digite pelo menos um título ou descrição para obter sugestões da IA'
      });
      return;
    }

    this.aiLoading = true;
    this.aiService.getPropertySuggestions({
      title: this.formData.title,
      description: this.formData.description,
      type: this.formData.type,
      bedrooms: this.formData.bedrooms,
      bathrooms: this.formData.bathrooms,
      area: this.formData.area,
      parking: this.formData.parking,
      city: this.formData.city,
      neighborhood: this.formData.neighborhood
    }).subscribe({
      next: (suggestions) => {
        this.aiLoading = false;
        let html = '<div style="text-align: left; padding: 10px;">';
        if (suggestions.title) html += `<p style="margin-bottom: 15px;"><strong>📝 Título:</strong><br><span style="color: #666;">${suggestions.title}</span></p>`;
        if (suggestions.description) html += `<p style="margin-bottom: 15px;"><strong>📋 Descrição:</strong><br><span style="color: #666; font-size: 0.9em;">${suggestions.description}</span></p>`;

        let details = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">';
        if (suggestions.bedrooms) details += `<p><strong>🛏️ Quartos:</strong> ${suggestions.bedrooms}</p>`;
        if (suggestions.bathrooms) details += `<p><strong>🚿 Banheiros:</strong> ${suggestions.bathrooms}</p>`;
        if (suggestions.area) details += `<p><strong>📏 Área:</strong> ${suggestions.area}m²</p>`;
        if (suggestions.parking) details += `<p><strong>🚗 Vagas:</strong> ${suggestions.parking}</p>`;
        details += '</div>';
        html += details;

        if (suggestions.priceHint) html += `<p style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px;"><strong>💰 Preço Estimado:</strong><br><span style="font-size: 1.2em; color: #004AAD;">${suggestions.priceHint}</span></p>`;
        html += '</div>';

        Swal.fire({
          title: '✨ Sugestões da IA',
          html: html,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-check"></i> Aplicar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#28A745'
        }).then((result: any) => {
          if (result.isConfirmed) {
            if (suggestions.title) this.formData.title = suggestions.title;
            if (suggestions.description) this.formData.description = suggestions.description;
            if (suggestions.bedrooms) this.formData.bedrooms = suggestions.bedrooms;
            if (suggestions.bathrooms) this.formData.bathrooms = suggestions.bathrooms;
            if (suggestions.area) this.formData.area = suggestions.area;
            if (suggestions.parking) this.formData.parking = suggestions.parking;

            Swal.fire({
              icon: 'success',
              title: 'Aplicado!',
              text: 'Sugestões aplicadas ao formulário',
              timer: 2000
            });
          }
        });
      },
      error: (err) => {
        this.aiLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Erro ao obter sugestões da IA'
        });
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/admin/login']);
      }
    });
  }

  formatPrice(price: number): string {
    return this.propertyService.formatPrice(price);
  }
}
