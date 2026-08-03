import { Component, OnInit, ViewChild, AfterViewInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { EventsService } from '../events.service';

interface TicketRow {
  id: number;
  event_id: number;
  client_id: number | null;
  status: string;
  price: number;
  ticket_type: string;
  purchased_at: string | null;
  eventName: string;
  clientName: string;
}

@Component({
  selector: 'app-tickets',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css'
})
export class Tickets implements OnInit, AfterViewInit {
  displayedColumns = ['select', 'id', 'event', 'client', 'status', 'ticket_type', 'price', 'purchased_at', 'actions'];
  dataSource = new MatTableDataSource<TicketRow>([]);
  selection = new SelectionModel<TicketRow>(true, []);

  events = signal<any[]>([]);
  clients = signal<any[]>([]);

  statusFilter = signal<string>('all');
  searchText = '';
  rowAssignClient = new Map<number, number | null>();
  bulkAssignClientId: number | null = null;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  selectedAvailableCount = computed(() =>
    this.selection.selected.filter((row) => row.status === 'available').length
  );

  constructor(private eventsService: EventsService, private snackBar: MatSnackBar) {
    this.dataSource.filterPredicate = (row, filter) => {
      const search = JSON.parse(filter);
      const matchesText =
        !search.text ||
        row.eventName.toLowerCase().includes(search.text) ||
        row.clientName.toLowerCase().includes(search.text) ||
        row.ticket_type.toLowerCase().includes(search.text);
      const matchesStatus = search.status === 'all' || row.status === search.status;
      return matchesText && matchesStatus;
    };
  }

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadAll(): void {
    this.eventsService.getEvents().subscribe({
      next: (data) => {
        this.events.set(data);
        this.rebuildRows();
      },
      error: (err) => console.error('Error fetching events:', err)
    });

    this.eventsService.getClients().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.rebuildRows();
      },
      error: (err) => console.error('Error fetching clients:', err)
    });

    this.eventsService.getTickets().subscribe({
      next: (data) => {
        this.rawTickets = data;
        this.rebuildRows();
      },
      error: (err) => console.error('Error fetching tickets:', err)
    });
  }

  private rawTickets: any[] = [];

  private rebuildRows(): void {
    if (!this.rawTickets.length && !this.events().length) return;

    const rows: TicketRow[] = this.rawTickets.map((t) => ({
      ...t,
      price: Number(t.price),
      eventName: this.events().find((e) => e.id === t.event_id)?.name || 'Unknown event',
      clientName: this.clients().find((c) => c.id === t.client_id)?.name || '—'
    }));

    this.dataSource.data = rows;
  }

  applyFilter(): void {
    this.dataSource.filter = JSON.stringify({
      text: this.searchText.trim().toLowerCase(),
      status: this.statusFilter()
    });
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.applyFilter();
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.filteredData.length && this.dataSource.filteredData.length > 0;
  }

  toggleAll(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource.filteredData);
    }
  }

  assignRow(row: TicketRow): void {
    const clientId = this.rowAssignClient.get(row.id);
    if (!clientId) {
      this.snackBar.open('Choose a client first', 'Dismiss', { duration: 3000 });
      return;
    }

    this.eventsService.assignTicket(row.id, clientId).subscribe({
      next: () => {
        this.snackBar.open('Ticket assigned', 'Dismiss', { duration: 3000 });
        this.selection.deselect(row);
        this.loadAll();
      },
      error: () => this.snackBar.open('Failed to assign ticket', 'Dismiss', { duration: 3000 })
    });
  }

  bulkAssign(): void {
    if (!this.bulkAssignClientId) {
      this.snackBar.open('Choose a client for the bulk assignment', 'Dismiss', { duration: 3000 });
      return;
    }

    const targets = this.selection.selected.filter((row) => row.status === 'available');
    if (targets.length === 0) {
      this.snackBar.open('Select at least one available ticket', 'Dismiss', { duration: 3000 });
      return;
    }

    let remaining = targets.length;
    targets.forEach((row) => {
      this.eventsService.assignTicket(row.id, this.bulkAssignClientId!).subscribe({
        next: () => {
          remaining -= 1;
          if (remaining === 0) {
            this.snackBar.open(`Assigned ${targets.length} ticket(s)`, 'Dismiss', { duration: 3000 });
            this.selection.clear();
            this.bulkAssignClientId = null;
            this.loadAll();
          }
        },
        error: () => this.snackBar.open('One or more assignments failed', 'Dismiss', { duration: 3000 })
      });
    });
  }
}
