import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DocumentationHeaderComponent } from '../documentation-header/documentation-header.component';
import { DocumentationFooterComponent } from '../documentation-footer/documentation-footer.component';
import { ClosePopupsDirective } from '../../../directives/close-popups.directive';

@Component({
  selector: 'app-documentation-page',
  standalone: true,
  templateUrl: './documentation-page.component.html',
  styleUrls: ['./documentation-page.component.scss'],
  imports: [
    RouterModule,
		CommonModule,
    DocumentationHeaderComponent,
    DocumentationFooterComponent,
  ],
	hostDirectives: [ClosePopupsDirective]
})
export class DocumentationPageComponent implements OnInit, OnDestroy {
  ngOnInit() {
    document.body.classList.add('documentation-page');
  }

  ngOnDestroy() {
    document.body.classList.remove('documentation-page');
  }
}
