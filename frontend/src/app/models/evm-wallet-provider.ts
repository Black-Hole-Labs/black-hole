import { ethers, JsonRpcSigner } from 'ethers';
import { NetworkId, ProviderType, TransactionRequestEVM, WalletProvider } from './wallet-provider.interface';
import { Injector } from '@angular/core';
import { BlockchainStateService } from '../services/blockchain-state.service';

export class EvmWalletProvider implements WalletProvider {
  protected address: string = '';
  protected provider: any;
  public signer?: JsonRpcSigner;

  protected blockchainStateService: BlockchainStateService;
  protected injector: Injector;

  constructor(provider: any, injector: Injector) {
    this.injector = injector;
    this.blockchainStateService = injector.get(BlockchainStateService);
    this.provider = provider;
  }

  isAvailable(): boolean {
    return !!this.provider;
  }

  async connect(_provider?: any): Promise<{ address: string, nameService: string | null }> {
    if(this.blockchainStateService.networkSell() !== undefined && this.blockchainStateService.networkSell()?.chainType !== "EVM")
    {
      this.blockchainStateService.updateNetworkSell(NetworkId.ETHEREUM_MAINNET);
    }
    
    if (_provider) this.provider = _provider;
    if (!this.provider) throw new Error('Provider not installed');
    const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
    this.address = accounts[0];
    const ethersProvider = new ethers.BrowserProvider(this.provider);
    this.signer = await ethersProvider.getSigner();

    this.switchNetwork(this.blockchainStateService.networkSell());

    let ens: string | null;
    try
    {
      ens = await ethersProvider.lookupAddress(this.address);
      console.log("ens: ", ens);
    }
    catch(e)
    {
      console.log("error during lookupAddress: ", e);
      // it can probably throw
      ens = null;
    }

    return { address: this.address, nameService: ens ? ens : null };
  }

  async switchNetwork(selectedNetwork: any): Promise<void> {
    
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: selectedNetwork.idHex }],
      });
    } catch (error: any) {
      if (error.code === 4902 || error.message.includes("Unrecognized chain ID")) {
        await this.addNetwork(selectedNetwork);
        await this.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: selectedNetwork.idHex }],
        });
      }
      else if (error.code === 4001 
               || error.message.includes("User rejected the request")
               || error.message.includes("The Provider is not connected to the requested chain"))
      {
        throw error;
      }
      else {
        //this.blockchainStateService.disconnect(this.address);
        throw new Error("unsupported_network"); //TODO
      }
    }
  }

  private async addNetwork(selectedNetwork: any): Promise<void> {
    try{
      await this.provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: selectedNetwork.idHex,
            chainName: selectedNetwork.name,
            rpcUrls: selectedNetwork.rpcUrls,
            nativeCurrency: selectedNetwork.nativeCurrency,
          },
        ],
      });
    }
    catch(error: any)
    {
      console.log("error",error);
      if(error.code != -32603) // metamask problem. error after successfully adding new network to the wallet. ignore it
      {
        throw error;
      }
    }

  }

  // async getNetwork(): Promise<string> {
  //   const chainId = await this.provider.request({ method: 'eth_chainId' });
  //   return chainId || '';
  // }

  getAddress(): string {
    return this.address;
  }

  async sendTx(txData: TransactionRequestEVM, isErc20From: boolean = false): Promise<string> {
    try {
      const txParams: any = {
        from: txData.from,
        to: txData.to,
        data: txData.data,
      };
      if (!isErc20From) {
        txParams.value = txData.value;
      } else {
        txParams.value = '0x0';
      }
      // console.log('Отправка транзакции:', txParams);
      return await this.provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
    } catch (error: any) {
      console.error('Ошибка при отправке транзакции:', error);
      throw error;
    }
  }
}