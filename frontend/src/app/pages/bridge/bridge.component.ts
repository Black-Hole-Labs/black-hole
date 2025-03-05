import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NetworkService } from '../../services/network.service';
import { NetworkChangeFromPopupComponent } from '../../components/popup/network-change-from/network-change-from.component';
import { NetworkChangeToPopupComponent } from '../../components/popup/network-change-to/network-change-to.component';
import { TokenChangePopupComponent } from '../../components/popup/token-change/token-change.component';
import { Subscription } from 'rxjs';
import { BridgeTxComponent } from '../../components/popup/bridge-tx/bridge-tx.component';
import { WalletService } from '../../services/wallet.service';
import { ConnectWalletComponent } from '../../components/popup/connect-wallet/connect-wallet.component';

@Component({
  selector: 'app-bridge',
  standalone: true,
  templateUrl: './bridge.component.html',
  styleUrls: ['./bridge.component.scss'],
  imports: [
    CommonModule, 
    FormsModule,
    NetworkChangeFromPopupComponent,
    NetworkChangeToPopupComponent,
    TokenChangePopupComponent,
    BridgeTxComponent,
    ConnectWalletComponent
  ]
})
export class BridgeComponent implements OnInit, OnDestroy {
  private networkSubscription!: Subscription;
  feesVisible: boolean = false;
  isNetworkChosen: boolean = false;
  networks: { id: string; name: string; icon: string; }[] = [];
  openNetworkChangeFromPopup: boolean = false;
  selectedNetworkImage: string = '';
  selectedNetwork: string = '';
  showNetworkChangeFromPopup: boolean = false;
  showNetworkChangeToPopup: boolean = false;
  showTokenChangePopup: boolean = false;
  selectedNetworkTo: string = 'Abstract';
  selectedNetworkToImage: string = '/img/header/network-menu/Abstract.png';
  selectedToken: any = {
    symbol: 'ETH',
    imageUrl: '/img/trade/eth.png'
  };
  showBridgeTxPopup = false;
  inputAmount: string = '';
  showConnectWalletPopup: boolean = false;
	customAddress: string = '';
  showCustomAddress: boolean = false;

  constructor(
    private networkService: NetworkService,
    private walletService: WalletService,
    private renderer: Renderer2
  ) {
    this.networks = this.networkService.getNetworks();
		const abstractNetwork = this.networkService.getNetworks()
      .find(network => network.id === 'abstract');

    if (abstractNetwork) {
      this.selectedNetworkTo = abstractNetwork.name;
      this.selectedNetworkToImage = abstractNetwork.icon;
    }
  }

  ngOnInit() {
    // Подписываемся на изменения выбранной сети
    this.networkSubscription = this.networkService.selectedNetwork$.subscribe(network => {
      if (network) {
        // Обновляем сеть "From" при изменении сети в хедере
        this.selectedNetwork = network.name;
        this.selectedNetworkImage = network.icon;
        console.log('Network updated from header:', network); // для отладки
      }
    });

    // Получаем текущую выбранную сеть при инициализации
    const currentNetwork = this.networkService.getSelectedNetwork();
    if (currentNetwork) {
      this.selectedNetwork = currentNetwork.name;
      this.selectedNetworkImage = currentNetwork.icon;
    }

    // Если у вас есть сервис с токенами, можно получить первый токен из него
    // this.selectedToken = this.tokenService.getDefaultToken();
    
    // Или установить напрямую
    this.selectedToken = {
      symbol: 'ETH',
      imageUrl: '/img/trade/eth.png',
      // другие необходимые свойства токена
    };

    // Если по какой-то причине сеть не была установлена в конструкторе
    if (!this.selectedNetworkTo) {
      const abstractNetwork = this.networkService.getNetworks()
        .find(network => network.id === 'abstract');

      if (abstractNetwork) {
        this.selectedNetworkTo = abstractNetwork.name;
        this.selectedNetworkToImage = abstractNetwork.icon;
      }
    }
  }

