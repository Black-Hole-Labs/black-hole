import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-blackhole-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blackhole-menu.component.html',
  styleUrls: ['./blackhole-menu.component.scss']
})
export class BlackholeMenuComponent {
  @Output() close = new EventEmitter<void>();

  constructor(private popupService: PopupService) {}

  closePopup(): void {
    this.popupService.closePopup('blackholeMenu');
    this.close.emit();
  }
}