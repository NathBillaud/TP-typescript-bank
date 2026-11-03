import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, errorMessage } from './api.service';
import { AccountType, BankAccount, User } from './models';

const TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Compte courant',
  savings: 'Épargne',
};

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly typeLabels = TYPE_LABELS;
  protected readonly users = signal<User[]>([]);
  protected readonly loadingUsers = signal(false);
  protected readonly selectedUser = signal<User | null>(null);
  protected readonly accounts = signal<BankAccount[]>([]);
  protected readonly error = signal<string | null>(null);

  protected newUser = { firstName: '', lastName: '', email: '' };
  protected newAccount: { iban: string; type: AccountType; label: string; balanceEuros: number | null } = {
    iban: '',
    type: 'checking',
    label: '',
    balanceEuros: 0,
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loadingUsers.set(true);
    this.api.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loadingUsers.set(false);
      },
      error: (err: unknown) => {
        this.error.set(errorMessage(err));
        this.loadingUsers.set(false);
      },
    });
  }

  protected selectUser(user: User): void {
    this.selectedUser.set(user);
    this.accounts.set([]);
    this.error.set(null);
    this.api.getAccounts(user._id).subscribe({
      next: (accounts) => this.accounts.set(accounts),
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }

  protected addUser(): void {
    this.error.set(null);
    this.api.createUser(this.newUser).subscribe({
      next: () => {
        this.newUser = { firstName: '', lastName: '', email: '' };
        this.loadUsers();
      },
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }

  protected removeUser(user: User): void {
    if (!confirm(`Supprimer ${user.firstName} ${user.lastName} ?`)) {
      return;
    }
    this.error.set(null);
    this.api.deleteUser(user._id).subscribe({
      next: () => {
        if (this.selectedUser()?._id === user._id) {
          this.selectedUser.set(null);
          this.accounts.set([]);
        }
        this.loadUsers();
      },
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }

  protected addAccount(): void {
    const user = this.selectedUser();
    if (!user) {
      return;
    }
    this.error.set(null);
    const form = this.newAccount;
    this.api.createAccount({
      userId: user._id,
      iban: form.iban.replace(/\s/g, '').toUpperCase(),
      type: form.type,
      label: form.label.trim() || undefined,
      // L'API stocke des centimes : 100 € = 10000
      balanceCents: Math.round((form.balanceEuros ?? 0) * 100),
    }).subscribe({
      next: () => {
        this.newAccount = { iban: '', type: 'checking', label: '', balanceEuros: 0 };
        this.selectUser(user);
      },
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }

  protected removeAccount(account: BankAccount): void {
    if (!confirm('Supprimer ce compte ?')) {
      return;
    }
    this.error.set(null);
    this.api.deleteAccount(account._id).subscribe({
      next: () => this.accounts.update((list) => list.filter((a) => a._id !== account._id)),
      error: (err: unknown) => this.error.set(errorMessage(err)),
    });
  }

  protected formatEuros(cents: number): string {
    return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }
}
