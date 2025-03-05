import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkService } from '../../../services/network.service';

interface Network {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-blackhole-network',
  standalone: true,
  templateUrl: './blackhole-network.component.html',
  styleUrls: ['./blackhole-network.component.scss'],
  imports: [CommonModule]
})
export class BlackholeNetworkComponent {
  @Output() networkSelected = new EventEmitter<Network>();
  @Output() close = new EventEmitter<void>();

  networks: Network[] = [];

  constructor(private networkService: NetworkService) {
    this.networks = this.networkService.getNetworks();
  }

  selectNetwork(networkId: string) {
    const selectedNetwork = this.networks.find(network => network.id === networkId);
    if (selectedNetwork) {
      this.networkSelected.emit(selectedNetwork);
      console.log('Network selected:', selectedNetwork);
    }
  }

  closePopup() {
    this.close.emit();
  }
}
