const API_BASE = 'https://crm-imobil.onrender.com';
const API_URL = `${API_BASE}/api/properties`;
let properties = [];
let editingId = null;

// Check authentication on page load
async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/admin/login.html';
        return false;
    }
}

// Logout function
async function logout() {
    const token = localStorage.getItem('adminToken');
    
    if (token) {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
    
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login.html';
}

// Load dashboard stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const stats = await response.json();
        
        const statsSection = document.getElementById('statsSection');
        statsSection.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="fas fa-building"></i>
                </div>
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total de Imóveis</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-value">${stats.available}</div>
                <div class="stat-label">Disponíveis</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-value">${stats.featured}</div>
                <div class="stat-label">Em Destaque</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">
                    <i class="fas fa-handshake"></i>
                </div>
                <div class="stat-value">${stats.sold}</div>
                <div class="stat-label">Vendidos</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load properties on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;
    
    // Load stats and properties
    await loadStats();
    loadProperties();
    
    // Setup form submit handler
    document.getElementById('propertyForm').addEventListener('submit', handleFormSubmit);
    
    // Setup CEP auto-fill
    document.getElementById('cep').addEventListener('blur', handleCEPLookup);
    
    // Format CEP as user types
    document.getElementById('cep').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.slice(0, 5) + '-' + value.slice(5, 8);
        }
        e.target.value = value;
    });
    
    // Format phone number as user types
    document.getElementById('contact').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            if (value.length > 6) {
                value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            } else if (value.length > 0) {
                value = value.replace(/^(\d*)/, '($1');
            }
        }
        e.target.value = value.slice(0, 15); // Limit to formatted length
    });
    
    // Format price as currency (Brazilian Real)
    document.getElementById('price').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value) {
            // Convert to number and format
            value = (parseInt(value) / 100).toFixed(2);
            value = value.replace('.', ',');
            value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        e.target.value = value;
    });
    
    // Format area input
    const areaInput = document.getElementById('area');
    if (areaInput) {
        areaInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value) {
                value = (parseInt(value) / 100).toFixed(2);
                value = value.replace('.', ',');
            }
            e.target.value = value;
        });
    }
    
    // AI Suggestion functionality - Smart analysis from title/description
    const btnAiSuggest = document.getElementById('btnAiSuggest');
    if (btnAiSuggest) {
        btnAiSuggest.addEventListener('click', async () => {
            // Get current form values - AI works with title/description!
            const title = document.getElementById('title').value.trim();
            const description = document.getElementById('description').value.trim();
            const type = document.getElementById('type').value;
            const bedrooms = document.getElementById('bedrooms').value;
            const bathrooms = document.getElementById('bathrooms').value;
            const area = document.getElementById('area').value.replace(/\D/g, '').replace(',', '.');
            const city = document.getElementById('city').value;
            const neighborhood = document.getElementById('neighborhood').value;
            
            // Only need title OR description - AI will analyze text!
            if (!title && !description) {
                Swal.fire({
                    icon: 'info',
                    title: 'Dados insuficientes',
                    text: 'Digite pelo menos um título ou descrição para a IA gerar sugestões inteligentes',
                    confirmButtonColor: '#004AAD'
                });
                return;
            }
            
            btnAiSuggest.disabled = true;
            btnAiSuggest.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando com IA...';
            
            try {
                const response = await fetch(`${API_BASE}/api/ai/suggest`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, description, type, bedrooms, bathrooms, area, city, neighborhood })
                });
                
                if (!response.ok) throw new Error('Erro ao obter sugestões');
                
                const suggestions = await response.json();
                
                // Build beautiful HTML for suggestions
                let htmlContent = '<div style="text-align: left; padding: 10px;">';
                if (suggestions.title) htmlContent += `<p style="margin-bottom: 15px;"><strong>📝 Título:</strong><br><span style="color: #666;">${suggestions.title}</span></p>`;
                if (suggestions.description) htmlContent += `<p style="margin-bottom: 15px;"><strong>📋 Descrição:</strong><br><span style="color: #666; font-size: 0.9em;">${suggestions.description}</span></p>`;
                
                let detailsHtml = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">';
                if (suggestions.bedrooms) detailsHtml += `<p><strong>🛏️ Quartos:</strong> ${suggestions.bedrooms}</p>`;
                if (suggestions.bathrooms) detailsHtml += `<p><strong>🚿 Banheiros:</strong> ${suggestions.bathrooms}</p>`;
                if (suggestions.area) detailsHtml += `<p><strong>📏 Área:</strong> ${suggestions.area}m²</p>`;
                if (suggestions.parking) detailsHtml += `<p><strong>🚗 Vagas:</strong> ${suggestions.parking}</p>`;
                detailsHtml += '</div>';
                htmlContent += detailsHtml;
                
                if (suggestions.priceHint) htmlContent += `<p style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 5px;"><strong>💰 Preço Estimado:</strong><br><span style="font-size: 1.2em; color: #004AAD;">${suggestions.priceHint}</span></p>`;
                htmlContent += '</div>';
                
                const result = await Swal.fire({
                    title: '✨ Sugestões da IA',
                    html: htmlContent,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: '<i class="fas fa-check"></i> Aplicar sugestões',
                    cancelButtonText: '<i class="fas fa-times"></i> Cancelar',
                    confirmButtonColor: '#28A745',
                    cancelButtonColor: '#DC3545',
                    width: '600px',
                    customClass: {
                        popup: 'swal-wide'
                    }
                });
                
                if (result.isConfirmed) {
                    // Apply suggestions to form
                    if (suggestions.title) document.getElementById('title').value = suggestions.title;
                    if (suggestions.description) document.getElementById('description').value = suggestions.description;
                    if (suggestions.bedrooms) document.getElementById('bedrooms').value = suggestions.bedrooms;
                    if (suggestions.bathrooms) document.getElementById('bathrooms').value = suggestions.bathrooms;
                    if (suggestions.area) document.getElementById('area').value = String(suggestions.area).replace('.', ',');
                    if (suggestions.parking) document.getElementById('parking').value = suggestions.parking;
                    if (suggestions.priceHint && !document.getElementById('price').value) {
                        document.getElementById('price').value = suggestions.priceHint.replace('R$ ', '').replace(/\./g, '');
                    }
                    
                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: 'Campos preenchidos!',
                        text: 'As sugestões da IA foram aplicadas ao formulário',
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
                
            } catch (error) {
                console.error('AI suggestion error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Não foi possível obter sugestões da IA. Tente novamente.',
                    confirmButtonColor: '#DC3545'
                });
            } finally {
                btnAiSuggest.disabled = false;
                btnAiSuggest.innerHTML = '<i class="fas fa-magic"></i> Sugestões com IA';
            }
        });
    }
    
    // Handle image file uploads
    const imageFilesInput = document.getElementById('imageFiles');
    const imagePreview = document.getElementById('imagePreview');
    let uploadedImages = [];
    
    imageFilesInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        imagePreview.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imgContainer = document.createElement('div');
                imgContainer.style.position = 'relative';
                imgContainer.innerHTML = `
                    <img src="${event.target.result}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 5px;">
                    <button type="button" onclick="removeImage(${index})" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
                `;
                imagePreview.appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        });
    });
    
    // Global function to remove image
    window.removeImage = (index) => {
        const dt = new DataTransfer();
        const files = imageFilesInput.files;
        
        for (let i = 0; i < files.length; i++) {
            if (i !== index) dt.items.add(files[i]);
        }
        
        imageFilesInput.files = dt.files;
        imageFilesInput.dispatchEvent(new Event('change'));
    };
});

