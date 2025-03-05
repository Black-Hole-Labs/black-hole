import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { PopupService } from './services/popup.service';
import { ClosePopupsDirective } from './directives/close-popups.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  hostDirectives: [ClosePopupsDirective]
})
export class AppComponent {
  constructor(private popupService: PopupService) {}
}
