import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { EventsService } from '../events.service';

@Component({
  selector: 'app-event-detail',
  imports: [DatePipe, DecimalPipe, RouterLink, MatCardModule, MatIconModule, MatChipsModule],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css'
})
export class EventDetail implements OnInit {
  eventId = signal<number | null>(null);
  events = signal<any[]>([]);
  clients = signal<any[]>([]);
  tickets = signal<any[]>([]);

  event = computed(() => this.events().find((e) => e.id === this.eventId()) || null);
  eventTickets = computed(() => this.tickets().filter((t) => t.event_id === this.eventId()));
  availableCount = computed(() => this.eventTickets().filter((t) => t.status === 'available').length);
  assignedCount = computed(() => this.eventTickets().filter((t) => t.status === 'assigned').length);
  totalRevenue = computed(() =>
    this.eventTickets()
      .filter((t) => t.status === 'assigned')
      .reduce((sum, t) => sum + Number(t.price), 0)
  );

  assignedPct = computed(() => {
    const total = this.eventTickets().length;
    return total ? Math.round((this.assignedCount() / total) * 100) : 0;
  });

  donutOffset = computed(() => {
    const circumference = 2 * Math.PI * 52;
    return circumference - (this.assignedPct() / 100) * circumference;
  });

  constructor(private route: ActivatedRoute, private eventsService: EventsService) {}

  ngOnInit(): void {
    this.eventId.set(Number(this.route.snapshot.paramMap.get('id')));

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
  }

  clientName(clientId: number | null): string {
    if (!clientId) return '—';
    return this.clients().find((c) => c.id === clientId)?.name || 'Unknown client';
  }
}
