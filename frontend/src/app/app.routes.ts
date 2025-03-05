import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TradeComponent } from './pages/trade/trade.component';
import { BridgeComponent } from './pages/bridge/bridge.component';
import { FunComponent } from './pages/fun/fun.component';
import { LaunchpadComponent } from './pages/launchpad/launchpad.component';
import { QuestsComponent } from './pages/quests/quests.component';
import { DocumentationPageComponent } from './components/documentation/documentation-page/documentation-page.component';
import { documentationRoutes } from './components/documentation/documentation.routes';

export const routes: Routes = [
  { path: 'trade', component: TradeComponent },
  { path: 'bridge', component: BridgeComponent },
  { path: 'fun', component: FunComponent },
  { path: 'launchpad', component: LaunchpadComponent },
  { path: 'quests', component: QuestsComponent },
  { path: '', redirectTo: '/trade', pathMatch: 'full' },
  {
    path: 'documentation',
    component: DocumentationPageComponent,
    children: documentationRoutes,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
