import { Component, EventEmitter, Output, inject, Input, Signal, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BlockchainStateService } from '../../../services/blockchain-state.service';
import { WalletBalanceService } from '../../../services/wallet-balance.service';
import { Token } from '../../../pages/trade/trade.component';
import { Network } from '../../../models/wallet-provider.interface';
import { ethers } from 'ethers';
import { NetworkChangeFromPopupComponent } from '../network-change-from/network-change-from.component';

export interface TokenDisplay extends Token {
  name?: string;
}

@Component({
  selector: 'app-token-change',
  standalone: true,
  templateUrl: './token-change.component.html',
  styleUrls: ['./token-change.component.scss', './token-change.component.adaptives.scss'],
  imports: [CommonModule, FormsModule, NetworkChangeFromPopupComponent],
})
export class TokenChangePopupComponent {
  @Input() mode!: 'sell' | 'buy';
  @Output() close = new EventEmitter<void>();
  @Output() tokenSelected = new EventEmitter<Token>();
  @Input() networkTokens: Token[] | undefined;
  @Input() excludeToken: Token | undefined;
  @Input() selectedToken: Token | undefined;
  searchText = signal<string>('');
  tokenBalances = signal<Map<string, string>>(new Map());
  copiedAddresses = signal<Set<string>>(new Set<string>());

  selectedNetworkId = signal<number | undefined>(undefined);
  selectedNetworkTokens = signal<Token[]>([]);

  constructor() {}

  private tokenCache = new Map<number, Token[]>();

  private static selectedSellNetworkId: number | undefined = undefined;
  private static selectedBuyNetworkId: number | undefined = undefined;

  blockchainStateService = inject(BlockchainStateService);
  walletBalanceService = inject(WalletBalanceService);
  explorerUrl = computed(() => this.blockchainStateService.network()?.explorerUrl || 'https://etherscan.io/token/');
  ethers = ethers;

  networks = computed(() => {
    const all = this.blockchainStateService.networks();
    const selectedId = this.selectedNetworkId();
    const first10 = all.slice(0, 10);
    const next = all[10];
    if (!selectedId) return all.slice(0, 11);
    const selected = all.find((n) => n.id === selectedId);
    if (!selected) return all.slice(0, 11);

    if (all.slice(0, 11).some((n) => n.id === selectedId)) {
      return all.slice(0, 11);
    }

    return [...first10, selected];
  });
  currentNetwork = computed(() => this.blockchainStateService.network());

  additionalNetworksCount = computed(() => {
    const totalNetworks = this.blockchainStateService.allNetworks().length;
    const displayedNetworks = 11;
    return Math.max(0, totalNetworks - displayedNetworks);
  });

  tokenList: Signal<TokenDisplay[]> = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const tokens = this.getBaseTokens();
    const filteredBySearch = this.filterBySearch(tokens, search);
    const filteredByExclude = this.filterByExcludeToken(filteredBySearch);

