// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');

mobileMenuToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
    const icon = mobileMenuToggle.querySelector('i');
    icon.classList.toggle('fa-bars');
    icon.classList.toggle('fa-times');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        const icon = mobileMenuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        nav.classList.remove('active');
        const icon = mobileMenuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header Scroll Effect
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// Testimonials Carousel
let currentTestimonial = 0;
const testimonials = document.querySelectorAll('.depoimento-card');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function showTestimonial(index) {
    testimonials.forEach((testimonial, i) => {
        testimonial.classList.remove('active');
        if (i === index) {
            testimonial.classList.add('active');
        }
    });
}

function nextTestimonial() {
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
    showTestimonial(currentTestimonial);
}

function prevTestimonial() {
    currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
    showTestimonial(currentTestimonial);
}

if (nextBtn) {
    nextBtn.addEventListener('click', nextTestimonial);
}

if (prevBtn) {
    prevBtn.addEventListener('click', prevTestimonial);
}

// Auto-advance testimonials
setInterval(nextTestimonial, 5000);

// Contact Form
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const telefone = document.getElementById('telefone').value;
        const servico = document.getElementById('servico').value;
        const mensagem = document.getElementById('mensagem').value;
        
        // Create WhatsApp message
        const whatsappMessage = `*Nova mensagem do site*%0A%0A*Nome:* ${encodeURIComponent(nome)}%0A*Email:* ${encodeURIComponent(email)}%0A*Telefone:* ${encodeURIComponent(telefone)}%0A*Serviço:* ${encodeURIComponent(servico)}%0A*Mensagem:* ${encodeURIComponent(mensagem)}`;
        
        // Open WhatsApp
        window.open(`https://wa.me/5511999999999?text=${whatsappMessage}`, '_blank');
        
        // Reset form
        contactForm.reset();
        
        // Show success message
        alert('Obrigado! Você será redirecionado para o WhatsApp para completar o envio da mensagem.');
    });
}

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe service cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `all 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Observe property cards with stagger effect
setTimeout(() => {
    document.querySelectorAll('.property-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}, 100);

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');

function highlightNavigation() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink.style.color = 'var(--primary-color)';
            } else {
                navLink.style.color = '';
            }
        }
    });
}

window.addEventListener('scroll', highlightNavigation);

// API Base URL
const API_BASE = 'https://crm-imobil.onrender.com';

// Load and display properties with Bootstrap carousel
async function loadProperties() {
    const propertiesGrid = document.getElementById('propertiesGrid');
    
    try {
        const response = await fetch(`${API_BASE}/api/properties`);
        const properties = await response.json();
        
        // Filter out sold properties for main site
        const availableProperties = properties.filter(p => !p.sold);
        
        if (availableProperties.length === 0) {
            propertiesGrid.innerHTML = `
                <div class="empty-properties">
                    <i class="fas fa-building fa-3x"></i>
                    <h3>Em breve novos imóveis</h3>
                    <p>Estamos preparando imóveis incríveis para você. Entre em contato para mais informações!</p>
                    <a href="https://wa.me/5511999999999?text=Olá, gostaria de informações sobre imóveis" class="btn btn-primary" target="_blank">
                        <i class="fab fa-whatsapp"></i> Falar com Corretor
                    </a>
                </div>
            `;
        } else {
            // Group properties into slides (3 per slide on desktop)
            const itemsPerSlide = window.innerWidth >= 992 ? 3 : (window.innerWidth >= 768 ? 2 : 1);
            const slides = [];
            for (let i = 0; i < availableProperties.length; i += itemsPerSlide) {
                slides.push(availableProperties.slice(i, i + itemsPerSlide));
            }
            
            // Create Bootstrap carousel HTML
            const carouselHTML = `
                <div id="propertiesCarousel" class="carousel slide" data-bs-ride="carousel" data-bs-interval="5000">
                    <div class="carousel-indicators">
                        ${slides.map((_, index) => `
                            <button type="button" data-bs-target="#propertiesCarousel" data-bs-slide-to="${index}" 
                                    ${index === 0 ? 'class="active" aria-current="true"' : ''} 
                                    aria-label="Slide ${index + 1}"></button>
                        `).join('')}
                    </div>
                    <div class="carousel-inner">
                        ${slides.map((slideProperties, slideIndex) => `
                            <div class="carousel-item ${slideIndex === 0 ? 'active' : ''}">
                                <div class="row g-4 justify-content-center px-4">
                                    ${slideProperties.map(property => `
                                        <div class="col-12 col-md-6 col-lg-4">
                                            ${createPropertyCard(property)}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#propertiesCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Anterior</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#propertiesCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Próximo</span>
                    </button>
                </div>
            `;
            
            propertiesGrid.innerHTML = carouselHTML;
            // Add fallback class for browsers that don't support :has()
            propertiesGrid.classList.add('has-carousel');
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        propertiesGrid.innerHTML = `
            <div class="empty-properties">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Não foi possível carregar os imóveis</h3>
                <p>Entre em contato para conhecer nossos imóveis disponíveis!</p>
                <a href="https://wa.me/5511999999999?text=Olá, gostaria de informações sobre imóveis" class="btn btn-primary" target="_blank">
                    <i class="fab fa-whatsapp"></i> Falar com Corretor
                </a>
            </div>
        `;
    }
}

function createPropertyCard(property) {
    const images = property.imageUrls || (property.imageUrl ? [property.imageUrl] : []);
    const firstImage = images.length > 0 ? images[0] : null;
    const location = property.city ? 
        `${property.neighborhood || ''}, ${property.city} - ${property.state}` : 
        (property.location || 'Localização não informada');
    
    // Create embedded Google Map if coordinates available
    const mapEmbed = (property.latitude && property.longitude) ? `
        <div class="property-map">
            <iframe
                width="100%"
                height="250"
                frameborder="0"
                style="border:0; border-radius: 8px; margin-top: 15px;"
                src="https://maps.google.com/maps?q=${property.latitude},${property.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed"
                allowfullscreen>
            </iframe>
        </div>
    ` : '';
    
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
                    R$ ${formatPropertyPrice(property.price)}
                </div>
                ${renderPropertyDetails(property)}
                ${property.description ? `<p class="property-description">${property.description}</p>` : ''}
            </div>
        </a>
        ${mapEmbed}
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
}

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

function formatPropertyPrice(price) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showTestimonial(currentTestimonial);
    highlightNavigation();
    loadProperties();
});
