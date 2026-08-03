import { Routes } from '@angular/router';
import { Shell } from './layout/shell';
import { Dashboard } from './dashboard/dashboard';
import { Tickets } from './tickets/tickets';
import { Clients } from './clients/clients';
import { EventsList } from './events/events-list';
import { EventDetail } from './events/event-detail';
import { Reports } from './reports/reports';
import { Settings } from './settings/settings';
import { Login } from './login/login';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', component: Dashboard },
      { path: 'tickets', component: Tickets },
      { path: 'clients', component: Clients },
      { path: 'events', component: EventsList },
      { path: 'events/:id', component: EventDetail },
      { path: 'reports', component: Reports },
      { path: 'settings', component: Settings }
    ]
  }
];
