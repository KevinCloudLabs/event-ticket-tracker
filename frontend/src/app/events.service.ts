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

  assignTicket(ticketId: number, clientId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/tickets/${ticketId}/assign`, { client_id: clientId });
  }
}