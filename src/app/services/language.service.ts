import {
  Injectable,
  inject,
  signal
} from '@angular/core';

import {
  DOCUMENT
} from '@angular/common';

import {
  TranslateService
} from '@ngx-translate/core';

import {
  HttpClient
} from '@angular/common/http';

type LanguageCode = 'en' | 'hi';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly translate =
    inject(TranslateService);

  private readonly http =
    inject(HttpClient);

  private readonly document =
    inject(DOCUMENT);

  private readonly storageKey =
    'language';

  private readonly languageApiUrl =
    'http://localhost:5000/api/auth/language';

  readonly supportedLanguages = [
    {
      code: 'en' as LanguageCode,
      label: 'English'
    },
    {
      code: 'hi' as LanguageCode,
      label: 'हिंदी'
    }
  ];

  currentLanguage =
    signal<LanguageCode>('en');

  private googleScriptPromise?: Promise<void>;

  private googleSelect?: HTMLSelectElement;

  private googleInitialized = false;

  constructor() {
    this.loadSavedLanguage();
  }

  /**
   * Browser refresh ke baad saved language read karega.
   *
   * Is stage par Google script load nahi kar rahe,
   * kyunki app ka DOM abhi ready nahi hua hota.
   */
  private loadSavedLanguage(): void {
    const savedLanguage =
      localStorage.getItem(this.storageKey);

    const language =
      this.normalizeLanguage(savedLanguage) || 'en';

    this.currentLanguage.set(language);

    this.document.documentElement.lang =
      language;

    this.document.documentElement.dir =
      'ltr';
  }

  /**
   * Language change method.
   *
   * ngx-translate JSON wali strings translate karega.
   * Google Website Translator hardcoded text translate karega.
   */
  setLanguage(
    language: LanguageCode,
    saveToBackend = true
  ): void {
    const selectedLanguage =
      this.normalizeLanguage(language) || 'en';

    /*
     * Existing en.json / hi.json ke text ke liye
     */
    this.translate
      .use(selectedLanguage)
      .subscribe({
        next: () => {
          this.currentLanguage.set(
            selectedLanguage
          );

          localStorage.setItem(
            this.storageKey,
            selectedLanguage
          );

          this.document.documentElement.lang =
            selectedLanguage;

          this.document.documentElement.dir =
            'ltr';

          /*
           * Google widget ready hai to hardcoded
           * page text bhi translate hoga.
           */
          if (this.googleInitialized) {
            this.applyGoogleLanguage(
              selectedLanguage
            ).catch(error => {
              console.error(
                'Google language apply failed:',
                error
              );
            });
          }

          if (saveToBackend) {
            this.saveLanguageToBackend(
              selectedLanguage
            );
          }
        },

        error: error => {
          console.error(
            'JSON translation file load failed:',
            error
          );

          /*
           * Hindi file unavailable ho to English fallback
           */
          if (selectedLanguage !== 'en') {
            this.setLanguage('en', false);
          }
        }
      });
  }

  /**
   * App ka DOM load hone ke baad
   * Google Translator initialize karega.
   *
   * Is method ko next step me app.ts se call karenge.
   */
  async initializeGoogleTranslate(): Promise<void> {
    try {
      await this.loadGoogleScript();

      this.googleSelect =
        await this.waitForGoogleLanguageSelect();

      this.googleInitialized = true;

      /*
       * Saved language ko initial page par apply karega.
       */
      this.setLanguage(
        this.currentLanguage(),
        false
      );
    } catch (error) {
      console.error(
        'Google Translator initialization failed:',
        error
      );
    }
  }

  /**
   * Google Translator script dynamically load karega.
   */
  private loadGoogleScript(): Promise<void> {
    if (this.googleScriptPromise) {
      return this.googleScriptPromise;
    }

    const windowObject =
      window as any;

    /*
     * Agar script pehle se loaded hai
     */
    if (
      windowObject.google?.translate
        ?.TranslateElement
    ) {
      this.googleScriptPromise =
        this.createGoogleWidget();

      return this.googleScriptPromise;
    }

    this.googleScriptPromise =
      new Promise<void>((resolve, reject) => {
        windowObject.googleTranslateElementInit =
          () => {
            this.createGoogleWidget()
              .then(() => resolve())
              .catch(error => reject(error));
          };

        const existingScript =
          this.document.querySelector(
            'script[data-tedbus-google-translate]'
          );

        if (existingScript) {
          return;
        }

        const script =
          this.document.createElement('script');

        script.src =
          'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

        script.async = true;

        script.setAttribute(
          'data-tedbus-google-translate',
          'true'
        );

        script.onerror = () => {
          reject(
            new Error(
              'Google Translator script load failed'
            )
          );
        };

        this.document.head.appendChild(script);
      });

    return this.googleScriptPromise;
  }

  /**
   * Google widget ko hidden container me create karega.
   */
  private createGoogleWidget(): Promise<void> {
    return new Promise<void>(
      (resolve, reject) => {
        const windowObject =
          window as any;

        const container =
          this.document.getElementById(
            'google_translate_element'
          );

        if (!container) {
          reject(
            new Error(
              'google_translate_element not found'
            )
          );

          return;
        }

        try {
          new windowObject.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,hi',
              autoDisplay: false,
              multilanguagePage: true
            },
            'google_translate_element'
          );

          resolve();
        } catch (error) {
          reject(error);
        }
      }
    );
  }

  /**
   * Google ka original hidden select create hone tak wait karega.
   */
  private waitForGoogleLanguageSelect(
    timeout = 10000
  ): Promise<HTMLSelectElement> {
    return new Promise(
      (resolve, reject) => {
        const startedAt =
          Date.now();

        const timer =
          window.setInterval(() => {
            const select =
              this.document.querySelector(
                'select.goog-te-combo'
              ) as HTMLSelectElement | null;

            const hasLanguageOptions =
              !!select &&
              Array.from(select.options)
                .some(
                  option =>
                    option.value === 'en'
                ) &&
              Array.from(select.options)
                .some(
                  option =>
                    option.value === 'hi'
                );

            if (
              select &&
              hasLanguageOptions
            ) {
              window.clearInterval(timer);
              resolve(select);
              return;
            }

            if (
              Date.now() - startedAt >
              timeout
            ) {
              window.clearInterval(timer);

              reject(
                new Error(
                  'Google language selector not found'
                )
              );
            }
          }, 100);
        }
      );
  }

  /**
   * Google widget ke hidden select ko change karega.
   */
  private async applyGoogleLanguage(
    language: LanguageCode
  ): Promise<void> {
    const select =
      this.googleSelect ||
      await this.waitForGoogleLanguageSelect();

    this.googleSelect = select;

    this.setGoogleLanguageCookie(language);

    select.value = language;

    select.dispatchEvent(
      new Event('change', {
        bubbles: true
      })
    );
  }

  /**
   * Language ko Google cookie me save karega.
   */
  private setGoogleLanguageCookie(
    language: LanguageCode
  ): void {
    if (language === 'en') {
      this.document.cookie =
        'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      return;
    }

    const expiry =
      new Date();

    expiry.setFullYear(
      expiry.getFullYear() + 1
    );

    this.document.cookie =
      `googtrans=/en/${language}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
  }

  /**
   * Login user ki MongoDB wali language apply karne ke liye.
   */
  applyServerLanguage(
    language: string | null | undefined
  ): void {
    const selectedLanguage =
      this.normalizeLanguage(language) || 'en';

    this.setLanguage(
      selectedLanguage,
      false
    );
  }

  /**
   * Backend me selected language save karega.
   */
  private saveLanguageToBackend(
    language: LanguageCode
  ): void {
    const token =
      localStorage.getItem('token');

    /*
     * Guest user ke liye sirf localStorage use hoga.
     */
    if (!token) {
      return;
    }

    this.http
      .put(
        this.languageApiUrl,
        {
          language
        }
      )
      .subscribe({
        next: () => {
          console.log(
            'Language preference saved:',
            language
          );
        },

        error: error => {
          console.error(
            'Failed to save language preference:',
            error
          );
        }
      });
  }

  getLanguage(): LanguageCode {
    return this.currentLanguage();
  }

  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage();
  }

  private normalizeLanguage(
    language: string | null | undefined
  ): LanguageCode | null {
    if (
      language !== 'en' &&
      language !== 'hi'
    ) {
      return null;
    }

    return language;
  }
}