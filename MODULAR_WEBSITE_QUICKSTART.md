# Quick Start: Using the Modular Website System

## For Developers

### 1. Running the System Locally

```bash
# Install dependencies
npm install
cd frontend && npm install --legacy-peer-deps && cd ..

# Apply database migration (if using Supabase)
# Upload migration-website-customization.sql to Supabase SQL Editor

# Start the server
npm run dev

# In another terminal, start Angular
npm run dev:angular

# Visit http://localhost:4200
```

### 2. Creating Your First Modular Page

```typescript
// src/app/pages/my-page/my-page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicSectionComponent } from '../../components/dynamic-section/dynamic-section';
import { WebsiteCustomizationService } from '../../services/website-customization.service';
import { LayoutSection } from '../../models/website-layout.model';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [CommonModule, DynamicSectionComponent],
  template: `
    <div *ngFor="let section of sections">
      <app-dynamic-section [section]="section"></app-dynamic-section>
    </div>
  `
})
export class MyPageComponent implements OnInit {
  sections: LayoutSection[] = [];

  constructor(private websiteService: WebsiteCustomizationService) {}

  ngOnInit() {
    // Use default template
    this.sections = this.websiteService.getDefaultTemplate('home');
  }
}
```

### 3. Testing Individual Sections

```typescript
// Create a test page to preview sections
import { HeroSectionComponent } from './components/sections/hero-section/hero-section';

@Component({
  selector: 'app-section-test',
  standalone: true,
  imports: [HeroSectionComponent],
  template: `
    <app-hero-section
      [config]="heroConfig"
      [styleConfig]="heroStyle"
    ></app-hero-section>
  `
})
export class SectionTestComponent {
  heroConfig = {
    title: 'Test Hero Title',
    subtitle: 'Test subtitle',
    showSearchBox: true
  };
  
  heroStyle = {
    backgroundColor: '#667eea',
    padding: '4rem 2rem'
  };
}
```

## For Site Administrators

### Using the Website Builder UI

