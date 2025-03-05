import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BlackholeMenuComponent } from '../../popup/blackhole-menu/blackhole-menu.component';

@Component({
  selector: 'app-documentation-header',
  standalone: true,
  imports: [RouterModule, CommonModule, BlackholeMenuComponent],
  templateUrl: './documentation-header.component.html',
  styleUrls: ['./documentation-header.component.scss'],
})
export class DocumentationHeaderComponent {
  @Input() isPopupVisible: boolean = false;

  @Output() toggleMenu = new EventEmitter<void>();

  togglePopup() {
    this.isPopupVisible = !this.isPopupVisible; // Переключение состояния
  }
}