import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, Renderer2, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { NetworkService } from '../../services/network.service';
import { BlackholeNetworkComponent } from '../popup/blackhole-network/blackhole-network.component';
import { BlackholeMenuComponent } from '../popup/blackhole-menu/blackhole-menu.component';
import { ConnectWalletComponent } from '../popup/connect-wallet/connect-wallet.component';
import { WalletComponent } from '../popup/wallet/wallet.component';
import { WalletService } from '../../services/wallet.service';
import { PopupService } from '../../services/popup.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    BlackholeNetworkComponent,
    BlackholeMenuComponent,
    ConnectWalletComponent,
    WalletComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() selectedNetwork: { id: string; name: string; icon: string; } | null = null;
  gmCount: number | null = null;
  private readonly GM_COUNT_KEY = 'gmCount';
  private readonly LAST_GM_TIME_KEY = 'lastGmTime';
  popupMessage: string = ''; // Сообщение для мини-попапа
  showPopup: boolean = false; // Управление отображением мини-попапа
  showBlackholeMenu = false;
  showConnectWalletPopup = false;
  showWalletPopup = false;
  walletName: string = 'Connect Wallet';
  private subscription: Subscription;

  @Output() toggleMenu = new EventEmitter<void>();
  @Output() toggleNetwork = new EventEmitter<void>();

  constructor(
    private renderer: Renderer2,
    private elRef: ElementRef,
    private networkService: NetworkService,
    public walletService: WalletService,
    public popupService: PopupService
  ) {
    this.walletService.walletName$.subscribe(name => {
      this.walletName = name || 'Connect Wallet';
    });
    this.subscription = this.popupService.activePopup$.subscribe(popupType => {
      this.showBlackholeMenu = false;
      this.showConnectWalletPopup = false;
      this.showWalletPopup = false;

      switch(popupType) {
        case 'blackholeMenu':
          this.showBlackholeMenu = true;
          break;
        case 'connectWallet':
          this.showConnectWalletPopup = true;
          break;
        case 'wallet':
          this.showWalletPopup = true;
          break;
      }
    });
  }

  ngOnInit() {
    this.loadGmCount();
    // Подписываемся на изменения сети
    this.networkService.selectedNetwork$.subscribe(network => {
      this.selectedNetwork = network;
      console.log('Header network updated:', network); // для отладки
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadGmCount() {
    const savedCount = localStorage.getItem(this.GM_COUNT_KEY);
    const lastGmTime = localStorage.getItem(this.LAST_GM_TIME_KEY);

    if (savedCount && lastGmTime) {
      const now = new Date().getTime();
      const timeDiff = now - parseInt(lastGmTime);
      // Изменяем с 24 на 48 часов (48 * 60 * 60 * 1000 = 172800000 миллисекунд)
      if (timeDiff > 172800000) {
        // Прошло больше 48 часов - сбрасываем счетчик
        localStorage.removeItem(this.GM_COUNT_KEY);
        localStorage.removeItem(this.LAST_GM_TIME_KEY);
        this.gmCount = null;
      } else {
        this.gmCount = parseInt(savedCount);
      }
    }
  }

  togglePopup(event?: Event): void {
    // Если есть событие, предотвращаем его всплытие
    if (event) {
      event.stopPropagation();
    }

    const currentPopup = this.popupService.getCurrentPopup();
    console.log('Current popup:', currentPopup);

    if (currentPopup === 'blackholeMenu') {
      console.log('Closing blackholeMenu');
      this.popupService.closeAllPopups();
    } else {
      console.log('Opening blackholeMenu');
      this.popupService.openPopup('blackholeMenu');
    }
  }

  get isNetworkPopupVisible(): boolean {
    return this.popupService.getCurrentPopup() === 'networkPopup';
  }

  toggleNetworkPopup(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const currentPopup = this.popupService.getCurrentPopup();
    
    if (currentPopup === 'networkPopup') {
      this.popupService.closePopup('networkPopup');
    } else {
      this.popupService.openPopup('networkPopup');
    }
  }

  incrementGmCount() {
    const lastClickTime = localStorage.getItem('lastGmClick');
    const now = new Date();

    if (lastClickTime) {
      const lastClickDate = new Date(lastClickTime);
      const nextAllowedClick = new Date(lastClickDate);
      nextAllowedClick.setUTCDate(lastClickDate.getUTCDate() + 1);

      if (now < nextAllowedClick) {
        const timeLeft = this.calculateTimeLeft(nextAllowedClick, now);
        this.showPopupWithMessage(`Next GM in ${timeLeft}`);
        return;
      }
    }

    // Если можно кликнуть
    this.gmCount = (this.gmCount ?? 0) + 1;
    localStorage.setItem('lastGmClick', now.toISOString());
    this.triggerFireworks();
  }

  calculateTimeLeft(nextAllowed: Date, current: Date): string {
    const diff = nextAllowed.getTime() - current.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  showPopupWithMessage(message: string) {
    this.popupMessage = message;
    this.showPopup = true;
    setTimeout(() => {
      this.showPopup = false;
    }, 5000); // Показываем попап на 5 секунд
  }

  triggerFireworks() {
    const gmElement = this.elRef.nativeElement.querySelector('.gm');
    const container = this.elRef.nativeElement.querySelector('.fireworks-container');

    const gmRect = gmElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const centerX = gmRect.left + gmRect.width / 2 - containerRect.left; // Центр X
    const centerY = gmRect.top + gmRect.height / 2 - containerRect.top; // Центр Y

    for (let i = 0; i < 20; i++) {
      const spark = this.renderer.createElement('div');
      this.renderer.addClass(spark, 'spark');
      this.renderer.appendChild(container, spark);

      // Угол и дистанция
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * 100 + 50;
      const duration = Math.random() * 800 + 500; // Длительность в миллисекундах

      // Вычисляем конечные координаты
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      // Устанавливаем начальную позицию
      this.renderer.setStyle(spark, 'background-color', ''); // Убедитесь, что нет фона
      this.renderer.setStyle(spark, 'background-image', 'url("/img/animation/ufo.png")');
      this.renderer.setStyle(spark, 'background-size', 'contain');
      this.renderer.setStyle(spark, 'border-radius', '0');
      this.renderer.setStyle(spark, 'box-shadow', 'none');

      // Начинаем анимацию
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); // Прогресс от 0 до 1

        // Интерполяция координат
        const currentX = centerX + targetX * progress;
        const currentY = centerY + targetY * progress;

        // Обновляем позицию
        this.renderer.setStyle(spark, 'left', `${currentX}px`);
        this.renderer.setStyle(spark, 'top', `${currentY}px`);
        this.renderer.setStyle(spark, 'opacity', `${1 - progress}`); // Исчезновение

        if (progress < 1) {
          requestAnimationFrame(animate); // Продолжаем анимацию
        } else {
          // Удаляем искру после завершения
          this.renderer.removeChild(container, spark);
        }
      };

      requestAnimationFrame(animate);
    }
  }

  selectNetwork(network: { id: string; name: string; icon: string }): void {
    console.log('Header selecting network:', network); // для отладки
    this.networkService.setSelectedNetwork(network);
    this.popupService.closePopup('networkPopup');
  }

  openConnectWalletPopup(): void {
		if (this.walletService.isConnected()) {
			this.popupService.openPopup('wallet');
		} else {
			this.popupService.openPopup('connectWallet');
		}
	}

  closeConnectWalletPopup(): void {
    this.showConnectWalletPopup = false;
  }

  openWalletPopup(): void {
    this.showConnectWalletPopup = false; // закрываем connect-wallet попап
    this.showWalletPopup = true;
  }

  closeWalletPopup(): void {
    this.showWalletPopup = false;
  }

  onWalletDisconnect(): void {
    this.walletService.disconnect();
    this.showWalletPopup = false;
    this.showConnectWalletPopup = true;
  }

  openMenu(): void {
    this.popupService.openPopup('blackholeMenu');
  }

  closeMenu(): void {
    this.showConnectWalletPopup = false;
  }

  openConnectWallet(): void {
    this.popupService.openPopup('connectWallet');
  }

  closeConnectWallet(): void {
    this.showConnectWalletPopup = false;
  }

  openWallet(): void {
    this.popupService.openPopup('wallet');
  }

  closeWallet(): void {
    this.showWalletPopup = false;
  }

  closeAllPopups(): void {
    this.popupService.closeAllPopups();
  }

  // Геттер для проверки состояния blackholeMenu
  get isPopupVisible(): boolean {
    return this.popupService.getCurrentPopup() === 'blackholeMenu';
  }
}
