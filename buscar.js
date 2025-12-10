// Search page functionality
const API_BASE = window.location.origin.includes('localhost') 
    ? window.location.origin 
    : 'https://crm-imobil.onrender.com';
let allProperties = [];
let filteredProperties = [];
let currentPage = 1;
const propertiesPerPage = 9;
let map = null;
let markers = [];
let markerClusterGroup = null;
let currentView = 'grid';

// Load properties on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAllProperties();
    setupMobileMenu();
});

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const nav = document.getElementById('nav');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = mobileMenuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
    }
}

// Load all properties
async function loadAllProperties() {
    showSkeleton();
    
    try {
        const response = await fetch(`${API_BASE}/api/properties`);
        allProperties = await response.json();
        
        // Filter out sold properties
        allProperties = allProperties.filter(p => !p.sold);
        
        // Populate city filter
        populateCityFilter();
        
        // Apply initial filters
        applyFilters();
    } catch (error) {
        console.error('Error loading properties:', error);
        showError();
    }
}

// Populate city filter with unique cities
function populateCityFilter() {
    const citySelect = document.getElementById('filterCity');
    const cities = [...new Set(allProperties.map(p => p.city).filter(c => c))].sort();
    
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// Apply filters
function applyFilters() {
    const searchText = document.getElementById('searchText').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    const filterCity = document.getElementById('filterCity').value;
    const filterBedrooms = document.getElementById('filterBedrooms').value;
    const filterPriceMin = parseFloat(document.getElementById('filterPriceMin').value) || 0;
    const filterPriceMax = parseFloat(document.getElementById('filterPriceMax').value) || Infinity;
    
    filteredProperties = allProperties.filter(property => {
        // Text search
        if (searchText) {
            const searchableText = `${property.title} ${property.description} ${property.neighborhood} ${property.city}`.toLowerCase();
            if (!searchableText.includes(searchText)) return false;
        }
        
        // Type filter (case-insensitive comparison)
        if (filterType && property.type && filterType.toLowerCase() !== property.type.toLowerCase()) return false;
        
        // City filter
        if (filterCity && property.city !== filterCity) return false;
        
        // Bedrooms filter
        if (filterBedrooms && property.bedrooms < parseInt(filterBedrooms)) return false;
        
        // Price range filter
        if (property.price < filterPriceMin || property.price > filterPriceMax) return false;
        
        return true;
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Sort properties
    sortProperties();
    
    // If user is viewing the map, refresh markers to reflect new results
    if (currentView === 'map' && map) {
        updateMapMarkers();
    }
}

// Clear all filters
function clearFilters() {
    document.getElementById('searchText').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterCity').value = '';
    document.getElementById('filterBedrooms').value = '';
    document.getElementById('filterPriceMin').value = '';
    document.getElementById('filterPriceMax').value = '';
    document.getElementById('sortSelect').value = 'featured';
    
    applyFilters();
}

// Sort properties
function sortProperties() {
    const sortBy = document.getElementById('sortSelect').value;
    
    switch (sortBy) {
        case 'price-asc':
            filteredProperties.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProperties.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filteredProperties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'featured':
        default:
            filteredProperties.sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            break;
    }
    
    renderResults();
}

// Render results
function renderResults() {
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');
    
    // Update count
    const totalResults = filteredProperties.length;
    resultsCount.textContent = `${totalResults} ${totalResults === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`;
    
    if (totalResults === 0) {
        resultsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Nenhum imóvel encontrado</h3>
                <p>Tente ajustar os filtros ou entre em contato para mais opções</p>
                <a href="https://wa.me/5511999999999?text=Olá, estou procurando um imóvel" class="btn btn-primary" target="_blank">
                    <i class="fab fa-whatsapp"></i> Falar com Corretor
                </a>
            </div>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(totalResults / propertiesPerPage);
    const startIndex = (currentPage - 1) * propertiesPerPage;
    const endIndex = Math.min(startIndex + propertiesPerPage, totalResults);
    const currentProperties = filteredProperties.slice(startIndex, endIndex);
    
    // Render properties
    resultsGrid.innerHTML = currentProperties.map(property => {
        const images = property.imageUrls || (property.imageUrl ? [property.imageUrl] : []);
        const firstImage = images.length > 0 ? images[0] : null;
        const location = property.city ? 
            `${property.neighborhood || ''}, ${property.city} - ${property.state}` : 
            (property.location || 'Localização não informada');
        
        return `
            <div class="property-card ${property.featured ? 'featured' : ''}">
                <a href="/imovel/${property._id || property.id}" class="property-link">
                    <div class="property-image">
                        ${firstImage ? 
                            `<img src="${firstImage}" alt="${property.title}" loading="lazy" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image fa-3x\\'></i>'">` : 
                            '<i class="fas fa-image fa-3x"></i>'
                        }
                        ${property.featured ? '<span class="property-badge badge-featured"><i class="fas fa-star"></i> Destaque</span>' : ''}
                        ${images.length > 1 ? `<span class="property-badge badge-images"><i class="fas fa-images"></i> ${images.length} fotos</span>` : ''}
                    </div>
                    <div class="property-content">
                        <span class="property-type">${property.type || 'Imóvel'}</span>
                        <h3 class="property-title">${property.title}</h3>
                        <div class="property-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${location}
                        </div>
                        <div class="property-price">
                            R$ ${formatPrice(property.price)}
                        </div>
                        ${renderPropertyDetails(property)}
                        ${property.description ? `<p class="property-description">${property.description}</p>` : ''}
                    </div>
                </a>
                <div class="property-actions">
                    <a href="https://wa.me/${property.contact.replace(/\D/g, '')}?text=Olá, tenho interesse no imóvel: ${encodeURIComponent(property.title)}" 
                       class="btn btn-primary" target="_blank" style="flex: 1;">
                        <i class="fab fa-whatsapp"></i> Tenho Interesse
                    </a>
                    ${property.latitude && property.longitude ? `
                    <a href="https://www.google.com/maps?q=${property.latitude},${property.longitude}" 
                       class="btn btn-secondary" target="_blank" title="Ver no Google Maps">
                        <i class="fas fa-map-marked-alt"></i> Ver no Maps
                    </a>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    // Render pagination
    renderPagination(totalPages);
    
    // Scroll to top of results
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

// Render property details
function renderPropertyDetails(property) {
    const details = [];
    
    if (property.bedrooms) {
        details.push(`<span class="property-detail"><i class="fas fa-bed"></i> ${property.bedrooms} quartos</span>`);
    }
    if (property.bathrooms) {
        details.push(`<span class="property-detail"><i class="fas fa-bath"></i> ${property.bathrooms} banheiros</span>`);
    }
    if (property.area) {
        details.push(`<span class="property-detail"><i class="fas fa-ruler-combined"></i> ${property.area}m²</span>`);
    }
    if (property.parking) {
        details.push(`<span class="property-detail"><i class="fas fa-car"></i> ${property.parking} vagas</span>`);
    }

    return details.length > 0 ? `<div class="property-details">${details.join('')}</div>` : '';
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

// Render pagination
function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i> Anterior
    </button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `<button onclick="changePage(${i})" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    // Next button
    paginationHTML += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        Próxima <i class="fas fa-chevron-right"></i>
    </button>`;
    
    pagination.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderResults();
}

// Show skeleton loading
function showSkeleton() {
    const resultsGrid = document.getElementById('resultsGrid');
    const skeletonCards = Array(6).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton skeleton-line short"></div>
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line"></div>
                <div class="skeleton skeleton-line short"></div>
            </div>
        </div>
    `).join('');
    
    resultsGrid.innerHTML = skeletonCards;
}

// Show error
function showError() {
    const resultsGrid = document.getElementById('resultsGrid');
    resultsGrid.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erro ao carregar imóveis</h3>
            <p>Por favor, tente novamente mais tarde ou entre em contato</p>
            <button class="btn btn-primary" onclick="loadAllProperties()">
                <i class="fas fa-redo"></i> Tentar Novamente
            </button>
        </div>
    `;
}

// Switch between grid and map view
function switchView(view) {
    currentView = view;
    const gridView = document.getElementById('resultsGrid');
    const mapView = document.getElementById('map');
    const gridBtn = document.getElementById('gridViewBtn');
    const mapBtn = document.getElementById('mapViewBtn');
    const pagination = document.getElementById('pagination');
    
    if (view === 'map') {
        gridView.style.display = 'none';
        mapView.classList.add('active');
        pagination.style.display = 'none';
        gridBtn.classList.remove('active');
        mapBtn.classList.add('active');
        
        // Initialize or update map
        if (!map) {
            initMap();
        } else {
            updateMapMarkers();
        }
    } else {
        gridView.style.display = 'grid';
        mapView.classList.remove('active');
        pagination.style.display = 'flex';
        gridBtn.classList.add('active');
        mapBtn.classList.remove('active');
    }
}

// Initialize map
function initMap() {
    // Default center (São Paulo)
    const defaultLat = -23.550520;
    const defaultLng = -46.633308;
    
    map = L.map('map').setView([defaultLat, defaultLng], 12);
    
    // Add CartoDB Positron tiles - cleaner, easier to see style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    
    updateMapMarkers();
}

// Update map markers
function updateMapMarkers() {
    if (!map) return;
    
    // Clear existing marker cluster group from the map
    if (markerClusterGroup) {
        map.removeLayer(markerClusterGroup);
        markerClusterGroup = null;
    }
    markers = [];
    
    // Add markers for filtered properties with valid coordinates
    const validProperties = filteredProperties.filter(p => p.latitude && p.longitude);
    
    if (validProperties.length === 0) {
        // Center on default location (São Paulo)
        map.setView([-23.550520, -46.633308], 12);
        return;
    }
    
    const bounds = [];
    
    // Create marker cluster group for better performance
    markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
    });
    
    validProperties.forEach(property => {
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);
        
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
        
        // Create marker
        const marker = L.marker([lat, lng], { icon });
        
        // Create popup content with better styling
        const popupContent = `
            <div class="map-popup" style="min-width: 250px;">
                ${firstImage ? `<img src="${firstImage}" alt="${property.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" onerror="this.style.display='none'">` : ''}
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">${property.title}</h3>
                <div style="color: #666; font-size: 14px; margin-bottom: 10px;">
                    <i class="fas fa-map-marker-alt" style="color: #004AAD;"></i> ${location}
                </div>
                <div style="font-size: 18px; font-weight: bold; color: #004AAD; margin-bottom: 10px;">
                    R$ ${formatPrice(property.price)}
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
        
        markerClusterGroup.addLayer(marker);
        markers.push(marker);
    });
    
    // Add cluster group to map
    map.addLayer(markerClusterGroup);
    
    // Fit map to show all markers
    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}