// Handle CEP lookup
async function handleCEPLookup() {
    const cepInput = document.getElementById('cep');
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/cep/${cep}`);
        
        if (!response.ok) {
            alert('CEP não encontrado');
            return;
        }
        
        const data = await response.json();
        
        // Fill address fields
        document.getElementById('street').value = data.street || '';
        document.getElementById('neighborhood').value = data.neighborhood || '';
        document.getElementById('city').value = data.city || '';
        document.getElementById('state').value = data.state || '';
        
        // Geocode the address
        await geocodeAddress(data.address);
        
    } catch (error) {
        console.error('Error looking up CEP:', error);
        alert('Erro ao buscar CEP. Tente novamente.');
    }
}

// Geocode address to get lat/lng
async function geocodeAddress(address) {
    try {
        const response = await fetch(`${API_BASE}/api/geocode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address })
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('latitude').value = data.lat;
            document.getElementById('longitude').value = data.lng;
        }
    } catch (error) {
        console.error('Error geocoding address:', error);
    }
}

// Load all properties
async function loadProperties() {
    try {
        const response = await fetch(API_URL);
        properties = await response.json();
        renderProperties();
    } catch (error) {
        console.error('Error loading properties:', error);
        alert('Erro ao carregar imóveis. Verifique se o servidor está rodando.');
    }
}

