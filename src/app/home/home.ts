import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
import { BusService } from '../services/bus';
import { Navbar } from '../components/navbar/navbar';
import { Hero } from '../components/hero/hero';
import { SearchCard } from '../components/search-card/search-card';
import { Offers } from '../components/offers/offers';
import { Features } from '../components/features/features';
import { Footer } from '../components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    Hero,
    SearchCard,
    Offers,
    Features,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  buses: any[] = [];

  constructor(private busService: BusService) {}

  ngOnInit(): void {
    this.busService.getAllBuses(); 
  }
}