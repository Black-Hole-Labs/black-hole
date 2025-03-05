import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface Network {
  id: string;
  name: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private networks: Network[] = [
    { id: 'ethereum', name: 'Ethereum', icon: '/img/header/network-menu/ethereum.png' },
		{ id: 'solana', name: 'Solana', icon: '/img/header/network-menu/solana.png' },
    { id: 'eclipse', name: 'Eclipse', icon: '/img/header/network-menu/eclipse.png' },
		{ id: 'abstract', name: 'Abstract', icon: '/img/header/network-menu/Abstract.png' },
    { id: 'optimism', name: 'Optimism', icon: '/img/header/network-menu/optimism.png' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '/img/header/network-menu/arbitrum.png' },
    { id: 'zksync', name: 'zkSync', icon: '/img/header/network-menu/zksync.png' },
    { id: 'scroll', name: 'Scroll', icon: '/img/header/network-menu/scroll.png' },
    { id: 'linea', name: 'Linea', icon: '/img/header/network-menu/linea.png' },
    { id: 'mantle', name: 'Mantle', icon: '/img/header/network-menu/mantle.png' },
    { id: 'blast', name: 'Blast', icon: '/img/header/network-menu/blast.png' },
    { id: 'bnb', name: 'BNB Smart Chain', icon: '/img/header/network-menu/bnb.png' },
    { id: 'polygon', name: 'Polygon', icon: '/img/header/network-menu/polygon.png' },
    { id: 'avalanche', name: 'Avalanche', icon: '/img/header/network-menu/avalanche.png' }
  ];

  private selectedNetworkSubject = new BehaviorSubject<Network>(this.networks[0]);
  selectedNetwork$ = this.selectedNetworkSubject.asObservable();

  constructor() {
    // Загружаем сохраненную сеть из localStorage или используем Abstract по умолчанию
    const savedNetwork = localStorage.getItem('selectedNetwork');
    if (savedNetwork) {
      const network = JSON.parse(savedNetwork);
      this.selectedNetworkSubject.next(network);
    } else {
      // Если нет сохраненной сети, используем Abstract
      this.selectedNetworkSubject.next(this.networks[0]);
    }
  }

  getNetworks(): Network[] {
    return this.networks;
  }

  setSelectedNetwork(network: Network): void {
    console.log('Setting new network:', network); // для отладки
    this.selectedNetworkSubject.next(network);
    // Сохраняем выбранную сеть в localStorage
    localStorage.setItem('selectedNetwork', JSON.stringify(network));
  }

  getSelectedNetwork(): Network {
    return this.selectedNetworkSubject.value;
  }
}
