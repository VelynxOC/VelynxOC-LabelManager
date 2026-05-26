export type ToastLevel = 'info' | 'success' | 'error' | 'warn';

export function notify(message: string, level: ToastLevel = 'info') {
  try {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, level } }));
  } catch {}
}
