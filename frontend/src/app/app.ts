import { Component, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventsService } from './events.service';

@Component({
  selector: 'app-root',
  imports: [DatePipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  events = signal<any[]>([]);
  clients = signal<any[]>([]);
  tickets = signal<any[]>([]);

  availableTickets = computed(() =>
    this.tickets().filter(t => t.status === 'available')
  );

  selectedTicketId: number | null = null;
  selectedClientId: number | null = null;

  constructor(private eventsService: EventsService) {}

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
}