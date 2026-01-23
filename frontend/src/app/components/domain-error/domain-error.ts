import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-domain-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './domain-error.html',
  styleUrls: ['./domain-error.css']
})
export class DomainErrorComponent {
  @Input() errorMessage: string = '';

  retry(): void {
    window.location.reload();
  }
}
