# Website Modularization System - Implementation Guide

## Overview

The CRM Imobil website has been modularized to support dynamic, configurable page layouts using a component-based architecture. This allows administrators to customize their website through drag-and-drop builders and template configurations stored in the database.

## Architecture

### Database Schema

Three main tables support the modular system:

1. **`website_layouts`** - Stores complete page configurations
   - `page_type`: home, properties, property-detail, about, contact, custom
   - `layout_config`: JSONB containing array of sections
   - `is_active`: Determines if this layout is currently published
   
2. **`website_components`** - Reusable component library
   - `component_type`: Type of component (hero, property-grid, etc.)
   - `config`: Component-specific configuration
   - `style_config`: CSS styling options

3. **`custom_domains`** - Custom domain management for multi-tenant websites

### Frontend Architecture

#### Component Structure

```
frontend/src/app/
├── components/
│   ├── dynamic-section/         # Dynamic component renderer
│   │   └── dynamic-section.ts
│   └── sections/                # Individual section implementations
│       ├── hero-section/
│       ├── property-grid-section/
│       ├── search-bar-section/
│       ├── lifestyle-section/
│       ├── stats-section/
│       ├── text-block-section/
│       └── ... (15+ section types)
├── pages/
│   └── modular-home/            # Example modular page
└── services/
    ├── website-customization.service.ts
    └── component-library.service.ts
```

#### Available Section Types

| Type | Description | Status |
|------|-------------|--------|
| `hero` | Hero banner with title, subtitle, and search | ✅ Complete |
| `property-grid` | Grid/carousel of property cards | ✅ Complete |
| `search-bar` | Property search input | ✅ Complete |
| `lifestyle-section` | Feature cards for lifestyle categories | ✅ Complete |
| `stats-section` | Numeric statistics display | ✅ Complete |
| `text-block` | Free-form text content | ✅ Complete |
| `contact-form` | Contact form | 🔄 Stub |
| `testimonials` | Client testimonials | 🔄 Stub |
| `team-section` | Team member profiles | 🔄 Stub |
| `about-section` | About company section | 🔄 Stub |
| `map-section` | Location map | 🔄 Stub |
| `image-gallery` | Image gallery grid | 🔄 Stub |
| `video-section` | Embedded video | 🔄 Stub |
| `cta-button` | Call-to-action button | 🔄 Stub |
| `divider` | Visual divider line | ✅ Complete |
| `spacer` | Vertical spacing | ✅ Complete |

### Backend Architecture

```
src/
├── application/services/
│   └── WebsiteService.js          # Business logic for layouts
├── infrastructure/repositories/
│   └── SupabaseWebsiteRepository.js  # Data access layer
└── presentation/routes/
    └── websiteRoutes.js           # API endpoints
```

## API Endpoints

### Layouts

```
GET    /api/website/layouts?company_id={id}&page_type={type}
GET    /api/website/layouts/:id
GET    /api/website/layouts/active?company_id={id}&page_type={type}
POST   /api/website/layouts                    (requires auth)
PUT    /api/website/layouts/:id                (requires auth)
DELETE /api/website/layouts/:id                (requires auth)
POST   /api/website/layouts/:id/publish        (requires auth)
```

## Usage Examples

### 1. Creating a Custom Home Page Layout

```typescript
const layout = {
  company_id: 'company-uuid',
  name: 'Custom Home Layout',
  page_type: 'home',
  is_active: true,
  layout_config: {
    sections: [
      {
        id: 'hero-1',
        component_type: 'hero',
        order: 0,
        config: {
          title: 'Encontre seu imóvel ideal',
          subtitle: 'As melhores opções do mercado',
          showSearchBox: true,
          quickLinks: [
            { text: 'Com Quintal', tag: 'garden' },
            { text: 'Vista Panorâmica', tag: 'view' }
          ]
        },
        style_config: {
          backgroundColor: '#667eea',
          textColor: '#ffffff',
          padding: '4rem 2rem'
        }
      },
      {
        id: 'lifestyle-1',
        component_type: 'lifestyle-section',
        order: 1,
        config: {
          title: 'Encontre seu estilo',
          items: [
            {
              icon: 'fas fa-laptop-house',
              title: 'Home Office',
              description: 'Espaço para trabalhar',
              style: 'home-office'
            }
            // ... more items
          ]
        },
        style_config: {
          backgroundColor: '#f8f9fa',
          padding: '3rem 0'
        }
      },
      {
        id: 'properties-1',
        component_type: 'property-grid',
        order: 2,
        config: {
          title: 'Imóveis em Destaque',
          limit: 6,
          columns: 3,
          showFeatured: true,
          showCarousel: true
        },
        style_config: {}
      }
    ]
  }
};
```

### 2. Using the Modular Home Component

```typescript
import { ModularHomeComponent } from './pages/modular-home/modular-home';

// In routes configuration
{
  path: 'home-custom',
  component: ModularHomeComponent
}
```

The component automatically:
1. Fetches the active layout from the API
2. Renders sections in order
3. Falls back to default template if API fails

### 3. Creating a New Section Component

