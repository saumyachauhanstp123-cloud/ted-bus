import {
  AfterViewInit,
  Component,
  inject
} from '@angular/core';

import { RouterOutlet } from '@angular/router';

import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { Toast } from './components/toast/toast';
import { ThemeService } from './services/theme.service';
import { LoadingBar } from './components/loading-bar/loading-bar';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    Footer,
    Toast,
    LoadingBar
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  title = 'ted-bus';

  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);

  constructor() {
    this.themeService.initializeTheme();
  }

  /**
   * app.html render hone ke baad Google Translator initialize hoga.
   */
  ngAfterViewInit(): void {
    void this.languageService.initializeGoogleTranslate();
  }
}