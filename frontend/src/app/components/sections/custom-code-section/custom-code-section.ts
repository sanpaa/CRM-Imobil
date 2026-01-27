import { Component, Input, OnInit, ElementRef, ViewChild, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-custom-code-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-code-section.html',
  styleUrls: ['./custom-code-section.css']
})
export class CustomCodeSectionComponent implements OnInit {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  @ViewChild('codeContainer', { static: false }) codeContainer?: ElementRef;

  safeHtml: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.loadCustomCode();
  }

  loadCustomCode(): void {
    const html = this.config.html || '';
    const css = this.config.css || '';
    const js = this.config.js || '';

    // Combinar HTML com CSS inline
    let fullHtml = html;
    if (css) {
      fullHtml = `<style>${css}</style>${fullHtml}`;
    }

    // Sanitizar HTML (permite alguns scripts se enableJs = true)
    if (this.config.enableJs) {
      this.safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, fullHtml) || '';
      
      // Executar JS depois do render
      setTimeout(() => {
        if (js) {
          try {
            const func = new Function(js);
            func();
          } catch (error) {
            console.error('Error executing custom JS:', error);
          }
        }
      }, 100);
    } else {
      this.safeHtml = this.sanitizer.sanitize(SecurityContext.HTML, fullHtml) || '';
    }
  }
}