The website builder component is already available at `/admin/website-builder` (you'll need to add this route):

```typescript
// In app.routes.ts
{
  path: 'admin/website-builder',
  component: WebsiteBuilderComponent,
  canActivate: [AuthGuard]
}
```

Features:
- Drag and drop sections
- Live preview
- Save and publish layouts
- Manage multiple page types

### Creating Layouts via API

```bash
# Create a new layout
curl -X POST http://localhost:3000/api/website/layouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "company_id": "your-company-id",
    "name": "New Home Layout",
    "page_type": "home",
    "is_active": false,
    "layout_config": {
      "sections": [
        {
          "id": "hero-1",
          "component_type": "hero",
          "order": 0,
          "config": {
            "title": "Welcome to Our Site",
            "subtitle": "Find your dream property"
          },
          "style_config": {
            "backgroundColor": "#667eea"
          }
        }
      ]
    }
  }'

# Publish the layout (make it active)
curl -X POST http://localhost:3000/api/website/layouts/{layout-id}/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example Layout Configurations

#### Simple Landing Page

```json
{
  "sections": [
    {
      "id": "hero-1",
      "component_type": "hero",
      "order": 0,
      "config": {
        "title": "Encontre seu imóvel ideal",
        "subtitle": "Milhares de opções para você",
        "showSearchBox": true
      },
      "style_config": {
        "backgroundColor": "#667eea",
        "padding": "6rem 2rem"
      }
    },
    {
      "id": "properties-1",
      "component_type": "property-grid",
      "order": 1,
      "config": {
        "title": "Imóveis Disponíveis",
        "limit": 9,
        "columns": 3,
        "showCarousel": false
      },
      "style_config": {
        "padding": "4rem 2rem"
      }
    },
    {
      "id": "cta-1",
      "component_type": "cta-button",
      "order": 2,
      "config": {
        "text": "Ver Todos os Imóveis",
        "link": "/buscar"
      },
      "style_config": {
        "padding": "2rem"
      }
    }
  ]
}
```

#### Feature-Rich Home Page

```json
{
  "sections": [
    {
      "id": "hero-1",
      "component_type": "hero",
      "order": 0,
      "config": {
        "title": "Seu próximo lar está aqui",
        "subtitle": "Curadoria especializada em imóveis",
        "showSearchBox": true,
        "quickLinks": [
          {"text": "Com Piscina", "tag": "pool"},
          {"text": "3+ Quartos", "tag": "3bed"}
        ]
      },
      "style_config": {}
    },
    {
      "id": "lifestyle-1",
      "component_type": "lifestyle-section",
      "order": 1,
      "config": {
        "title": "Encontre seu estilo de vida",
        "items": [
          {
            "icon": "fas fa-laptop-house",
            "title": "Home Office",
            "description": "Espaço ideal para trabalhar",
            "style": "home-office"
          },
          {
            "icon": "fas fa-dog",
            "title": "Pet Friendly",
            "description": "Espaço para seu melhor amigo",
            "style": "pet-friendly"
          }
        ]
      },
      "style_config": {
        "backgroundColor": "#f8f9fa"
      }
    },
    {
      "id": "properties-1",
      "component_type": "property-grid",
      "order": 2,
      "config": {
        "title": "Destaques da Semana",
        "limit": 6,
        "columns": 3,
        "showFeatured": true,
        "showCarousel": true
      },
      "style_config": {}
    },
    {
      "id": "stats-1",
      "component_type": "stats-section",
      "order": 3,
      "config": {
        "title": "Nossa História em Números",
        "stats": [
          {"label": "Imóveis Vendidos", "value": "1,500+"},
          {"label": "Clientes Satisfeitos", "value": "3,000+"},
          {"label": "Anos de Mercado", "value": "15+"}
        ]
      },
      "style_config": {
        "backgroundColor": "#667eea",
        "textColor": "#ffffff"
      }
    },
    {
      "id": "text-1",
      "component_type": "text-block",
      "order": 4,
      "config": {
        "title": "Sobre Nós",
        "content": "Somos uma imobiliária com 15 anos de experiência...",
        "alignment": "center"
      },
      "style_config": {
        "padding": "4rem 2rem"
      }
    }
  ]
}
```

## Common Recipes

### Full-Width Hero with Background Image

```json
{
  "id": "hero-1",
  "component_type": "hero",
  "order": 0,
  "config": {
    "title": "Luxury Properties",
    "subtitle": "Exclusive listings in prime locations",
    "backgroundImage": "https://your-cdn.com/hero-bg.jpg",
    "showSearchBox": true,
    "height": "large"
  },
  "style_config": {
    "padding": "8rem 2rem",
    "textColor": "#ffffff"
  }
}
```

### Property Carousel with Custom Columns

```json
{
  "id": "properties-1",
  "component_type": "property-grid",
  "order": 1,
  "config": {
    "title": "Recent Listings",
    "limit": 12,
    "columns": 4,
    "showFeatured": false,
    "showCarousel": true,
    "showViewAll": true
  },
  "style_config": {
    "backgroundColor": "#ffffff",
    "padding": "4rem 2rem"
  }
}
```

### Centered Call-to-Action Section

```json
{
  "id": "cta-1",
  "component_type": "text-block",
  "order": 2,
  "config": {
    "title": "Pronto para encontrar seu novo lar?",
    "content": "Nossa equipe está pronta para ajudá-lo. Entre em contato hoje mesmo!",
    "alignment": "center"
  },
  "style_config": {
    "backgroundColor": "#f8f9fa",
    "padding": "4rem 2rem",
    "textColor": "#333333"
  }
}
```

### Stats Banner

```json
{
  "id": "stats-1",
  "component_type": "stats-section",
  "order": 3,
  "config": {
    "stats": [
      {"label": "Active Listings", "value": "500+"},
      {"label": "Cities Covered", "value": "20+"},
      {"label": "Happy Clients", "value": "5,000+"},
      {"label": "Expert Agents", "value": "50+"}
    ]
  },
  "style_config": {
    "backgroundColor": "#004AAD",
    "textColor": "#ffffff",
    "padding": "3rem 2rem"
  }
}
```

## Tips and Tricks

### 1. Use Spacers for Visual Breathing Room

```json
{
  "id": "spacer-1",
  "component_type": "spacer",
  "order": 2,
  "config": {
    "height": "4rem"
  },
  "style_config": {}
}
```

### 2. Add Visual Separators

```json
{
  "id": "divider-1",
  "component_type": "divider",
  "order": 3,
  "config": {},
  "style_config": {
    "backgroundColor": "#e0e0e0",
    "margin": "2rem 0"
  }
}
```

### 3. Alternate Background Colors

```json
// Section 1 - White background
{"style_config": {"backgroundColor": "#ffffff"}}

// Section 2 - Light gray background
{"style_config": {"backgroundColor": "#f8f9fa"}}

// Section 3 - White background again
{"style_config": {"backgroundColor": "#ffffff"}}
```

### 4. Mobile-First Responsive Design

The property grid automatically adjusts:
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: As configured (3-4 columns)

### 5. SEO-Friendly Configuration

```json
{
  "name": "Home Page",
  "page_type": "home",
  "meta_title": "Luxury Real Estate | Your Company Name",
  "meta_description": "Find your dream home with our exclusive property listings",
  "meta_keywords": "real estate, properties, homes for sale",
  "layout_config": {
    "sections": [...]
  }
}
```

## Troubleshooting

### Section not appearing?
- Check `order` values are unique and sequential
- Verify component_type matches available types
- Check console for errors

### Styling not applying?
- Ensure CSS values are valid (e.g., "#667eea", "2rem")
- Check for typos in property names
- Use browser dev tools to inspect styles

### API returning 404?
- Verify `company_id` exists
- Check `page_type` is valid
- Ensure layout has `is_active = true`

## Next Steps

1. ✅ Review the full documentation: `WEBSITE_MODULARIZATION_GUIDE.md`
2. ✅ Check out existing section components in `frontend/src/app/components/sections/`
3. ✅ Try creating a test layout via API
4. ✅ Experiment with different configurations
5. ✅ Build your custom sections

## Resources

- [Angular Documentation](https://angular.dev)
- [Component Library Service](frontend/src/app/services/component-library.service.ts)
- [Website Customization Service](frontend/src/app/services/website-customization.service.ts)
- [Migration SQL](migration-website-customization.sql)

---

**Need Help?** Check the main documentation or review the example code in the repository.
