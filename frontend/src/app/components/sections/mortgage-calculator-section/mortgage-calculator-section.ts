import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mortgage-calculator-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mortgage-calculator-section.html',
  styleUrls: ['./mortgage-calculator-section.css']
})
export class MortgageCalculatorSectionComponent {
  @Input() config: any = {};
  @Input() styleConfig: any = {};
  
  propertyValue = 300000;
  downPayment = 60000;
  interestRate = 9.5;
  loanTerm = 30;
  
  monthlyPayment = 0;
  totalAmount = 0;
  totalInterest = 0;

  get title(): string {
    return this.config.title || 'Calculadora de Financiamento';
  }

  get subtitle(): string {
    return this.config.subtitle || 'Simule as parcelas do seu financiamento imobiliário';
  }

  ngOnInit() {
    this.calculate();
  }

  calculate(): void {
    const principal = this.propertyValue - this.downPayment;
    const monthlyRate = this.interestRate / 100 / 12;
    const numberOfPayments = this.loanTerm * 12;
    
    if (monthlyRate === 0) {
      this.monthlyPayment = principal / numberOfPayments;
    } else {
      this.monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                           (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    }
    
    this.totalAmount = this.monthlyPayment * numberOfPayments;
    this.totalInterest = this.totalAmount - principal;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
