import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyGridSectionComponent } from '../../components/sections/property-grid-section/property-grid-section';

@Component({
  selector: 'crm-property-grid',
  standalone: true,
  imports: [CommonModule, PropertyGridSectionComponent],
  template: `
    <app-property-grid-section
      [config]="config"
      [styleConfig]="style"
      [companyId]="companyId"
      [componentId]="componentId"
    ></app-property-grid-section>
  `
})
export class PropertyGridPublicComponent {
  @Input() config: any = {};
  @Input() style: any = {};
  @Input() companyId: string | null = null;
  @Input() componentId: string | null = null;
}
