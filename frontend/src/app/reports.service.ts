import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClientSpend {
  client_id: number;
  client_name: string;
  total_spend: string;
}

export interface SpendOverTime {
  month: string;
  total_spend: string;
}

export interface AvgTicketValue {
  avg_ticket_value: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = '/api/reports';

  constructor(private http: HttpClient) {}

  getClientSpend(): Observable<ClientSpend[]> {
    return this.http.get<ClientSpend[]>(`${this.apiUrl}/client-spend`);
  }

  getSpendOverTime(): Observable<SpendOverTime[]> {
    return this.http.get<SpendOverTime[]>(`${this.apiUrl}/spend-over-time`);
  }

  getAvgTicketValue(): Observable<AvgTicketValue> {
    return this.http.get<AvgTicketValue>(`${this.apiUrl}/avg-ticket-value`);
  }
}
