import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-gallery-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: image-gallery-section</p></div>',
  styles: []
})
export class ImageGallerySectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
