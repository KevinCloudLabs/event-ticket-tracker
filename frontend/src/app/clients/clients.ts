import { Component, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { EventsService } from '../events.service';
import { ReportsService, ClientSpend } from '../reports.service';

interface ClientRow {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  ticketCount: number;
  totalSpend: number;
}

@Component({
  selector: 'app-clients',
  imports: [DecimalPipe, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, MatChipsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css'
})
export class Clients implements OnInit {
  clients = signal<any[]>([]);
  tickets = signal<any[]>([]);
  spend = signal<ClientSpend[]>([]);
  searchText = signal('');

  rows = computed<ClientRow[]>(() => {
    const search = this.searchText().trim().toLowerCase();

    return this.clients()
      .map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        email: c.email,
        ticketCount: this.tickets().filter((t) => t.client_id === c.id && t.status === 'assigned').length,
        totalSpend: Number(this.spend().find((s) => s.client_id === c.id)?.total_spend || 0)
      }))
      .filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search) ||
          (c.company || '').toLowerCase().includes(search) ||
          (c.email || '').toLowerCase().includes(search)
      )
      .sort((a, b) => b.totalSpend - a.totalSpend);
  });

  constructor(private eventsService: EventsService, private reportsService: ReportsService) {}

  ngOnInit(): void {
    this.eventsService.getClients().subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error fetching clients:', err)
    });

    this.eventsService.getTickets().subscribe({
      next: (data) => this.tickets.set(data),
      error: (err) => console.error('Error fetching tickets:', err)
    });

    this.reportsService.getClientSpend().subscribe({
      next: (data) => this.spend.set(data),
      error: (err) => console.error('Error fetching client spend:', err)
    });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
