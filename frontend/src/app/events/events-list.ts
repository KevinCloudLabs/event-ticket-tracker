import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EventsService } from '../events.service';

interface EventRow {
  id: number;
  name: string;
  venue: string | null;
  event_date: string | null;
  available: number;
  assigned: number;
  total: number;
}

@Component({
  selector: 'app-events-list',
  imports: [DatePipe, RouterLink, MatCardModule, MatIconModule],
  templateUrl: './events-list.html',
  styleUrl: './events-list.css'
})
export class EventsList implements OnInit {
  events = signal<any[]>([]);
  tickets = signal<any[]>([]);

  rows = computed<EventRow[]>(() =>
    this.events().map((e) => {
      const eventTickets = this.tickets().filter((t) => t.event_id === e.id);
      return {
        id: e.id,
        name: e.name,
        venue: e.venue,
        event_date: e.event_date,
        available: eventTickets.filter((t) => t.status === 'available').length,
        assigned: eventTickets.filter((t) => t.status === 'assigned').length,
        total: eventTickets.length
      };
    })
  );

  constructor(private eventsService: EventsService) {}

  ngOnInit(): void {
    this.eventsService.getEvents().subscribe({
      next: (data) => this.events.set(data),
      error: (err) => console.error('Error fetching events:', err)
    });

    this.eventsService.getTickets().subscribe({
      next: (data) => this.tickets.set(data),
      error: (err) => console.error('Error fetching tickets:', err)
    });
  }
}
