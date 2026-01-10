import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { WebsiteCustomizationService } from '../../services/website-customization.service';
import { ComponentLibraryService } from '../../services/component-library.service';
import { WebsiteLayout, LayoutSection, PageType } from '../../models/website-layout.model';
import { ComponentLibraryItem, ComponentType } from '../../models/website-component.model';

@Component({
  selector: 'app-website-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './website-builder.html',
  styleUrls: ['./website-builder.css']
})
export class WebsiteBuilderComponent implements OnInit {
  layouts: WebsiteLayout[] = [];
  currentLayout: WebsiteLayout | null = null;
  componentLibrary: ComponentLibraryItem[] = [];
  selectedSection: LayoutSection | null = null;
  
  newLayoutName = '';
  newLayoutPageType: PageType = 'home';
  showNewLayoutForm = false;

  companyId = 'demo-company-id'; // In real app, get from auth service

  constructor(
    private websiteService: WebsiteCustomizationService,
    private componentLibraryService: ComponentLibraryService
  ) {}

  ngOnInit() {
    this.componentLibrary = this.componentLibraryService.getComponentLibrary();
    this.loadLayouts();
  }

  loadLayouts() {
    this.websiteService.getLayouts(this.companyId).subscribe({
      next: (layouts) => {
        this.layouts = layouts;
        if (layouts.length > 0 && !this.currentLayout) {
          this.currentLayout = layouts[0];
        }
      },
      error: (err) => console.error('Error loading layouts:', err)
    });
  }

  createLayout() {
    if (!this.newLayoutName) return;

    const sections = this.websiteService.getDefaultTemplate(this.newLayoutPageType);
    
    const newLayout: Partial<WebsiteLayout> = {
      company_id: this.companyId,
      name: this.newLayoutName,
      page_type: this.newLayoutPageType,
      is_active: false,
      is_default: false,
      layout_config: { sections }
    };

    this.websiteService.createLayout(newLayout).subscribe({
      next: (layout) => {
        this.layouts.push(layout);
        this.currentLayout = layout;
        this.newLayoutName = '';
        this.showNewLayoutForm = false;
      },
      error: (err) => console.error('Error creating layout:', err)
    });
  }

  selectLayout(layout: WebsiteLayout) {
    this.currentLayout = layout;
    this.selectedSection = null;
  }

  addComponent(componentType: ComponentType) {
    if (!this.currentLayout) return;

    const component = this.componentLibraryService.getComponentByType(componentType);
    if (!component) return;

    const newSection: LayoutSection = {
      id: this.generateId(),
      component_type: componentType,
      config: { ...component.defaultConfig },
      style_config: { ...component.defaultStyleConfig },
      order: this.currentLayout.layout_config.sections.length
    };

    this.currentLayout.layout_config.sections.push(newSection);
    this.saveLayout();
  }

  selectSection(section: LayoutSection) {
    this.selectedSection = section;
  }

  deleteSection(section: LayoutSection) {
    if (!this.currentLayout) return;

    const index = this.currentLayout.layout_config.sections.findIndex(s => s.id === section.id);
    if (index > -1) {
      this.currentLayout.layout_config.sections.splice(index, 1);
      this.saveLayout();
    }

    if (this.selectedSection?.id === section.id) {
      this.selectedSection = null;
    }
  }

  onDrop(event: CdkDragDrop<LayoutSection[]>) {
    if (!this.currentLayout) return;

    moveItemInArray(
      this.currentLayout.layout_config.sections,
      event.previousIndex,
      event.currentIndex
    );

    // Update order values
    this.currentLayout.layout_config.sections.forEach((section, index) => {
      section.order = index;
    });

    this.saveLayout();
  }

  saveLayout() {
    if (!this.currentLayout) return;

    this.websiteService.updateLayout(this.currentLayout.id, this.currentLayout).subscribe({
      next: (layout) => {
        this.currentLayout = layout;
        console.log('Layout saved successfully');
      },
      error: (err) => console.error('Error saving layout:', err)
    });
  }

  publishLayout() {
    if (!this.currentLayout) return;

    this.websiteService.publishLayout(this.currentLayout.id).subscribe({
      next: (layout) => {
        this.currentLayout = layout;
        alert('Layout publicado com sucesso!');
      },
      error: (err) => console.error('Error publishing layout:', err)
    });
  }

  deleteLayout() {
    if (!this.currentLayout) return;

    if (confirm('Tem certeza que deseja excluir este layout?')) {
      this.websiteService.deleteLayout(this.currentLayout.id).subscribe({
        next: () => {
          this.layouts = this.layouts.filter(l => l.id !== this.currentLayout!.id);
          this.currentLayout = this.layouts.length > 0 ? this.layouts[0] : null;
        },
        error: (err) => console.error('Error deleting layout:', err)
      });
    }
  }

  private generateId(): string {
    return `section-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }
}
