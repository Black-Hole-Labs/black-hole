import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-app-content',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-content">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./app-content.component.scss']
})
export class AppContentComponent {}
