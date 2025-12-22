// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { PropertyCardComponent } from '../../components/property-card/property-card';
// import { PropertyService } from '../../services/property';
// import { Property } from '../../models/property.model';

// @Component({
//   selector: 'app-home',
//   imports: [CommonModule, RouterModule, PropertyCardComponent],
//   templateUrl: './home.html',
//   styleUrl: './home.css',
// })
// export class HomeComponent implements OnInit {
//   properties: Property[] = [];
//   visibleProperties: Property[] = [];

//   loading = true;
//   error = false;

//   pageSize = 3;
//   currentIndex = 0;
//   isMobile = false;

//   constructor(private propertyService: PropertyService) {}

//   ngOnInit(): void {
//     this.checkIfMobile();
//     this.loadProperties();

//     window.addEventListener('resize', () => {
//       this.checkIfMobile();
//       this.updateVisible();
//     });
//   }

//   checkIfMobile(): void {
//     const wasMobile = this.isMobile;

//     this.isMobile = window.innerWidth < 768;
//     this.pageSize = this.isMobile ? 1 : 3;

//     if (wasMobile !== this.isMobile) {
//       this.currentIndex = 0; // evita index quebrado
//     }
//   }

//   loadProperties(): void {
//     this.propertyService.getAllProperties().subscribe({
//       next: (properties) => {
//         this.properties = properties
//           .filter(p => !p.sold)
//           .slice(0, 9);

//         this.updateVisible();
//         this.loading = false;
//       },
//       error: () => {
//         this.error = true;
//         this.loading = false;
//       }
//     });
//   }

//   updateVisible(): void {
//     this.visibleProperties = this.properties.slice(
//       this.currentIndex,
//       this.currentIndex + this.pageSize
//     );
//   }

//   next(): void {
//     if (this.isMobile) {
//       if (this.currentIndex + 1 < this.properties.length) {
//         this.currentIndex++;
//         this.updateVisible();
//       }
//     } else {
//       if (this.currentIndex + this.pageSize < this.properties.length) {
//         this.currentIndex += this.pageSize;
//         this.updateVisible();
//       }
//     }
//   }

//   prev(): void {
//     if (this.isMobile) {
//       if (this.currentIndex > 0) {
//         this.currentIndex--;
//         this.updateVisible();
//       }
//     } else {
//       if (this.currentIndex - this.pageSize >= 0) {
//         this.currentIndex -= this.pageSize;
//         this.updateVisible();
//       }
//     }
//   }

//   get skeletonItems(): number[] {
//     return this.isMobile ? [1] : [1, 2, 3];
//   }

// }


import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Adicionado Router aqui
import { PropertyCardComponent } from '../../components/property-card/property-card';
import { PropertyService } from '../../services/property';
import { Property } from '../../models/property.model';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true, // Se estiver usando Angular moderno
  imports: [CommonModule, RouterModule, PropertyCardComponent, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  properties: Property[] = [];
  visibleProperties: Property[] = [];

  loading = true;
  error = false;
  searchText = '';

  pageSize = 3;
  currentIndex = 0;
  isMobile = false;

  // Adicionado o Router no construtor
  constructor(
    private propertyService: PropertyService,
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.checkIfMobile();
    this.loadProperties();

    window.addEventListener('resize', () => {
      this.checkIfMobile();
      this.updateVisible();
    });
  }

  // Função que resolve o erro do clique nos cards de Lifestyle
  filtrar(categoria: string): void {
    // Navega para a busca passando o estilo como parâmetro na URL
    // Ex: /buscar?estilo=home-office
    this.router.navigate(['/buscar'], { 
      queryParams: { estilo: categoria } 
    });
  }

  checkIfMobile(): void {
    this.isMobile = window.innerWidth < 768;
    this.pageSize = this.isMobile ? 1 : 3;
    
    // Resetar o índice se mudar o tamanho da tela para evitar espaços vazios
    this.currentIndex = 0;
  }

  loadProperties(): void {
    this.propertyService.getAllProperties().subscribe({
      next: (properties) => {
        this.properties = properties
          .filter(p => !p.sold)
          .slice(0, 9);

        this.updateVisible();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  updateVisible(): void {
    this.visibleProperties = this.properties.slice(
      this.currentIndex,
      this.currentIndex + this.pageSize
    );
  }

  next(): void {
    const step = this.isMobile ? 1 : this.pageSize;
    if (this.currentIndex + step < this.properties.length) {
      this.currentIndex += step;
      this.updateVisible();
    }
  }

  prev(): void {
    const step = this.isMobile ? 1 : this.pageSize;
    if (this.currentIndex - step >= 0) {
      this.currentIndex -= step;
      this.updateVisible();
    }
  }

  get skeletonItems(): number[] {
    return this.isMobile ? [1] : Array(this.pageSize).fill(0).map((x, i) => i);
  }

  goToSearch(): void {
    console.log('Buscando por:', this.searchText);
  if (!this.searchText.trim()) return;

  this.router.navigate(['/buscar'], {
    queryParams: {
      search: this.searchText.trim()
    }
  });
}


}