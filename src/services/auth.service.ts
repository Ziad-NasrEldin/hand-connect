import type { AuthService, RegisterCustomerInput, RegisterProviderInput } from './contracts/auth.contract';
import { getDataSource } from './data-source';
import * as demo from './demo/auth.demo';
import { firebaseAuthService } from './firebase/auth.firebase';

export type { AuthSession, RegisterCustomerInput, RegisterProviderInput } from './contracts/auth.contract';

const demoAuthService: AuthService = demo;

function authService(): AuthService {
  return getDataSource() === 'firebase' ? firebaseAuthService : demoAuthService;
}

export async function getCurrentSession() {
  return authService().getCurrentSession();
}

export function subscribeToSession(onSession: (session: Awaited<ReturnType<typeof getCurrentSession>>) => void) {
  return authService().subscribeToSession(onSession);
}

export async function login(email: string, password: string) {
  return authService().login(email, password);
}

export async function loginWithGoogle() {
  return authService().loginWithGoogle();
}

export async function logout() {
  return authService().logout();
}

export async function registerCustomer(input: RegisterCustomerInput) {
  return authService().registerCustomer(input);
}

export async function registerProvider(input: RegisterProviderInput) {
  return authService().registerProvider(input);
}
