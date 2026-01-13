import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-section',
  standalone: true,
  imports: [CommonModule],
  template: '<div [ngStyle]="styleConfig"><p>Component: team-section</p></div>',
  styles: []
})
export class TeamSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
}
