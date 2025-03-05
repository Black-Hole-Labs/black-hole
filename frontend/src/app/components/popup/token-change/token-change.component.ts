import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NetworkService } from '../../../services/network.service';

@Component({
  selector: 'app-token-change',
  standalone: true,
  templateUrl: './token-change.component.html',
  styleUrls: ['./token-change.component.scss'],
	imports: [CommonModule, FormsModule],
})
export class TokenChangePopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() tokenSelected = new EventEmitter<{ symbol: string; imageUrl: string }>();

	searchText: string = '';
  currentNetworkIcon: string = '';

  tokens = [
    { symbol: 'ARB', name: 'Arbitrum', contractAddress: '0xArbContract...', imageUrl: '/img/trade/arbitrum.png' },
    { symbol: 'ETH', name: 'Ethereum', contractAddress: '0xEthContract...', imageUrl: '/img/trade/eth.png' },
    { symbol: 'SHIB', name: 'SHIBA INU', contractAddress: '0xShibContract...', imageUrl: '/img/trade/shib.png' },
    { symbol: 'ZK', name: 'ZkSync', contractAddress: '0xZkContract...', imageUrl: '/img/trade/zk.png' },
    { symbol: 'USDT', name: 'Tether', contractAddress: '0xUsdtContract...', imageUrl: '/img/trade/usdt.png' },
    { symbol: 'DOGE', name: 'Dogecoin', contractAddress: '0xDogeContract...', imageUrl: '/img/trade/doge.png' },
    { symbol: 'USDC', name: 'Circle', contractAddress: '0xUsdcContract...', imageUrl: '/img/trade/usdc.png' },
    { symbol: 'BAL', name: 'Balancer', contractAddress: '0xMaticContract...', imageUrl: '/img/trade/bal.png' },
    { symbol: 'BNB', name: 'BNB', contractAddress: '0xBnbContract...', imageUrl: '/img/trade/bnb.png' },
    { symbol: 'LZ', name: 'Layer Zero', contractAddress: '0xLzContract...', imageUrl: '/img/trade/lz.png' },
  ];

	filteredTokens = [...this.tokens]; // Массив для хранения отфильтрованных токенов

  constructor(private networkService: NetworkService) {
    const currentNetwork = this.networkService.getSelectedNetwork();
    if (currentNetwork) {
      this.currentNetworkIcon = currentNetwork.icon;
    }

    this.networkService.selectedNetwork$.subscribe(network => {
      if (network) {
        this.currentNetworkIcon = network.icon;
      }
    });
  }

  performSearch(): void {
    const search = this.searchText.toLowerCase().trim();
    this.filteredTokens = this.tokens.filter(
      token =>
        token.name.toLowerCase().includes(search) ||
        token.symbol.toLowerCase().includes(search) ||
        token.contractAddress.toLowerCase().includes(search)
    );
  }

  closePopup(): void {
    this.close.emit();
  }

  selectToken(token: { symbol: string; name: string; contractAddress: string; imageUrl: string }): void {
		this.tokenSelected.emit({ symbol: token.symbol, imageUrl: token.imageUrl });
		this.closePopup();
	}

	copyToClipboard(address: string, event: Event): void {
    event.stopPropagation(); // Останавливаем всплытие события
    navigator.clipboard.writeText(address).catch(() => {
      console.error('Failed to copy to clipboard');
    });
  }
}
