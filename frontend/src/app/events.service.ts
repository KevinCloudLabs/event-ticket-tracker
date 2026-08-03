import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  getEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/events`);
  }

  getClients(): Observable<any> {
    return this.http.get(`${this.apiUrl}/clients`);
  }

  getTickets(): Observable<any> {
    return this.http.get(`${this.apiUrl}/tickets`);
  }

  assignTicket(ticketId: number, clientId: number, ticketType?: string): Observable<any> {
    const body: any = { client_id: clientId };
    if (ticketType) {
      body.ticket_type = ticketType;
    }
    return this.http.put(`${this.apiUrl}/tickets/${ticketId}/assign`, body);
  }
}
