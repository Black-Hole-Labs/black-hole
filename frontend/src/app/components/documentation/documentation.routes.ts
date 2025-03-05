import { Routes } from '@angular/router';
import { IntroductionComponent } from './introduction/introduction.component';
import { HyperstructureComponent } from './hyperstructure/hyperstructure.component';
import { ValuableComponent } from './valuable/valuable.component';
import { TermsofuseComponent } from './termsofuse/termsofuse.component';
import { PrivacypolicyComponent } from './privacypolicy/privacypolicy.component';

export const documentationRoutes: Routes = [
  { path: 'introduction', component: IntroductionComponent },
  { path: 'hyperstructure', component: HyperstructureComponent },
  { path: 'valuable', component: ValuableComponent },
  { path: 'termsofuse', component: TermsofuseComponent },
  { path: 'privacypolicy', component: PrivacypolicyComponent },
  { path: '', redirectTo: 'introduction', pathMatch: 'full' },
];
