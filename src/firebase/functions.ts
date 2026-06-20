import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseApp } from './app';

function requireFirebaseFunctions() {
  const app = getFirebaseApp();
  if (!app) throw new Error('error.firebase.notConfigured');
  return getFunctions(app);
}

export function callFirebaseFunction<TInput, TOutput>(name: string, input: TInput) {
  const callable = httpsCallable<TInput, TOutput>(requireFirebaseFunctions(), name);
  return callable(input).then((result) => result.data);
}
