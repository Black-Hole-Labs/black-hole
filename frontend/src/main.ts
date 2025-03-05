import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Обеспечивает маршрутизацию
    provideHttpClient(), // Обеспечивает HTTP-клиент для работы с API
    importProvidersFrom(BrowserAnimationsModule), // Если используются анимации
  ],
}).catch((err) => console.error(err));
