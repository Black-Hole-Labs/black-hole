import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [CommonModule],
})
export class SettingsComponent {
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<string>();

  options: string[] = ['Auto', '0.1%', '0.5%'];
  selectedIndex: number | null = 0; // Индекс выбранной кнопки
  customValue: string = ''; // Значение для кастомного ввода

  constructor(private popupService: PopupService) {}

  onOpen(): void {
    this.popupService.openPopup('settings');
  }

  onClose(): void {
    this.popupService.closePopup('settings');
    this.close.emit();
  }

  closePopup(): void {
    this.popupService.closePopup('settings');
    this.close.emit();
  }

  // Метод выбора кнопки
  selectOption(index: number): void {
    this.selectedIndex = index;
    this.customValue = ''; // Сбрасываем кастомное значение
  }

	restrictInput(event: KeyboardEvent): void {
		const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', '.', ','];
	
		// Разрешить цифры и некоторые управляющие клавиши
		if (
			(event.key >= '0' && event.key <= '9') || 
			allowedKeys.includes(event.key)
		) {
			return; // Разрешённый ввод
		}
	
		// Блокируем остальные символы
		event.preventDefault();
	}
	
	onCustomInput(event: Event): void {
		const inputElement = event.target as HTMLInputElement;
		let value = inputElement.value;
	
		// Заменяем ',' на '.'
		value = value.replace(/,/g, '.');
	
		// Если ввод начинается с точки, добавляем 0 перед ней
		if (value.startsWith('.')) {
			value = '0' + value;
		}
	
		// Удаляем все символы, кроме цифр и точки
		value = value.replace(/[^0-9.]/g, '');
	
		// Удаляем лишние точки, оставляя только одну
		const firstDotIndex = value.indexOf('.');
		if (firstDotIndex !== -1) {
			value =
				value.slice(0, firstDotIndex + 1) +
				value.slice(firstDotIndex + 1).replace(/\./g, '');
		}
	
		// Ограничиваем длину до 4 символов
		value = value.slice(0, 4);
	
		// Присваиваем значение обратно
		this.customValue = value;
	}
	
	
	selectCustom(): void {
		this.selectedIndex = null; // Убираем выделение с кнопок
	}
	
	saveValue(): void {
    if (this.selectedIndex !== null) {
      this.save.emit(this.options[this.selectedIndex]);
    } else if (this.customValue) {
      this.save.emit(this.customValue + '%');
    }
    this.popupService.closePopup('settings');
    this.close.emit();
  }
}
