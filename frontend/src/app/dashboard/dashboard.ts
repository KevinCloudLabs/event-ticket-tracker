import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { EventsService } from '../events.service';
import { ReportsService, SpendOverTime } from '../reports.service';

interface SpendBar extends SpendOverTime {
  heightPct: number;
}

interface ActivityItem {
  ticketId: number;
  eventName: string;
  clientName: string;
  price: number;
  purchasedAt: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, DecimalPipe, MatCardModule, MatChipsModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  events = signal<any[]>([]);
  clients = signal<any[]>([]);
  tickets = signal<any[]>([]);
  spendOverTime = signal<SpendOverTime[]>([]);
  avgTicketValue = signal<number>(0);

  totalRevenue = computed(() =>
    this.tickets()
      .filter((t) => t.status === 'assigned')
      .reduce((sum, t) => sum + Number(t.price), 0)
  );

  ticketsSold = computed(() => this.tickets().filter((t) => t.status === 'assigned').length);
  ticketsAvailable = computed(() => this.tickets().filter((t) => t.status === 'available').length);

  spendBars = computed<SpendBar[]>(() => {
    const data = this.spendOverTime();
    const max = Math.max(...data.map((d) => Number(d.total_spend)), 1);
    return data.map((d) => ({ ...d, heightPct: (Number(d.total_spend) / max) * 100 }));
  });

  activityFeed = computed<ActivityItem[]>(() => {
    const events = this.events();
    const clients = this.clients();

    return this.tickets()
      .filter((t) => t.status === 'assigned' && t.purchased_at)
      .map((t) => ({
        ticketId: t.id,
        eventName: events.find((e) => e.id === t.event_id)?.name || 'Unknown event',
        clientName: clients.find((c) => c.id === t.client_id)?.name || 'Unknown client',
        price: Number(t.price),
        purchasedAt: t.purchased_at
      }))
      .sort((a, b) => (a.purchasedAt < b.purchasedAt ? 1 : -1))
      .slice(0, 8);
  });

  constructor(private eventsService: EventsService, private reportsService: ReportsService) {}

  ngOnInit(): void {
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

    this.reportsService.getSpendOverTime().subscribe({
      next: (data) => this.spendOverTime.set(data),
      error: (err) => console.error('Error fetching spend over time:', err)
    });

    this.reportsService.getAvgTicketValue().subscribe({
      next: (data) => this.avgTicketValue.set(Number(data.avg_ticket_value)),
      error: (err) => console.error('Error fetching average ticket value:', err)
    });
  }
}
