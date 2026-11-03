export type AccountType = 'checking' | 'savings';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
}

export interface BankAccount {
  _id: string;
  userId: string;
  iban: string;
  type: AccountType;
  label?: string;
  balanceCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewBankAccount {
  userId: string;
  iban: string;
  type: AccountType;
  label?: string;
  balanceCents: number;
}
