import { Component, Renderer2, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TokenChangePopupComponent } from '../../components/popup/token-change/token-change.component';
import { TokenChangeBuyComponent } from '../../components/popup/token-change-buy/token-change-buy.component';
import { SettingsComponent } from '../../components/popup/settings/settings.component'; // Импортируем SettingsComponent
import { WalletService } from '../../services/wallet.service';
import { ConnectWalletComponent } from '../../components/popup/connect-wallet/connect-wallet.component';
import { PopupService } from '../../services/popup.service';

@Component({
  selector: 'app-trade',
  standalone: true,
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss'],
  imports: [
    FormsModule,
    CommonModule,
    TokenChangePopupComponent,
    TokenChangeBuyComponent,
    SettingsComponent, // Добавляем SettingsComponent в imports
    ConnectWalletComponent,
  ],
})
export class TradeComponent {
  sellAmount: string = ''; // Значение, которое пользователь вводит в поле продажи
  buyAmount: string = ''; // Значение для поля покупки, рассчитывается автоматически
  price: number = 0.5637; // Цена обмена
  priceUsd: number = 921244; // Текущая стоимость в USD за единицу
  sellPriceUsd: string = ''; // Значение для отображения стоимости продажи в USD
  balance: number = 0.1465; // Баланс пользователя для продажи
  rotationCount: number = 0; // Счетчик для отслеживания вращений
	slippage: string = 'Auto'; // Значение для отображения Slippage

  // Управление попапами
  showTokenPopup = false; // Управляет отображением попапа для sell
  showTokenBuyPopup = false; // Управляет отображением попапа для buy
  selectedToken = 'ETH'; // Текущий выбранный токен для sell
  selectedBuyToken = 'USDT'; // Текущий выбранный токен для buy
  selectedTokenImage = '/img/trade/eth.png'; // Изображение для sell
  selectedBuyTokenImage = '/img/trade/usdt.png'; // Изображение для buy

  showConnectWalletPopup: boolean = false;

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private walletService: WalletService,
    public popupService: PopupService
  ) {}

  processInput(event: Event, isSellInput: boolean): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Проверка на корректность ввода
    if (value === '' || isNaN(Number(value))) {
      if (isSellInput) {
        this.sellAmount = '';
        this.buyAmount = '';
      } else {
        this.buyAmount = '';
        this.sellAmount = '';
      }
      this.sellPriceUsd = '';
      return;
    }

    if (isSellInput) {
      // Конвертация из sell в buy
      this.sellAmount = value;
      this.buyAmount = (Number(value) * this.price).toString();
    } else {
      // Конвертация из buy в sell
      this.buyAmount = value;
      this.sellAmount = (Number(value) / this.price).toString();
    }

    this.updateSellPriceUsd();
  }

  updateBuyAmount(): void {
    if (this.sellAmount) {
      const sellValue = parseFloat(this.sellAmount);
      if (!isNaN(sellValue)) {
        this.buyAmount = (sellValue * this.price).toFixed(4);
      } else {
        this.buyAmount = '';
      }
    } else {
      this.buyAmount = '';
    }
  }

  updateSellPriceUsd(): void {
    if (this.sellAmount) {
      const sellValue = parseFloat(this.sellAmount);
      if (!isNaN(sellValue)) {
        this.sellPriceUsd = `$${(sellValue * this.priceUsd).toFixed(2)}`;
      } else {
        this.sellPriceUsd = '';
      }
    } else {
      this.sellPriceUsd = '';
    }
  }

  setMaxSellAmount(): void {
    this.sellAmount = this.balance.toString();
    this.updateBuyAmount();
    this.updateSellPriceUsd();
  }

  rotateRefresh(): void {
    const refreshElement = document.querySelector('.refresh');
    if (refreshElement) {
      this.rotationCount += 1;
      this.renderer.setStyle(refreshElement, 'transform', `rotate(${this.rotationCount * -720}deg)`);
    }
  }

  // Управление анимацией
  onMouseDown(): void {
		console.log('Mouse down triggered');
		const changeButton = document.getElementById('change-button');
		if (changeButton && !changeButton.classList.contains('animate')) {
			this.renderer.addClass(changeButton, 'animate');
		}
	}
	
	onAnimationEnd(): void {
		console.log('Animation ended, swapping tokens...');
		const changeButton = document.getElementById('change-button');
		if (changeButton && changeButton.classList.contains('animate')) {
			this.renderer.removeClass(changeButton, 'animate');
			this.swapTokens();
		}
	}
	
	swapTokens(): void {
		console.log('Swapping tokens...');
		console.log('Before swap:', this.selectedToken, this.selectedBuyToken);
	
		// Меняем местами токены и изображения
		const tempToken = this.selectedToken;
		const tempTokenImage = this.selectedTokenImage;
		this.selectedToken = this.selectedBuyToken;
		this.selectedTokenImage = this.selectedBuyTokenImage;
		this.selectedBuyToken = tempToken;
		this.selectedBuyTokenImage = tempTokenImage;
	
		// Меняем местами значения sell и buy
		const tempAmount = this.sellAmount;
		this.sellAmount = this.buyAmount;
		this.buyAmount = tempAmount;
	
		console.log('After swap:', this.selectedToken, this.selectedBuyToken);
	}
	
	

  // Методы управления попапом для sell
  openTokenPopup(): void {
    this.showTokenPopup = true;
  }

  closeTokenPopup(): void {
    this.showTokenPopup = false;
  }

  onTokenSelected(token: { symbol: string; imageUrl: string }): void {
    this.selectedToken = token.symbol;
    this.selectedTokenImage = token.imageUrl;
    this.closeTokenPopup();
  }

  // Методы управления попапом для buy
  openTokenBuyPopup(): void {
    this.showTokenBuyPopup = true;
  }

  closeTokenBuyPopup(): void {
    this.showTokenBuyPopup = false;
  }

  onBuyTokenSelected(token: { symbol: string; imageUrl: string }): void {
    this.selectedBuyToken = token.symbol;
    this.selectedBuyTokenImage = token.imageUrl;
    this.closeTokenBuyPopup();
  }

	// Settings popup
	get showSettingsPopup(): boolean {
    return this.popupService.getCurrentPopup() === 'settings';
  }

  toggleSettingsPopup(): void {
    if (this.showSettingsPopup) {
      this.popupService.closePopup('settings');
    } else {
      this.popupService.openPopup('settings');
    }
  }

	onSlippageSave(value: string): void {
		this.slippage = value;
  }

  isSwapButtonActive(): boolean {
    return !!(this.sellAmount && Number(this.sellAmount) > 0);
  }

  swap(): void {
    // Здесь будет логика для свапа
    console.log('Swap initiated with amount:', this.sellAmount);
    // Можно добавить дополнительную логику свапа позже
  }

  isWalletConnected(): boolean {
    return this.walletService.isConnected();
  }

  openConnectWalletPopup(): void {
    this.showConnectWalletPopup = true;
  }

  closeConnectWalletPopup(): void {
    this.showConnectWalletPopup = false;
  }
}