```typescript
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section [ngStyle]="styleConfig">
      <div class="container">
        <h2>{{ title }}</h2>
        <p>{{ content }}</p>
      </div>
    </section>
  `,
  styles: [`
    section { padding: 2rem 0; }
  `]
})
export class MySectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  
  get title(): string {
    return this.config.title || 'Default Title';
  }
  
  get content(): string {
    return this.config.content || '';
  }
}
```

Then register it in:
1. `website-component.model.ts` - Add to `ComponentType` union
2. `dynamic-section.ts` - Add to `componentMap`
3. `component-library.service.ts` - Add to library with defaults

## Configuration Options

### Common Config Properties

All sections support these config properties:

```typescript
{
  title?: string;           // Section title
  subtitle?: string;        // Section subtitle
  alignment?: 'left' | 'center' | 'right';
}
```

### Common Style Properties

All sections support these style properties:

```typescript
{
  backgroundColor?: string;  // CSS color
  textColor?: string;       // CSS color
  padding?: string;         // CSS padding value
  margin?: string;          // CSS margin value
  borderRadius?: string;    // CSS border radius
}
```

### Hero Section Config

```typescript
{
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
  showSearchBox?: boolean;
  quickLinks?: Array<{
    text: string;
    tag: string;
  }>;
  alignment?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large';
}
```

### Property Grid Config

```typescript
{
  title?: string;
  limit?: number;           // Number of properties to show
  columns?: number;         // Grid columns (1-4)
  showFeatured?: boolean;   // Only show featured properties
  showViewAll?: boolean;    // Show "View All" link
  showCarousel?: boolean;   // Use carousel instead of grid
}
```

### Lifestyle Section Config

```typescript
{
  title?: string;
  items: Array<{
    icon: string;           // Font Awesome class
    title: string;
    description: string;
    style: string;          // Query parameter for filtering
  }>;
}
```

## Migration and Initial Data

The `migration-website-customization.sql` file includes:

1. Table creation for layouts, components, and domains
2. Indexes for performance
3. Triggers for `updated_at` timestamps
4. Sample default home layout for existing companies

To apply the migration:

```bash
# Using Supabase CLI
supabase db push

# Or via SQL editor in Supabase dashboard
# Copy and paste the migration file contents
```

## Development Workflow

### Adding a New Section Type

1. **Create the component**:
   ```bash
   mkdir -p frontend/src/app/components/sections/my-section
   touch frontend/src/app/components/sections/my-section/my-section.ts
   ```

2. **Implement the component** (see example above)

3. **Register in type system**:
   - Add to `ComponentType` in `website-component.model.ts`

4. **Register in dynamic renderer**:
   - Import in `dynamic-section.ts`
   - Add to `componentMap`

5. **Add to component library**:
   - Add entry in `component-library.service.ts` with defaults

6. **Update database schema** (if needed):
   - Add to CHECK constraint in `website_components` table

### Testing a Custom Layout

1. Create a layout via API or SQL
2. Set `is_active = true`
3. Navigate to `/home-custom` or modify route to use `ModularHomeComponent`
4. Verify sections render correctly

## Best Practices

### Performance

- Use `showCarousel: false` for static grids (better SEO)
- Limit property grid to 6-12 items on home page
- Optimize images in hero backgrounds
- Use lazy loading for below-the-fold sections

### Styling

- Maintain consistent padding (2-4rem)
- Use theme colors from design system
- Test responsive behavior on mobile
- Ensure text has sufficient contrast

### Configuration

- Provide sensible defaults in component getters
- Validate required config properties
- Handle missing/null values gracefully
- Use TypeScript interfaces for type safety

## Migration Path

### Current → Modular

The existing home page can coexist with the modular system:

1. **Option A: Hybrid Approach**
   - Keep current home page as default
   - Add toggle in admin to enable modular mode
   - Use `ModularHomeComponent` when enabled

2. **Option B: Direct Migration**
   - Convert current home.html sections to layout config
   - Save as default layout in database
   - Replace `HomeComponent` with `ModularHomeComponent`

3. **Option C: Parallel Deployment**
   - Deploy modular system alongside existing
   - Gradually migrate pages one by one
   - A/B test performance and user engagement

## Future Enhancements

- [ ] Drag-and-drop visual builder (using Angular CDK)
- [ ] Component preview in builder
- [ ] Template marketplace
- [ ] Version history and rollback
- [ ] A/B testing framework
- [ ] Analytics integration per section
- [ ] Multi-language support per section
- [ ] Conditional sections (show based on user segment)

## Troubleshooting

### Layout not loading

1. Check API endpoint responds: `GET /api/website/layouts/active?company_id=X&page_type=home`
2. Verify database has rows in `website_layouts` table
3. Check browser console for errors
4. Ensure `is_active = true` for the layout

### Section not rendering

1. Verify component type is registered in `componentMap`
2. Check component import path is correct
3. Ensure config/styleConfig are passed correctly
4. Look for TypeScript compilation errors

### Styling issues

1. Check `styleConfig` values are valid CSS
2. Verify container classes exist in global styles
3. Test in browser dev tools with inline styles
4. Check for CSS specificity conflicts

## Support

For questions or issues:
- Review this guide
- Check the code comments in section components
- Test with default templates from `website-customization.service.ts`
- Consult Angular documentation for component patterns

---

**Last Updated**: 2025-12-31
**Version**: 1.0.0
**Maintainer**: CRM Imobil Team
