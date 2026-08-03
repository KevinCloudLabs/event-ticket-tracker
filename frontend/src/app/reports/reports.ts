import { Component, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ReportsService, ClientSpend, SpendOverTime } from '../reports.service';

interface SpendBar extends SpendOverTime {
  heightPct: number;
}

@Component({
  selector: 'app-reports',
  imports: [DecimalPipe, MatCardModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  clientSpend = signal<ClientSpend[]>([]);
  spendOverTime = signal<SpendOverTime[]>([]);
  avgTicketValue = signal<number>(0);

  totalSpend = computed(() =>
    this.clientSpend().reduce((sum, row) => sum + Number(row.total_spend), 0)
  );

  spendBars = computed<SpendBar[]>(() => {
    const data = this.spendOverTime();
    const max = Math.max(...data.map((d) => Number(d.total_spend)), 1);
    return data.map((d) => ({ ...d, heightPct: (Number(d.total_spend) / max) * 100 }));
  });

  constructor(private reportsService: ReportsService) {}

  ngOnInit(): void {
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
}
