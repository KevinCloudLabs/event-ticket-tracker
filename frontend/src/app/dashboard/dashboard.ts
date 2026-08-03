import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventsService } from '../events.service';
import { AuthService } from '../auth.service';
import { ReportsService, ClientSpend, SpendOverTime } from '../reports.service';

interface SpendBar extends SpendOverTime {
  heightPct: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  events = signal<any[]>([]);
  clients = signal<any[]>([]);
  tickets = signal<any[]>([]);

  clientSpend = signal<ClientSpend[]>([]);
  spendOverTime = signal<SpendOverTime[]>([]);
  avgTicketValue = signal<number>(0);

  spendBars = computed<SpendBar[]>(() => {
    const data = this.spendOverTime();
    const max = Math.max(...data.map(d => Number(d.total_spend)), 1);
    return data.map(d => ({ ...d, heightPct: (Number(d.total_spend) / max) * 100 }));
  });

  availableTickets = computed(() =>
    this.tickets().filter(t => t.status === 'available')
  );

  selectedTicketId: number | null = null;
  selectedClientId: number | null = null;

  constructor(
    private eventsService: EventsService,
    private reportsService: ReportsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.eventsService.getEvents().subscribe({
      next: (data) => this.events.set(data),
      error: (err) => console.error('Error fetching events:', err)
    });

    this.eventsService.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error fetching clients:', err)
    });

    this.eventsService.getTickets().subscribe({
      next: (data) => this.tickets.set(data),
      error: (err) => console.error('Error fetching tickets:', err)
    });

    this.loadReports();
  }

  loadReports(): void {
    this.reportsService.getClientSpend().subscribe({
      next: (data) => this.clientSpend.set(data),
      error: (err) => console.error('Error fetching client spend:', err)
    });

    this.reportsService.getSpendOverTime().subscribe({
      next: (data) => this.spendOverTime.set(data),
      error: (err) => console.error('Error fetching spend over time:', err)
    });

    this.reportsService.getAvgTicketValue().subscribe({
      next: (data) => this.avgTicketValue.set(Number(data.avg_ticket_value)),
      error: (err) => console.error('Error fetching average ticket value:', err)
    });
  }

  eventName(eventId: number): string {
    const event = this.events().find(e => e.id === eventId);
    return event ? event.name : 'Unknown event';
  }

  clientName(clientId: number | null): string {
    if (!clientId) return '—';
    const client = this.clients().find(c => c.id === clientId);
    return client ? client.name : 'Unknown client';
  }

  assignTicket(): void {
    if (!this.selectedTicketId || !this.selectedClientId) return;

    this.eventsService.assignTicket(this.selectedTicketId, this.selectedClientId).subscribe({
      next: () => {
        alert('Ticket assigned successfully!');
        this.selectedTicketId = null;
        this.selectedClientId = null;
        this.loadAll();
      },
      error: (err) => {
        console.error('Error assigning ticket:', err);
        alert('Failed to assign ticket.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
