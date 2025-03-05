import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NetworkService } from '../../../services/network.service';

@Component({
  selector: 'app-network-change-to',
  standalone: true,
  templateUrl: './network-change-to.component.html',
  styleUrls: ['./network-change-to.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class NetworkChangeToPopupComponent {
  @Input() networks: { id: string; name: string; icon: string }[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() networkSelected = new EventEmitter<{ name: string; imageUrl: string }>();

  searchText: string = '';
  filteredNetworks: { id: string; name: string; icon: string }[] = [];

  constructor(private networkService: NetworkService) {
    if (this.networks.length === 0) {
      this.networks = this.networkService.getNetworks();
    }
    this.filteredNetworks = [...this.networks];
  }

  ngOnChanges() {
    this.filteredNetworks = [...this.networks];
  }

  performSearch(): void {
    const search = this.searchText.toLowerCase().trim();
    this.filteredNetworks = this.networks.filter(
      network => network.name.toLowerCase().includes(search)
    );
  }

  closePopup(): void {
    this.close.emit();
  }

  selectNetwork(network: { id: string; name: string; icon: string }): void {
    this.networkSelected.emit({ 
      name: network.name, 
      imageUrl: network.icon 
    });
    this.closePopup();
  }
}
