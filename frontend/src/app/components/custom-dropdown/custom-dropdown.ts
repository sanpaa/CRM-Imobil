import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './custom-dropdown.html'
})
export class CustomDropdownComponent {
  @Input() label = '';
  @Input() icon?: string;
  @Input() value: any;
  @Input() items: { label: string; value: any; icon?: string }[] = [];

  @Output() valueChange = new EventEmitter<any>();

  open = false;

  constructor(private elementRef: ElementRef) {}

  toggle() {
    this.open = !this.open;
  }

  select(value: any) {
    this.value = value;
    this.valueChange.emit(value);
    this.open = false;
  }

  // 👇 FECHA AO CLICAR FORA
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }
}
