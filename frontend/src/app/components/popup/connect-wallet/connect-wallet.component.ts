import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PopupService } from '../../../services/popup.service';
import { WalletService } from '../../../services/wallet.service';

@Component({
  selector: 'app-connect-wallet',
  standalone: true,
  imports: [
		CommonModule, 
		RouterModule
	],
  templateUrl: './connect-wallet.component.html',
  styleUrl: './connect-wallet.component.scss'
})
export class ConnectWalletComponent {
  @Output() close = new EventEmitter<void>();
  @Output() openWallet = new EventEmitter<void>();

  constructor(
    private walletService: WalletService,
    private popupService: PopupService
  ) {}

  closePopup(): void {
    this.popupService.closePopup('connectWallet');
    this.close.emit();
  }

  onWalletClick(): void {
    this.walletService.connect('lunar.eth');
    this.popupService.openPopup('wallet');
    this.openWallet.emit();
  }
}