  ngOnDestroy() {
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
    }
  }

  get formattedNetworks() {
    return this.networks.map(network => ({
      name: network.name,
      imageUrl: network.icon
    }));
  }

  toggleFeesVisibility(): void {
    this.feesVisible = !this.feesVisible;
    this.isNetworkChosen = !this.isNetworkChosen;
  }

  selectNetwork(networkId: string) {
    console.log(`Selected network: ${networkId}`);
    // Handle the selected network
  }

  closeNetworkChangeFromPopup(): void {
    this.showNetworkChangeFromPopup = false;
  }

  onNetworkSelected(event: { name: string; imageUrl: string }): void {
    // При выборе сети в попапе "From", обновляем также сеть в сервисе
    this.selectedNetwork = event.name;
    this.selectedNetworkImage = event.imageUrl;
    this.networkService.setSelectedNetwork({
      id: event.name.toLowerCase(), // или используйте соответствующий id
      name: event.name,
      icon: event.imageUrl
    });
    this.closeNetworkChangeFromPopup();
  }

  closeNetworkChangeToPopup(): void {
    this.showNetworkChangeToPopup = false;
  }

  onNetworkToSelected(event: { name: string; imageUrl: string }): void {
    this.selectedNetworkTo = event.name;
    this.selectedNetworkToImage = event.imageUrl;
    this.closeNetworkChangeToPopup();
  }

  closeTokenChangePopup(): void {
    this.showTokenChangePopup = false;
  }

  onTokenSelected(token: { symbol: string; imageUrl: string }): void {
    this.selectedToken = token;
    this.closeTokenChangePopup();
  }

	processInput(event: Event, isAmount: boolean): void {
    const input = event.target as HTMLInputElement;
    if (isAmount) {
      let value = input.value;
      
      // Заменяем запятые на точки
      value = value.replace(/,/g, '.');
      
      // Если ввод начинается с точки, добавляем 0 перед ней
      if (value.startsWith('.')) {
        value = '0' + value;
      }
      
      // Удаляем все символы, кроме цифр и точки
      value = value.replace(/[^0-9.]/g, '');
      
      // Удаляем лишние точки, оставляя только первую
      const firstDotIndex = value.indexOf('.');
      if (firstDotIndex !== -1) {
        value = value.slice(0, firstDotIndex + 1) + 
              value.slice(firstDotIndex + 1).replace(/\./g, '');
      }
      
      this.inputAmount = value;
      input.value = value;
    }
  }

  restrictInput(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', '.', ','];
    
    // Разрешаем цифры и некоторые управляющие клавиши
    if (
      (event.key >= '0' && event.key <= '9') || 
      allowedKeys.includes(event.key)
    ) {
      return; // Разрешённый ввод
    }
    
    // Блокируем остальные символы
    event.preventDefault();
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
    console.log('Animation ended, swapping networks...');
    const changeButton = document.getElementById('change-button');
    if (changeButton && changeButton.classList.contains('animate')) {
      this.renderer.removeClass(changeButton, 'animate');
      this.swapNetworks();
    }
  }
  
  swapNetworks(): void {
    console.log('Swapping networks...');
    
    // Сохраняем временные значения
    const tempNetwork = this.selectedNetwork;
    const tempNetworkImage = this.selectedNetworkImage;
    
    // Меняем местами сети
    this.selectedNetwork = this.selectedNetworkTo;
    this.selectedNetworkImage = this.selectedNetworkToImage;
    this.selectedNetworkTo = tempNetwork;
    this.selectedNetworkToImage = tempNetworkImage;
    
    console.log('After swap:', this.selectedNetwork, this.selectedNetworkTo);
  }

  openBridgeTxPopup(): void {
    // Скрываем контент с комиссиями при открытии попапа
    this.feesVisible = false;
    this.isNetworkChosen = false;
    this.showBridgeTxPopup = true;
  }

  closeBridgeTxPopup(): void {
    this.showBridgeTxPopup = false;
  }

  // Метод для проверки всех условий
  isBridgeButtonActive(): boolean {
    return !!(
      this.selectedNetwork && 
      this.selectedNetworkTo && 
      this.selectedToken?.symbol && 
      this.inputAmount && 
      Number(this.inputAmount) > 0
    );
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

  validateAddress(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.customAddress = input.value;
  }

  get addressStatus(): 'none' | 'good' | 'bad' {
    if (!this.customAddress) {
      return 'none';
    }
    return this.customAddress.length <= 2 ? 'good' : 'bad';
  }

  toggleCustomAddress(): void {
    this.showCustomAddress = !this.showCustomAddress;
  }
}