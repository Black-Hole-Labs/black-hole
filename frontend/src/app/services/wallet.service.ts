import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  private walletNameSubject = new BehaviorSubject<string>('');

  isConnected$ = this.isConnectedSubject.asObservable();
  walletName$ = this.walletNameSubject.asObservable();

  connect(walletName: string): void {
    this.isConnectedSubject.next(true);
    this.walletNameSubject.next(walletName);
  }

  disconnect(): void {
    this.isConnectedSubject.next(false);
    this.walletNameSubject.next('');
  }

  isConnected(): boolean {
    return this.isConnectedSubject.value;
  }

  getWalletName(): string {
    return this.walletNameSubject.value;
  }
}