    return filteredByExclude as TokenDisplay[];
  });

  displayedTokens: Signal<TokenDisplay[]> = computed(() => {
    return (this.tokenList() || []).slice(0, 15);
  });

  showNetworkChangeFrom = signal<boolean>(false);

  ngOnInit(): void {
    if (!this.mode) {
      throw new Error('Mode is required! Pass "sell" or "buy" to the mode input.');
    }

    let networkToUse: number | undefined;

    if (this.mode === 'sell') {
      networkToUse = TokenChangePopupComponent.selectedSellNetworkId || this.blockchainStateService.network()?.id;
    } else {
      networkToUse = TokenChangePopupComponent.selectedBuyNetworkId || this.blockchainStateService.network()?.id;
    }

    if (networkToUse && !this.networkTokens?.length) {
      this.selectedNetworkId.set(networkToUse);
      this.loadTokensForNetwork(networkToUse);
    } else if (!this.networkTokens?.length) {
      // Если сеть не определена, используем текущую сеть
      const currentNetworkId = this.blockchainStateService.network()?.id;
      if (currentNetworkId) {
        this.selectedNetworkId.set(currentNetworkId);
        this.loadTokensForNetwork(currentNetworkId);
      }
    }

    if (this.blockchainStateService.connected()) {
      this.loadDisplayedBalances();
    }
  }

  async loadDisplayedBalances(): Promise<void> {
    const list = this.displayedTokens();
    const balances = new Map<string, string>();

    for (const token of list) {
      try {
        const balance = await this.walletBalanceService.getBalanceForToken(token);
        balances.set(token.contractAddress, this.truncateTo6Decimals(parseFloat(balance)));
      } catch (error) {
        console.error(`Error loading balance for token ${token.symbol}:`, error);
        balances.set(token.contractAddress, '0');
      }
    }

    this.tokenBalances.set(balances);
  }

  async loadTokensForNetwork(networkId: number): Promise<void> {
    if (this.tokenCache.has(networkId)) {
      this.selectedNetworkTokens.set(this.tokenCache.get(networkId)!);
      return;
    }

    try {
      const tokens = await this.blockchainStateService.fetchTokensForNetwork(networkId);
      this.tokenCache.set(networkId, tokens);
      this.selectedNetworkTokens.set(tokens);
    } catch (error) {
      console.error(`Error loading tokens for network ${networkId}:`, error);
      this.selectedNetworkTokens.set([]);
    }
  }

  getTokenBalance(token: Token): string {
    return this.tokenBalances()?.get(token.contractAddress) || '0';
  }

  truncateTo6Decimals(value: number): string {
    return (Math.trunc(value * 1e6) / 1e6).toString();
  }

  updateSearchText(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  closePopup(): void {
    this.close.emit();
  }

  selectToken(token: Token): void {
    this.tokenSelected.emit(token);
    this.closePopup();
  }

  copyToClipboard(address: string, event: Event): void {
    event.stopPropagation();
    navigator.clipboard
      .writeText(address)
      .then(() => {
        const currentCopied = this.copiedAddresses();
        const newCopied = new Set(currentCopied);
        newCopied.add(address);
        this.copiedAddresses.set(newCopied);

        setTimeout(() => {
          const currentCopied = this.copiedAddresses();
          const newCopied = new Set(currentCopied);
          newCopied.delete(address);
          this.copiedAddresses.set(newCopied);
        }, 2000);
      })
      .catch(() => console.error('Failed to copy to clipboard'));
  }

  isCopied(address: string): boolean {
    return this.copiedAddresses().has(address);
  }

  isNativeToken(token: TokenDisplay): boolean {
    const currentNetwork = this.blockchainStateService.network();
    if (!currentNetwork) return false;

    if (currentNetwork.chainType === 'SVM') {
      return token.symbol === 'SOL';
    }

    return token.contractAddress === ethers.ZeroAddress;
  }

  isVerifiedToken(token: TokenDisplay): boolean {
    return true;
  }

  getTokenImage(token: TokenDisplay): string {
    return token.imageUrl ? `url(${token.imageUrl})` : 'none';
  }

  trackByToken(index: number, token: TokenDisplay): string {
    return token.contractAddress || index.toString();
  }

  trackByNetwork(index: number, network: Network): number {
    return network.id;
  }

  async selectNetwork(network: Network): Promise<void> {
    if (this.selectedNetworkId() === network.id) {
      return;
    }

    if (!this.blockchainStateService.connected()) {
      this.selectedNetworkId.set(network.id);
      await this.loadTokensForNetwork(network.id);
    }

    if (this.mode === 'sell') {
      TokenChangePopupComponent.selectedSellNetworkId = network.id;

      if (!this.blockchainStateService.connected()) {
        this.blockchainStateService.updateNetwork(network.id);
      }

      const currentProvider = this.blockchainStateService.getCurrentProvider();
      if (!currentProvider) {
        console.error('No provider selected');
        return;
      }

      const provider = currentProvider.provider;
      // await provider.switchNetwork(network);
      this.blockchainStateService.updateNetwork(network.id);
      this.blockchainStateService.updateWalletAddress(provider.address);
    } else {
      TokenChangePopupComponent.selectedBuyNetworkId = network.id;
    }

    // this.selectedNetworkId.set(network.id);
    // await this.loadTokensForNetwork(network.id);

    if (this.blockchainStateService.connected()) {
      this.selectedNetworkId.set(network.id);
      await this.loadTokensForNetwork(network.id);
    }

    if (this.blockchainStateService.connected()) {
      this.loadDisplayedBalances();
    }

    if (this.blockchainStateService.connected() && this.mode === 'sell') {
      const currentProvider = this.blockchainStateService.getCurrentProvider();
      if (!currentProvider) {
        console.error('No provider selected');
        return;
      }

      try {
        const provider = currentProvider.provider;
        await provider.switchNetwork(network);
        this.blockchainStateService.updateNetwork(network.id);
      } catch (error) {
        console.error('Failed to switch network:', error);
      }
    }
  }

  isCurrentNetwork(network: Network): boolean {
    if (this.selectedNetworkId()) {
      return this.selectedNetworkId() === network.id;
    }

    return this.currentNetwork()?.id === network.id;
  }

  isSelectedToken(token: Token): boolean {
    return this.selectedToken?.contractAddress === token.contractAddress;
  }

  openNetworkChangeFrom(): void {
    this.showNetworkChangeFrom.set(true);
  }

  onNetworkSelected(network: Network): void {
    this.selectNetwork(network);
    this.showNetworkChangeFrom.set(false);
  }

  private getBaseTokens(): Token[] {
    if (this.selectedNetworkId()) {
      return this.selectedNetworkTokens();
    }

    if (this.networkTokens?.length) {
      return this.networkTokens;
    }

    return this.blockchainStateService.filteredTokens();
  }

  private filterBySearch(tokens: Token[], search: string): Token[] {
    if (!search) return tokens;

    return tokens.filter(
      (token) => token.symbol.toLowerCase().includes(search) || token.contractAddress.toLowerCase().includes(search),
    );
  }

  private filterByExcludeToken(tokens: Token[]): Token[] {
    if (!this.excludeToken) return tokens;

    return tokens.filter((token) => token.contractAddress !== this.excludeToken!.contractAddress);
  }
}
