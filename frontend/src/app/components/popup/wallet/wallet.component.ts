import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletService } from '../../../services/wallet.service';
import { PopupService } from '../../../services/popup.service';

interface Token {
  name: string;
  balance: string;
  usdBalance: number;
  usdChange: string;
  percentChange: string;
  image: string;
}

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss'
})
export class WalletComponent {
  @Output() close = new EventEmitter<void>();
  @Output() disconnect = new EventEmitter<void>();
  walletName: string = '';
  
  tokens: Token[] = [
    {
      name: 'Ethereum',
      balance: '0.1346 $ETH',
      usdBalance: 450.45,
      usdChange: '-$1.4',
      percentChange: '(-0.34%)',
      image: '/img/trade/eth.png'
    },
    {
      name: 'Arbitrum',
      balance: '20.324 $ARB',
      usdBalance: 1130.12,
      usdChange: '-$20.1',
      percentChange: '(-1.28%)',
      image: '/img/trade/arbitrum.png'
    },
    // ... добавьте остальные токены
  ];

  constructor(private walletService: WalletService, private popupService: PopupService) {
    this.walletName = this.walletService.getWalletName();
  }

  get totalBalance(): number {
    return this.tokens.reduce((sum, token) => sum + token.usdBalance, 0);
  }

  get totalUsdChange(): number {
    return this.tokens.reduce((sum, token) => {
      // Извлекаем число из строки вида '-$1.4'
      const change = parseFloat(token.usdChange.replace('$', ''));
      return sum + change;
    }, 0);
  }

  get averagePercentChange(): number {
    const total = this.tokens.reduce((sum, token) => {
      // Извлекаем число из строки вида '(-0.34%)'
      const percent = parseFloat(token.percentChange.replace('(', '').replace('%)', ''));
      return sum + percent;
    }, 0);
    
    // Вычисляем среднее значение
    return total / this.tokens.length;
  }

  // Форматируем изменение с знаком доллара
  get formattedUsdChange(): string {
    return `$${this.totalUsdChange.toFixed(1)}`;
  }

  // Форматируем процентное изменение
  get formattedPercentChange(): string {
    return `(${this.averagePercentChange.toFixed(2)}%)`;
  }

  closePopup(): void {  // переименовали метод с onClose на closePopup
    this.popupService.closePopup('wallet');
    this.close.emit();
  }

  onDisconnect(): void {
    this.walletService.disconnect();
    this.disconnect.emit();
  }
}
