import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: video-section</p></div>',
  styles: []
})
export class VideoSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
