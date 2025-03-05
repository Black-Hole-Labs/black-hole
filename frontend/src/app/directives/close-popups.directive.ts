import { Directive, HostListener } from '@angular/core';
import { PopupService } from '../services/popup.service';

@Directive({
  selector: '[appClosePopups]',
  standalone: true
})
export class ClosePopupsDirective {
  constructor(private popupService: PopupService) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    console.log('Click detected by directive');

    // Проверяем, есть ли открытый попап
    const currentPopup = this.popupService.getCurrentPopup();
    console.log('Current popup:', currentPopup);

    // Если нет открытого попапа, не нужно ничего делать
    if (currentPopup === 'none') {
      return;
    }

    const isPopupClick = target.closest('.popup-overlay, .popup-menu, .connect-wallet, .settings-popup, .wallet-popup, .network-popup');
    const isToggleClick = target.closest('.settings, .wallet, .network, button[class*="open"], button[class*="closed"], h3, .menu');

    console.log('isPopupClick:', isPopupClick);
    console.log('isToggleClick:', isToggleClick);

    if (!isPopupClick && !isToggleClick) {
      console.log('Closing all popups');
      this.popupService.closeAllPopups();
    }
  }
}
