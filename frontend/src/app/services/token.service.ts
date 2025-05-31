import { effect, Injectable, signal } from '@angular/core';
import { Token } from '../pages/trade/trade.component';
import { Network } from '../models/wallet-provider.interface';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private selectedBuyToken = signal<Token | undefined>(undefined);
  private selectedSellToken = signal<Token | undefined>(undefined);
  private selectedBuyNetwork = signal<Network | undefined>(undefined);
  private selectedSellNetwork = signal<Network | undefined>(undefined);

  public setSelectedBuyToken(token: Token | undefined) {
    this.selectedBuyToken.set(token);
  }

  public getSelectedBuyToken() {
    return this.selectedBuyToken();
  }

  public setSelectedSellToken(token: Token | undefined) {
    this.selectedSellToken.set(token);
  }

  public getSelectedSellToken() {
    return this.selectedSellToken();
  }

  public setSelectedBuyNetwork(network: Network | undefined) {
    this.selectedBuyNetwork.set(network);
  }

  public getSelectedBuyNetwork() {
    return this.selectedBuyNetwork();
  }

  public setSelectedSellNetwork(network: Network | undefined) {
    this.selectedSellNetwork.set(network);
  }

  public getSelectedSellNetwork() {
    return this.selectedSellNetwork();
  }

  constructor() {
    effect(() => {
      // console.log('selectedSellToken', this.selectedSellToken());
      // console.log('selectedBuyToken', this.selectedBuyToken());
    });
  }
}
