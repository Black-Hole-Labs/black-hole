import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PopupType = 'settings' | 'connectWallet' | 'blackholeMenu' | 'wallet' | 'networkPopup' | 'none';

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private activePopupSubject = new BehaviorSubject<PopupType>('none');
  activePopup$ = this.activePopupSubject.asObservable();

  openPopup(popupType: PopupType): void {
    console.log('Opening popup:', popupType);
    this.activePopupSubject.next(popupType);
  }

  closePopup(popupType: PopupType): void {
    console.log('Closing popup:', popupType);
    if (this.activePopupSubject.value === popupType) {
      this.activePopupSubject.next('none');
    }
  }

  closeAllPopups(): void {
    console.log('Closing all popups');
    this.activePopupSubject.next('none');
  }

  getCurrentPopup(): PopupType {
    return this.activePopupSubject.value;
  }
}