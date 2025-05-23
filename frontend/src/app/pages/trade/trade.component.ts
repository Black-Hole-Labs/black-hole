import { Component, Renderer2, ChangeDetectorRef, computed, signal, effect, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TokenChangePopupComponent } from '../../components/popup/token-change/token-change.component';
import { SettingsComponent } from '../../components/popup/settings/settings.component';
import { BlockchainStateService } from '../../services/blockchain-state.service';
import { WalletBalanceService } from '../../services/wallet-balance.service';
import { TransactionsService } from '../../services/transactions.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NetworkId, TransactionRequestEVM, TransactionRequestSVM } from '../../models/wallet-provider.interface';
import { ethers, parseUnits, ZeroAddress } from 'ethers';
import { PopupService } from '../../services/popup.service';
import { SuccessNotificationComponent } from '../../components/notification/success-notification/success-notification.component';
import { FailedNotificationComponent } from '../../components/notification/failed-notification/failed-notification.component';
import { PendingNotificationComponent } from '../../components/notification/pending-notification/pending-notification.component';

export interface Token {
  symbol: string;
  imageUrl: string;
  contractAddress: string;
  chainId: number;
  decimals: string;
}

@Component({
  selector: 'app-trade',
  standalone: true,
  templateUrl: './trade.component.html',
  styleUrls: [
    './trade.component.scss',
    './trade.component.adaptives.scss'
  ],
  imports: [
    FormsModule,
    CommonModule,
    TokenChangePopupComponent,
    SettingsComponent,
    SuccessNotificationComponent,
    FailedNotificationComponent,
    PendingNotificationComponent
],
})
export class TradeComponent implements AfterViewChecked {
//[x: string]: any;
  sellAmount: string = '';
  //validatedSellAmount: string = ''; 
  sellAmountForInput= signal<string | undefined>(undefined);
  validatedSellAmount = signal<number>(0);
  loading = signal<boolean>(false);
  
  buyAmount = signal<string | undefined>(undefined);
  buyAmountForInput = signal<string | undefined>(undefined);
  price = signal<number>(0);
  priceUsd: number = 0;
  sellPriceUsd = signal<string>('');
  buyPriceUsd = signal<string>('');
  balance = signal<number>(0.0);
  balanceBuy = signal<number>(0.0);
  rotationCount: number = 0;
	slippage: number = 0.005; // 0.005 is default for LIFI
  gasPriceUSD: number | undefined;

  selectedToken = signal<Token | undefined>(undefined);
  selectedBuyToken = signal<Token | undefined>(undefined);
  //showConnectWalletPopup: boolean = false;
  txData = signal<TransactionRequestEVM | TransactionRequestSVM | undefined> (undefined);

  walletTimer: any = null;
  findingRoutesTimer: any = null;

  showSuccessNotification = false;
  showFailedNotification = false;
  showPendingNotification = false;

  buttonState: 'swap' | 'finding' | 'approve' | 'wallet' | 'insufficient' | 'no-available-quotes' = 'swap';
  
  firstToken = computed(() => {
    const tokens = this.blockchainStateService.filteredTokens();
    return tokens.length > 0 ? tokens[0] : undefined;
  });

  swapButtonValidation = computed(() =>
    this.txData() !== undefined
  );

  allFieldsReady = computed(() =>
    !!this.blockchainStateService.network() &&
    this.selectedToken() !== undefined &&
    this.selectedBuyToken() !== undefined &&
    this.validatedSellAmount() !== 0
  );

  @ViewChild('buyAmountText') buyAmountTextElement: ElementRef | null = null;
  private buyAmountTextAnimated = false;