// Render properties list
function renderProperties() {
    const container = document.getElementById('propertiesContainer');
    const emptyState = document.getElementById('emptyState');

    if (properties.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = properties.map(property => {
        const images = property.imageUrls || (property.imageUrl ? [property.imageUrl] : []);
        const firstImage = images.length > 0 ? images[0] : null;
        const location = property.city ? `${property.neighborhood}, ${property.city} - ${property.state}` : (property.location || 'Localização não informada');
        
        return `
        <div class="property-card">
            <div class="property-image">
                ${firstImage ? 
                    `<img src="${firstImage}" alt="${property.title}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image fa-3x\\'></i>'">` : 
                    '<i class="fas fa-image fa-3x"></i>'
                }
                ${property.featured ? '<span class="property-badge featured"><i class="fas fa-star"></i> Destaque</span>' : ''}
                ${property.sold ? '<span class="property-badge sold"><i class="fas fa-check"></i> Vendido</span>' : ''}
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
                <div class="property-actions">
                    <button class="btn btn-primary btn-sm" onclick="editProperty('${property.id}')" style="flex: 1;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProperty('${property.id}')" style="flex: 1;">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
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

// Open add modal
function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Adicionar Imóvel';
    document.getElementById('propertyForm').reset();
    document.getElementById('propertyId').value = '';
    document.getElementById('propertyModal').classList.add('active');
}

// Open edit modal
function editProperty(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Editar Imóvel';
    document.getElementById('propertyId').value = property.id;
    document.getElementById('type').value = property.type || '';
    document.getElementById('title').value = property.title || '';
    document.getElementById('description').value = property.description || '';
    document.getElementById('price').value = property.price || '';
    document.getElementById('cep').value = property.zipCode || property.cep || '';
    document.getElementById('street').value = property.street || '';
    document.getElementById('neighborhood').value = property.neighborhood || '';
    document.getElementById('city').value = property.city || '';
    document.getElementById('state').value = property.state || '';
    document.getElementById('latitude').value = property.latitude || '';
    document.getElementById('longitude').value = property.longitude || '';
    document.getElementById('bedrooms').value = property.bedrooms || '';
    document.getElementById('bathrooms').value = property.bathrooms || '';
    document.getElementById('area').value = property.area || '';
    document.getElementById('parking').value = property.parking || '';
    
    // Handle image URLs
    const images = property.imageUrls || (property.imageUrl ? [property.imageUrl] : []);
    document.getElementById('imageUrls').value = images.join('\n');
    
    document.getElementById('featured').checked = property.featured || false;
    document.getElementById('sold').checked = property.sold || false;
    document.getElementById('contact').value = property.contact || '';
    
    document.getElementById('propertyModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('propertyModal').classList.remove('active');
    editingId = null;
}

// Handle form submit
async function handleFormSubmit(e) {
    e.preventDefault();

    // Handle image uploads first
    let uploadedImageUrls = [];
    const imageFiles = document.getElementById('imageFiles').files;
    
    if (imageFiles.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < imageFiles.length; i++) {
            formData.append('images', imageFiles[i]);
        }
        
        try {
            const uploadResponse = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                // URLs from Supabase Storage are already full URLs, no need to prepend origin
                uploadedImageUrls = uploadResult.imageUrls.map(url => 
                    url.startsWith('http') ? url : window.location.origin + url
                );
                console.log('✅ Images uploaded:', uploadedImageUrls);
            } else {
                console.error('Upload failed:', uploadResponse.status);
                Swal.fire({
                    icon: 'warning',
                    title: 'Aviso',
                    text: 'Erro ao fazer upload das imagens. Continuando com URLs fornecidas.'
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            Swal.fire({
                icon: 'warning',
                title: 'Aviso',
                text: 'Erro ao fazer upload das imagens. Continuando com URLs fornecidas.'
            });
        }
    }

    // Parse image URLs from textarea
    const imageUrlsText = document.getElementById('imageUrls').value.trim();
    const textImageUrls = imageUrlsText ? imageUrlsText.split('\n').filter(url => url.trim()).map(url => url.trim()) : [];
    
    // Combine uploaded images and text URLs
    const imageUrls = [...uploadedImageUrls, ...textImageUrls];

    // Parse price (remove formatting)
    const priceValue = document.getElementById('price').value;
    const price = parseFloat(priceValue.replace(/\./g, '').replace(',', '.')) || 0;
    
    // Parse area (remove formatting)
    const areaValue = document.getElementById('area').value;
    const area = parseFloat(areaValue.replace(/\./g, '').replace(',', '.')) || 0;
    
    // Parse contact (remove formatting)
    const contactValue = document.getElementById('contact').value;
    const contact = contactValue.replace(/\D/g, '');

    // Parse latitude and longitude (convert empty strings to null)
    const latValue = document.getElementById('latitude').value;
    const lngValue = document.getElementById('longitude').value;
    const latitude = latValue && latValue.trim() !== '' ? parseFloat(latValue) : null;
    const longitude = lngValue && lngValue.trim() !== '' ? parseFloat(lngValue) : null;

    const propertyData = {
        type: document.getElementById('type').value,
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        price: price,
        zipCode: document.getElementById('cep').value,
        street: document.getElementById('street').value,
        neighborhood: document.getElementById('neighborhood').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        latitude: latitude,
        longitude: longitude,
        bedrooms: parseInt(document.getElementById('bedrooms').value) || 0,
        bathrooms: parseInt(document.getElementById('bathrooms').value) || 0,
        area: area,
        parking: parseInt(document.getElementById('parking').value) || 0,
        imageUrls: imageUrls,
        imageUrl: imageUrls.length > 0 ? imageUrls[0] : '', // Keep backward compatibility
        featured: document.getElementById('featured').checked,
        sold: document.getElementById('sold').checked,
        contact: contact
    };

    try {
        let response;
        if (editingId) {
            // Update existing property
            response = await fetch(`${API_URL}/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(propertyData)
            });
        } else {
            // Create new property
            response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(propertyData)
            });
        }

        if (response.ok) {
            closeModal();
            await loadStats(); // Refresh stats
            loadProperties();
            alert(editingId ? 'Imóvel atualizado com sucesso!' : 'Imóvel adicionado com sucesso!');
        } else {
            alert('Erro ao salvar imóvel. Tente novamente.');
        }
    } catch (error) {
        console.error('Error saving property:', error);
        alert('Erro ao salvar imóvel. Verifique sua conexão.');
    }
}

// Delete property
async function deleteProperty(id) {
    if (!confirm('Tem certeza que deseja excluir este imóvel?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadStats(); // Refresh stats
            loadProperties();
            alert('Imóvel excluído com sucesso!');
        } else {
            alert('Erro ao excluir imóvel. Tente novamente.');
        }
    } catch (error) {
        console.error('Error deleting property:', error);
        alert('Erro ao excluir imóvel. Verifique sua conexão.');
    }
}

// Close modal on outside click
document.getElementById('propertyModal').addEventListener('click', (e) => {
    if (e.target.id === 'propertyModal') {
        closeModal();
    }
});
