import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BankAccount, NewBankAccount, NewUser, User } from './models';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${API_URL}/users`);
  }

  createUser(user: NewUser): Observable<User> {
    return this.http.post<User>(`${API_URL}/users`, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/users/${id}`);
  }

  getAccounts(userId: string): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(`${API_URL}/users/${userId}/accounts`);
  }

  createAccount(account: NewBankAccount): Observable<BankAccount> {
    return this.http.post<BankAccount>(`${API_URL}/accounts`, account);
  }

  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URL}/accounts/${id}`);
  }
}

// L'API répond { "message": "..." } en cas d'erreur
export function errorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'Erreur inattendue';
  }
  if (err.status === 0) {
    return "Impossible de joindre l'API (est-elle lancée sur le port 3000 ?)";
  }
  const body: unknown = err.error;
  if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
    return body.message;
  }
  return `Erreur ${err.status}`;
}
