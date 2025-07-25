import { Component } from '@angular/core';
import { NavbarComponent } from "../../components/navbar/navbar.component";
import { OperacionesTableComponent } from './operaciones-table/operaciones-table.component';

@Component({
  selector: 'app-operaciones',
  imports: [NavbarComponent, OperacionesTableComponent],
  templateUrl: './operaciones.component.html',
  styleUrl: './operaciones.component.css'
})
export class OperacionesComponent {
  constructor() { }
}