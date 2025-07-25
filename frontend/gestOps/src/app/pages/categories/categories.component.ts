import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';

import { ConceptosTableComponent } from "./conceptos/conceptos-table/conceptos-table.component";
import { CategoriasTableComponent } from './categorias/categorias-table/categorias-table.component';
import { SubcategoriasTableComponent } from './subcategorias/subcategorias-table/subcategorias-table.component';

@Component({
  selector: 'app-categories',
  imports: [
    NavbarComponent,
    ConceptosTableComponent, CategoriasTableComponent, SubcategoriasTableComponent
],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent {

}
