// API Base URL - use local server or fallback to remote
const API_BASE = window.location.origin.includes('localhost') 
    ? window.location.origin 
    : 'https://crm-imobil.onrender.com';

// Get property ID from URL
const urlParams = new URLSearchParams(window.location.search);
const propertyId = urlParams.get('id');

// Image gallery state
let currentImageIndex = 0;
let propertyImages = [];

// Fetch property data
async function loadProperty() {
    const loading = document.getElementById('loading');
    const propertyContent = document.getElementById('propertyContent');
    const notFound = document.getElementById('notFound');
    
    if (!propertyId) {
        showNotFound();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/properties/${propertyId}`);
        
        if (!response.ok) {
            throw new Error('Property not found');
        }

        const property = await response.json();
        displayProperty(property);
    } catch (error) {
        console.error('Error loading property:', error);
        showNotFound();
    }
}

function showNotFound() {
    const loading = document.getElementById('loading');
    const notFound = document.getElementById('notFound');
    loading.style.display = 'none';
    notFound.style.display = 'block';
}

function displayProperty(property) {
    const loading = document.getElementById('loading');
    const propertyContent = document.getElementById('propertyContent');
    
    // Hide loading, show content
    loading.style.display = 'none';
    propertyContent.style.display = 'block';

    // Set title and meta
    document.title = `${property.title} - Alancarmo Corretor`;
    
    // Hero Section
    document.getElementById('propertyTitle').textContent = property.title;
    const locationText = `${property.neighborhood || property.city}, ${property.city} - ${property.state || 'SP'}`;
    document.getElementById('propertyLocation').querySelector('span').textContent = locationText;

    // Price
    const formattedPrice = property.price 
        ? `R$ ${property.price.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
        : 'Consulte-nos';
    document.getElementById('propertyPrice').textContent = formattedPrice;

    // Hero Image
    const heroImage = document.getElementById('heroImage');
    if (property.imageUrls && property.imageUrls.length > 0) {
        heroImage.src = property.imageUrls[0];
    } else if (property.images && property.images.length > 0) {
        heroImage.src = property.images[0];
    } else if (property.imageUrl) {
        heroImage.src = property.imageUrl;
    } else {
        heroImage.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994';
    }
    heroImage.alt = property.title;

    // Badges
    const badgesContainer = document.getElementById('propertyBadges');
    badgesContainer.innerHTML = '';
    if (property.featured) {
        badgesContainer.innerHTML += '<span class="property-badge badge-featured"><i class="fas fa-star"></i> Destaque</span>';
    }
    if (property.sold) {
        badgesContainer.innerHTML += '<span class="property-badge badge-sold"><i class="fas fa-check-circle"></i> Vendido</span>';
    }

    // Quick Stats
    document.getElementById('statBedrooms').textContent = property.bedrooms || '-';
    document.getElementById('statBathrooms').textContent = property.bathrooms || '-';
    document.getElementById('statArea').textContent = property.area ? `${property.area}m²` : '-';
    document.getElementById('statParking').textContent = property.parking || '-';

    // Details (existing detail cards)
    document.getElementById('propertyType').textContent = property.type || '-';
    document.getElementById('propertyBedrooms').textContent = property.bedrooms || '-';
    document.getElementById('propertyBathrooms').textContent = property.bathrooms || '-';
    document.getElementById('propertyArea').textContent = property.area ? `${property.area}m²` : '-';
    document.getElementById('propertyParking').textContent = property.parking || '-';
    document.getElementById('propertyContact').textContent = property.contact || '(11) 99999-9999';

    // Description
    document.getElementById('propertyDescription').textContent = property.description || 'Descrição não disponível.';

    // Load Gallery Images
    loadGallery(property);

    // WhatsApp Button
    const whatsappMessage = `Olá! Tenho interesse no imóvel: ${property.title}`;
    const whatsappNumber = (property.contact || '5511999999999').replace(/\D/g, '');
    document.getElementById('whatsappBtn').href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    // Google Maps Button
    const mapsBtn = document.getElementById('mapsBtn');
    if (property.latitude && property.longitude) {
        mapsBtn.href = `https://www.google.com/maps?q=${property.latitude},${property.longitude}`;
        mapsBtn.style.display = 'inline-flex';
        
        // Show map section
        loadMap(property);
    } else {
        mapsBtn.style.display = 'none';
    }
}

function loadGallery(property) {
    const gallerySection = document.getElementById('propertyGallery');
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.getElementById('thumbnails');
    
    // Get images from property
    if (property.imageUrls && Array.isArray(property.imageUrls) && property.imageUrls.length > 0) {
        propertyImages = property.imageUrls;
    } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        propertyImages = property.images;
    } else if (property.imageUrl) {
        propertyImages = [property.imageUrl];
    } else {
        propertyImages = ['https://images.unsplash.com/photo-1568605114967-8130f3a36994'];
    }
    
    // Show gallery section if there are multiple images
    if (propertyImages.length > 1) {
        gallerySection.style.display = 'block';
        
        // Set main image
        mainImage.src = propertyImages[0];
        mainImage.alt = property.title;
        
        // Create thumbnails
        thumbnails.innerHTML = propertyImages.map((img, index) => `
            <img src="${img}" alt="${property.title} - Imagem ${index + 1}" 
                 class="gallery-thumbnail ${index === 0 ? 'active' : ''}"
                 onclick="selectImage(${index})"
                 onerror="this.src='https://images.unsplash.com/photo-1568605114967-8130f3a36994'">
        `).join('');
        
        currentImageIndex = 0;
    } else {
        // Only one image, hide the gallery (hero already shows it)
        gallerySection.style.display = 'none';
    }
}

function selectImage(index) {
    if (index >= 0 && index < propertyImages.length) {
        currentImageIndex = index;
        document.getElementById('mainImage').src = propertyImages[index];
        
        // Update active thumbnail
        document.querySelectorAll('.gallery-thumbnail').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }
}

function previousImage() {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : propertyImages.length - 1;
    selectImage(newIndex);
}

function nextImage() {
    const newIndex = currentImageIndex < propertyImages.length - 1 ? currentImageIndex + 1 : 0;
    selectImage(newIndex);
}

function loadMap(property) {
    const mapSection = document.getElementById('propertyMapSection');
    const mapFrame = document.getElementById('propertyMapFrame');
    
    if (property.latitude && property.longitude) {
        // Property has coordinates - show map
        if (mapSection && mapFrame) {
            mapSection.style.display = 'block';
            mapFrame.src = `https://maps.google.com/maps?q=${property.latitude},${property.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
    } else {
        // No coordinates - hide map section
        if (mapSection) {
            mapSection.style.display = 'none';
        }
    }
}

// Load property on page load
loadProperty();
