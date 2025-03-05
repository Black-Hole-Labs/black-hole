import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bridge-tx',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bridge-tx.component.html',
  styleUrl: './bridge-tx.component.scss'
})
export class BridgeTxComponent implements OnInit {
  @Input() selectedNetwork: string = '';
  @Input() selectedNetworkImage: string = '';
  @Input() selectedNetworkTo: string = '';
  @Input() selectedNetworkToImage: string = '';
  @Input() selectedToken: { symbol: string; imageUrl: string } = { symbol: '', imageUrl: '' };
  @Input() inputAmount: string = '';
  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    console.log('BridgeTx initialized with amount:', this.inputAmount); // Добавим для отладки
  }

  closePopup(): void {
    this.close.emit();
  }
}