  private possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}:"<>?|';
  private glitchChars = '!@#$%^&*()_+{}:"<>?|\\';
  private cyberChars = '01010101110010101010101110101010';
  private animationFrames = 60;
  private animationSpeed = 35;
  private animationTimeouts: { [key: string]: number } = {};

  private debounceTimer: any;
  private throttleActive: boolean = false;
  private isProcessingInput = signal<boolean>(false);

  inputFontSize = signal<number>(48);

  private resizeObserver: any;

  constructor(
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    private blockchainStateService: BlockchainStateService,
    private walletBalanceService: WalletBalanceService,
    private transactionsService: TransactionsService,
    public popupService: PopupService
  ) {
    this.inputFontSize.set(this.defaultFontSizeByScreenWidth());

    effect(() => 
    {
      try{
        if(this.allFieldsReady() && !this.isProcessingInput())
        {
          this.getTxData();
        }
      }
      catch(error){
        // this.updateBuyAmount('0.0');
        // update gas = 0.0
        // console.log("error",error);
        this.buttonState = 'no-available-quotes';
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const tokens = this.blockchainStateService.filteredTokens();
      const newSelectedToken = tokens.length > 0 ? tokens[0] : undefined;
      const newSelectedBuyToken = tokens.length > 1 ? tokens[1] : undefined;
  
      this.selectedToken.set(newSelectedToken);
      this.selectedBuyToken.set(newSelectedBuyToken);
      if(!this.blockchainStateService.connected()){
        return;
      }
      Promise.resolve().then(() => {
    
        if (this.selectedToken()) {
          this.walletBalanceService.getBalanceForToken(this.selectedToken()!)
            .then((balanceStr) => {
              this.balance.set(Number(parseFloat(balanceStr)));
            })
            .catch((error) => {
              console.error('Error getting balance sell: ', error);
              this.balance.set(0.0);
            });
        }
    
        if (this.selectedBuyToken()) {
          this.walletBalanceService.getBalanceForToken(this.selectedBuyToken()!)
            .then((balanceStr) => {
              this.balanceBuy.set(Number(parseFloat(balanceStr)));
            })
            .catch((error) => {
              console.error('Error getting balance buy: ', error);
              this.balanceBuy.set(0.0);
            });
        }
      });
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.resizeObserver = new ResizeObserver(() => {
      this.inputFontSize.set(this.defaultFontSizeByScreenWidth());
    });
    
    this.resizeObserver.observe(document.body);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
  
  handleKeyDown(event: KeyboardEvent): void {
    const inputElement = event.target as HTMLInputElement;
    const cursorPos = inputElement.selectionStart ?? inputElement.value.length;

    const replaceKeys = [',', '.', '/', 'б', 'ю']; 

    if (replaceKeys.includes(event.key)) {
      event.preventDefault(); 

      if (inputElement.value.includes('.')) return;

      inputElement.value =
        inputElement.value.slice(0, cursorPos) + '.' + inputElement.value.slice(cursorPos);

      setTimeout(() => inputElement.setSelectionRange(cursorPos + 1, cursorPos + 1), 0);
    }
  }

  processInput(event: Event, isSell: boolean): void {
    this.txData.set(undefined);
    const inputElement = event.target as HTMLInputElement;
    inputElement.value = inputElement.value
    .replace(/[^0-9.]/g, '')
    .replace(/\.+/g, '.') 
    .replace(/^(\.)/g, '');

    if (isSell)
    {
      this.isProcessingInput.update(value => true);

      this.sellAmount = inputElement.value;
      this.validatedSellAmount.update(value => (Number(inputElement.value)));
      
      this.adjustFontSize(inputElement);
      
      if (this.validatedSellAmount() > this.balance())
      {
        this.buttonState = 'insufficient';
        // this.updateBuyAmount('0.0');
      }
      else
      {
        this.buttonState = 'swap';
      }

      if (!this.throttleActive) {
        this.throttleActive = true;
        
        this.debounceTimer = setTimeout(() => {
          this.isProcessingInput.update(() => false);
          this.throttleActive = false;
        }, 2000);
      }
    }
  }

  updateBuyAmount(value: string): void {
    const limited = this.limitDecimals(value, 6);
    const num = Number(limited);
  
    if (!isNaN(num)) {
      this.buyAmount.set(value); 
      this.buyAmountForInput.set(limited);
      
      this.buyAmountTextAnimated = false;
      
      setTimeout(() => this.checkAndAnimateBuyText(), 0);
    } else {
      this.buyAmount.set('0');
      this.buyAmountForInput.set('0');
    }
  }

  updateSellAmount(value: string): void {
    const limited = this.limitDecimals(value, 6);
    const num = Number(limited);
  
    if (!isNaN(num)) {
      this.sellAmount = value; 
      this.sellAmountForInput.set(limited);
    } else {
      this.sellAmount = '0';
      this.sellAmountForInput.set('0');
    }
  }
  
  limitDecimals(value: string, maxDecimals: number): string {
    if (value.includes('.')) {
      const [intPart, decimalPart] = value.split('.');
      const trimmedDecimals = decimalPart.slice(0, maxDecimals);
      return `${intPart}.${trimmedDecimals}`;
    }
    return value;
  }

  updateSellPriceUsd(price: number): void {
    if (!isNaN(price)) {
      this.sellPriceUsd.set(`$${Number(price).toFixed(3)}`);
    } else {
      this.sellPriceUsd.set('');
    }
  }

  updateBuyPriceUsd(price: number): void {
    if (!isNaN(price)) {
      this.buyPriceUsd.set(`$${Number(price).toFixed(3)}`);
    } else {
      this.buyPriceUsd.set('');
    }
  }

  setMaxSellAmount(): void {
    this.updateSellAmount(this.balance().toString());
    this.validatedSellAmount.update(value => this.balance());
    if (Number(this.validatedSellAmount()) > this.balance()) {
      this.buttonState = 'insufficient';
      this.updateBuyAmount('0.0');
    }
    else
    {
      this.buttonState = 'swap';
    }
  }

  rotateRefresh(): void {
    if (this.isWalletConnected())
    {
      this.getTxData();
    }
    const refreshElement = document.querySelector('.refresh');
    if (refreshElement) {
      this.rotationCount += 1;
      this.renderer.setStyle(refreshElement, 'transform', `rotate(${this.rotationCount * -720}deg)`);
    }
  }
	
	swapTokens(): void {
    this.txData.update(() => undefined);
    this.buttonState = "swap";
	
    const tempToken = this.selectedToken();
    this.selectedToken.update(() => this.selectedBuyToken());
    this.selectedBuyToken.update(() => tempToken);

    const tempBalance = this.balance(); 
    this.balance.update(() => this.balanceBuy());
    this.balanceBuy.update(() => tempBalance);

    const tempSellAmount = this.validatedSellAmount();
    this.updateSellAmount(this.buyAmountForInput()!);
    this.validatedSellAmount.set(Number(this.buyAmountForInput()));
    this.updateBuyAmount(String(tempSellAmount));
    //this.getTxData();
  }

  openTokenPopup(): void {
    this.popupService.openPopup('tokenChangeSell');
  }

  closeTokenPopup(): void {
    this.popupService.closePopup('tokenChangeSell');
  }

  async onTokenSelected(token: Token): Promise<void> {
    this.txData.set(undefined);
    this.selectedToken.set(token);
    this.balance.set(Number((parseFloat(await this.walletBalanceService.getBalanceForToken(token)))));
    // this.selectedToken = token.symbol;
    // this.selectedTokenImage = token.imageUrl;
    // this.selectedTokenAddress = token.contractAddress;
    // this.selectedTokendecimals = token.decimals;
    this.closeTokenPopup();
  }

  openTokenBuyPopup(): void {
    this.popupService.openPopup('tokenChangeBuy');
  }

  closeTokenBuyPopup(): void {
    this.popupService.closePopup('tokenChangeBuy');
  }

  async onBuyTokenSelected(token: Token): Promise<void> {
    this.txData.set(undefined);
    this.selectedBuyToken.set(token);
    this.balanceBuy.set(Number(parseFloat(await this.walletBalanceService.getBalanceForToken(token)).toFixed(6)));
    // this.selectedBuyToken = token.symbol;
    // this.selectedBuyTokenImage = token.imageUrl;
    // this.selectedBuyTokenAddress = token.contractAddress;
    // this.selectedTokenBuydecimals = token.decimals;
    this.closeTokenBuyPopup();
    this.popupService.closeAllPopups();
  }

	get showSettingsPopup(): boolean {
    return this.popupService.getCurrentPopup() === 'settings';
  }

  toggleSettingsPopup(): void {
    if (this.showSettingsPopup) {
      const settingsEl = document.querySelector('app-settings');
      if (settingsEl) {
        settingsEl.classList.add('closing');
      }
      document.body.classList.add('popup-closing');
      setTimeout(() => {
        this.popupService.closePopup('settings');
        document.body.classList.remove('popup-closing');
        if (settingsEl) {
          settingsEl.classList.remove('closing');
        }
      }, 300);
    } else {
      document.body.classList.add('popup-opening');
      this.popupService.openPopup('settings');
    }
  }

	onSlippageSave(value: string): void {
    if (value === "Auto")
    {
      // console.log("Slippate is Auto. Default value is 0.005 (0.5%)");
      this.slippage = 0.005;
    }
    else
    {
      const val = parseFloat(value.replace('%', ''));
      if (val > 49.9)
      {
          throw "Slippage is too high!";
      }
  
      this.slippage = val / 100;
      // console.log(`Slippage set: ${this.slippage}; (${val}%)`);
    }

    //this.showSettingsPopup = false;
  }

  async swap() {
    this.loading.set(true);

    this.buttonState = 'wallet';
    this.showPendingNotification = false;
    this.showSuccessNotification = false;
    this.showFailedNotification = false;
    this.cdr.detectChanges();
  
    let txHash: string = "";
    try
    {
      if (this.blockchainStateService.network()?.id === NetworkId.SOLANA_MAINNET) 
      {
        txHash = await this.svmSwap();
      } 
      else 
      {
        txHash = await this.evmSwap();
      }
    }
    catch (error:any)
    {
      this.showFailedNotification = true;
      
      this.loading.set(false);
      //// console.log(error);

      this.cdr.detectChanges();
      setTimeout(() => {
        this.showSuccessNotification = false;
        this.showFailedNotification = false;
        this.cdr.detectChanges();
      }, 5000);

      this.buttonState = 'swap';

      return;
    }
    
    const finalStatus = await this.transactionsService.pollStatus(txHash);
    
    this.showPendingNotification = false;
    if (finalStatus.status === 'DONE') {
      this.showSuccessNotification = true;
    } else {
      this.showFailedNotification = true;
    }
    this.cdr.detectChanges();

    setTimeout(() => {
      this.showSuccessNotification = false;
      this.showFailedNotification = false;
      this.cdr.detectChanges();
    }, 5000);
    
    try
    {
      this.balance.set(Number((parseFloat(await this.walletBalanceService.getBalanceForToken(this.selectedToken()!)))));
      this.balanceBuy.set(Number((parseFloat(await this.walletBalanceService.getBalanceForToken(this.selectedBuyToken()!)))));
    }
    catch (error) 
    {
      // console.log("error setting balance",error);
    }

    this.loading.set(false);
  }

  async svmSwap(): Promise<string> {
    const txData = this.txData(); 
    if (!txData) {
      throw new Error("missing data transaction");
    }
    const provider = this.blockchainStateService.getCurrentProvider().provider;
  
    const txHash = await provider.sendTx(txData);
    
    this.showPendingNotification = true;
    this.buttonState = 'swap';

    // console.log("SVM Swap транзакция отправлена:", txHash);
    return txHash.signature;
  }

  async evmSwap(): Promise<string>{
    const provider = this.blockchainStateService.getCurrentProvider().provider;

    const signer = await provider.signer;

    const fromToken = this.selectedToken()!.contractAddress;
    if(fromToken === ethers.ZeroAddress){
      const txHash = await provider.sendTx(this.txData());
      this.showPendingNotification = true;
      this.buttonState = 'swap';
      return txHash;
    }

    const erc20Contract = new ethers.Contract(
      fromToken,
      [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)"
      ],
      signer
    );

    //const fromAddress = this.blockchainStateService.walletAddress()!;
    const fromTokenDecimals = this.selectedToken()!.decimals;
    const amount = this.transactionsService.toNonExponential(this.validatedSellAmount());
    const approveAmount = parseUnits(amount, fromTokenDecimals)

    // const allowance = await erc20Contract["allowance"](fromAddress, this.txData()?.to);
    // // console.log("allowance",allowance);

    const approveTx = await erc20Contract["approve"]((this.txData() as TransactionRequestEVM).to, approveAmount);
    
    // console.log("a");

    await approveTx.wait();

    // console.log("Approve успешно выполнен:", approveTx.hash);

    const txHash = await provider.sendTx(this.txData(), true);
    
    this.showPendingNotification = true;
    this.buttonState = 'swap';

    // console.log("txHash",txHash);
    return txHash;
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  test(){
    this.transactionsService.runTest().subscribe({
      next: (response) => {
        // console.log('Quote:', response.quote);
        // console.log('Simulation Result:', response.simulationResult);
      },
      error: (error) => {
        console.error('Ошибка запроса:', error);
      }
    });
  }

  getTxData() {
    this.buttonState = 'finding';
    const fromChain = this.blockchainStateService.network()!.id.toString();
    const toChain = this.blockchainStateService.network()!.id.toString();
    const fromTokenDecimals = this.selectedToken()!.decimals;
    // console.log("this.validatedSellAmount()",this.validatedSellAmount());
    const formattedFromAmount = this.transactionsService.toNonExponential(this.validatedSellAmount());
    // console.log(formattedFromAmount,formattedFromAmount);
    const fromAmount = parseUnits(formattedFromAmount, fromTokenDecimals);
    const fromToken = this.selectedToken()!.contractAddress;
    const toToken = this.selectedBuyToken()!.contractAddress;
    const toTokenDecimals = this.selectedBuyToken()!.decimals;
    let fromAddress = '';
    if(!this.blockchainStateService.walletAddress())
    {
      if(fromToken !== ethers.ZeroAddress)
      {
        fromAddress = fromToken;
      }
      else
      {
        fromAddress = toToken;
      }
    }
    else
    {
      fromAddress = this.blockchainStateService.walletAddress()!;
    }
    const adjustedFromAmount = fromAmount.toString();

    // console.log("fromChain",fromChain);
  
    if (!fromChain || !toChain || !fromAddress || !fromAmount || !fromToken || !toToken || !fromTokenDecimals) {
      // console.log("fromChain",fromChain);
      // console.log("toChain",toChain);
      // console.log("fromAddress",fromAddress);
      // console.log("fromAmount",fromAmount);
      // console.log("fromToken",fromToken);
      // console.log("toToken",toToken);
      // console.log("fromTokenDecimals",fromTokenDecimals);
      
      // console.log("adjusted From Amount",adjustedFromAmount);

      console.error('Missing required parameters');
      return;
    }
    
    // console.log("fromAddress",fromAddress);

    const slippageValue = this.slippage !== 0.005 ? this.slippage: undefined; // 0.005 is default for LIFI

    this.transactionsService.getQuote(fromChain, toChain, fromToken, toToken, adjustedFromAmount, fromAddress, slippageValue)
    .subscribe({
      next: (response: any) => {
        // console.log('Quote received:', response);
        if (response.estimate && response.transactionRequest) 
        {
          // console.log(`fromUSD: ${response.estimate.fromAmountUSD}; toUSD: ${response.estimate.toAmountUSD}`);
          this.updateSellPriceUsd(response.estimate.fromAmountUSD);
          this.updateBuyPriceUsd(response.estimate.toAmountUSD);

          const toAmountNumber = Number(this.transactionsService.parseToAmount(response.estimate.toAmount, Number(toTokenDecimals)));
          const readableToAmount = toAmountNumber.toFixed(Number(toTokenDecimals)).replace(/\.?0+$/, '');
          // console.log('readableToAmount:', readableToAmount);
          this.updateBuyAmount(readableToAmount);
          
          // if(this.blockchainStateService.network()!.id == NetworkId.SOLANA_MAINNET) // SVM
          // {
          //   gasPriceUSD = response.estimate.gasCosts?.[0]?.amountUSD;
          // }
          // else // EVM
          // {
          //   const gasPriceHex = response.transactionRequest.gasPrice;
          //   const gasLimitHex = response.transactionRequest.gasLimit;
          //   const gasToken = response.estimate.gasCosts?.[0]?.token;
          //   gasPriceUSD = this.transactionsService.parseGasPriceUSD(gasPriceHex, gasLimitHex, gasToken);
          // }

          const gasPriceUSD = response.estimate.gasCosts?.[0]?.amountUSD;

          this.gasPriceUSD = Number(gasPriceUSD);
          
          // console.log('gasPriceUSD:', this.gasPriceUSD);

          const fromDecimal = parseFloat(
            this.transactionsService.parseToAmount(response.estimate.fromAmount, Number(fromTokenDecimals))
          );
          const toDecimal = parseFloat(
            this.transactionsService.parseToAmount(response.estimate.toAmount, Number(toTokenDecimals))
          );

          if (fromDecimal > 0)
          {
            const ratio = toDecimal / fromDecimal;
            this.price.set(Number(ratio.toFixed(3)));

            const ratioUsd = Number(response.estimate.toAmountUSD) / fromDecimal;
            this.priceUsd = Number(ratioUsd.toFixed(3));
          }
        }
        else 
        {
          console.error("Missing estimate or transactionRequest in response.");
        }

        if(response.transactionRequest.data)
        {
          if(this.blockchainStateService.network()?.id === NetworkId.SOLANA_MAINNET)
          {
            this.txData.set(response.transactionRequest as TransactionRequestSVM);
            this.buttonState = 'swap';  
          }
          else
          {
            this.txData.set(response.transactionRequest as TransactionRequestEVM);
            this.buttonState = 'swap';
            if(fromToken !== ethers.ZeroAddress){
              // console.log("this.buttonState = 'approve'");
              this.buttonState = 'approve';
            }
          }
        }
        
      },
      error: (error: HttpErrorResponse) => {
        if(error.error.message === 'No available quotes for the requested transfer' || error.error.statusCode === 422){
          this.buttonState = 'no-available-quotes';
        }
        else if (error.status === 404) {
          console.error('Custom error message:', error || 'Unknown error');
          console.error('Custom error message:', error.error?.message || 'Unknown error');
        } else {
          console.error('Unexpected error:', error);
        }
      },
      complete: () => {
        // console.log('Quote request completed');
        if(!this.blockchainStateService.walletAddress())
        {
          this.buttonState = 'insufficient';
        }
        else if (this.validatedSellAmount() > this.balance()) {
          this.buttonState = 'insufficient';
          return;
        }
      }
    });

  }

  isSwapButtonActive(): boolean {
    return !!(this.sellAmount && Number(this.sellAmount) > 0);
  }

  isWalletConnected(): boolean {
    return this.blockchainStateService.connected();
  }

  openConnectWalletPopup(): void {
    if (!this.blockchainStateService.connected()) {
      this.popupService.openPopup('connectWallet');
    }
  }

  closeConnectWalletPopup(): void {
    this.popupService.closePopup('connectWallet');
  }

  

  get showConnectWalletPopup(): boolean {
    return this.popupService.getCurrentPopup() === 'connectWallet';
  }

  closeSuccessNotification(): void {
    this.showSuccessNotification = false;
  }

  closeFailedNotification(): void {
    this.showFailedNotification = false;
  }

  closePendingNotification(): void {
    this.showPendingNotification = false;
  }

  truncateTo6Decimals(value: number): number {
    return Math.trunc(value * 1e6) / 1e6;
  }

  /**
   * Animates text
   * @param element HTML element for animation
   * @param finalText result
   * @param elementId unique id of element
   */
  animateText(element: HTMLElement, finalText: string, elementId: string): void {
    const originalText = finalText;
    
    if (this.animationTimeouts[elementId]) {
      window.clearTimeout(this.animationTimeouts[elementId]);
      delete this.animationTimeouts[elementId];
    }
    
    let frame = 0;
    const totalFrames = this.animationFrames;
    
    const glitchStates = Array(finalText.length).fill(false);
    const resolvedChars = Array(finalText.length).fill(false);
    
    const animate = () => {
      if (frame >= totalFrames) {
        element.textContent = originalText;
        delete this.animationTimeouts[elementId];
        return;
      }
      
      let result = '';
      const progress = frame / totalFrames;
      
      const easedProgress = Math.pow(progress, 0.6);
      
      const resolvedCount = Math.floor(finalText.length * easedProgress);
      
      for (let i = 0; i < resolvedCount; i++) {
        if (!resolvedChars[i]) {
          resolvedChars[i] = true;
        }
      }
      
      if (frame % 2 === 0) {
        const glitchProbability = 0.05 + (progress * 0.1);
        for (let i = 0; i < finalText.length; i++) {
          if (Math.random() < glitchProbability) {
            glitchStates[i] = !glitchStates[i];
          }
        }
      }
      
      for (let i = 0; i < finalText.length; i++) {
        if (resolvedChars[i]) {
          if (glitchStates[i] && frame < totalFrames * 0.95 && finalText[i] !== ' ') {
            if (Math.random() < 0.3) {
              const cyberIndex = Math.floor(Math.random() * this.cyberChars.length);
              result += this.cyberChars[cyberIndex];
            } else {
              const glitchIndex = Math.floor(Math.random() * this.glitchChars.length);
              result += this.glitchChars[glitchIndex];
            }
          } else {
            if (progress > 0.9) {
              result += finalText[i];
            } else {
              result += finalText[i];
            }
          }
        } else {
          if (finalText[i] === ' ') {
            result += ' ';
          } else {
            const rand = Math.random();
            if (rand < 0.2) {
              const glitchIndex = Math.floor(Math.random() * this.glitchChars.length);
              result += this.glitchChars[glitchIndex];
            } else if (rand < 0.4) {
              const cyberIndex = Math.floor(Math.random() * this.cyberChars.length);
              result += this.cyberChars[cyberIndex];
            } else {
              const randomIndex = Math.floor(Math.random() * this.possibleChars.length);
              result += this.possibleChars[randomIndex];
            }
          }
        }
      }
      
      element.textContent = result;
      frame++;
      
      let currentSpeed = this.animationSpeed;
      if (progress < 0.3) {
        currentSpeed = this.animationSpeed * 0.8;
      } else if (progress > 0.7) {
        currentSpeed = this.animationSpeed * 0.7;
      } else {
        currentSpeed = this.animationSpeed * 1.2;
      }
      
      this.animationTimeouts[elementId] = window.setTimeout(animate, currentSpeed);
    };
    
    animate();
  }

  private checkAndAnimateBuyText() {
    if (this.buyAmountTextElement && 
        !this.buyAmountTextAnimated && 
        this.selectedBuyToken()?.symbol && 
        this.validatedSellAmount() > 0 &&
        this.buyAmountForInput()) {
        const finalText = `${this.buyAmountForInput()}`;
        this.animateText(this.buyAmountTextElement.nativeElement, finalText, 'buyAmountText');
        this.buyAmountTextAnimated = true;
    }
  }

  ngAfterViewChecked() {
    this.checkAndAnimateBuyText();
  }

  adjustFontSize(inputElement: HTMLInputElement): void {
    const textLength = inputElement.value.length;
    const width = window.innerWidth;
    
    if (width >= 1601 && width <= 1920) {
      // 1601-1920px
      if (textLength > 15) {
        this.inputFontSize.set(18);
      } else if (textLength > 12) {
        this.inputFontSize.set(22);
      } else if (textLength > 10) {
        this.inputFontSize.set(26);
      } else if (textLength > 8) {
        this.inputFontSize.set(30);
      } else {
        this.inputFontSize.set(36);
      }
    } else if (width >= 1171 && width <= 1600) {
      // 1171-1600px
      if (textLength > 15) {
        this.inputFontSize.set(18);
      } else if (textLength > 12) {
        this.inputFontSize.set(22);
      } else if (textLength > 10) {
        this.inputFontSize.set(26);
      } else if (textLength > 8) {
        this.inputFontSize.set(30);
      } else {
        this.inputFontSize.set(36);
      }
    } else if (width >= 971 && width <= 1170) {
      // 971-1170px
      if (textLength > 15) {
        this.inputFontSize.set(13);
      } else if (textLength > 12) {
        this.inputFontSize.set(16);
      } else if (textLength > 10) {
        this.inputFontSize.set(20);
      } else if (textLength > 8) {
        this.inputFontSize.set(22);
      } else {
        this.inputFontSize.set(26);
      }
    } else if (width >= 480 && width <= 970) {
      // 480-970px
      if (textLength > 15) {
        this.inputFontSize.set(18);
      } else if (textLength > 12) {
        this.inputFontSize.set(22);
      } else if (textLength > 10) {
        this.inputFontSize.set(26);
      } else if (textLength > 8) {
        this.inputFontSize.set(30);
      } else {
        this.inputFontSize.set(36);
      }
    } else if (width >= 360 && width <= 479) {
      // 360-479px
      if (textLength > 15) {
        this.inputFontSize.set(18);
      } else if (textLength > 12) {
        this.inputFontSize.set(22);
      } else if (textLength > 10) {
        this.inputFontSize.set(26);
      } else if (textLength > 8) {
        this.inputFontSize.set(30);
      } else {
        this.inputFontSize.set(36);
      }
    } else {
      // default
      if (textLength > 15) {
        this.inputFontSize.set(24);
      } else if (textLength > 12) {
        this.inputFontSize.set(28);
      } else if (textLength > 10) {
        this.inputFontSize.set(32);
      } else if (textLength > 8) {
        this.inputFontSize.set(38);
      } else {
        this.inputFontSize.set(48);
      }
    }
  }

  resetFontSize(): void {
    this.inputFontSize.set(this.defaultFontSizeByScreenWidth());
  }

  private defaultFontSizeByScreenWidth(): number {
    const width = window.innerWidth;
    
    if (width >= 1601 && width <= 1920) {
      return 36; // 1601-1920px
    } else if (width >= 1171 && width <= 1600) {
      return 36; // 1171-1600px
    } else if (width >= 971 && width <= 1170) {
      return 26; // 971-1170px
    } else if (width >= 480 && width <= 970) {
      return 36; // 480-970px
    } else if (width >= 360 && width <= 479) {
      return 36; // 360-479px
    } else {
      return 48; // default
    }
  }
}

