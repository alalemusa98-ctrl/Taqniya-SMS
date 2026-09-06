import { ref } from 'vue';

export interface ToastItem {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

const toasts = ref<ToastItem[]>([]);

export const useToast = () => {
  const add = (
    type: ToastItem['type'],
    message: string,
    title?: string,
    duration = 4000,
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastItem = { id, type, title, message, duration };
    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
    return id;
  };

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const success = (message: string, title = 'تمت العملية بنجاح', duration = 4000) =>
    add('success', message, title, duration);

  const danger = (message: string, title = 'خطأ في العملية', duration = 5000) =>
    add('danger', message, title, duration);

  const error = (message: string, title = 'خطأ في العملية', duration = 5000) =>
    danger(message, title, duration);

  const warning = (message: string, title = 'تنبيه', duration = 4500) =>
    add('warning', message, title, duration);

  const info = (message: string, title = 'إشعار', duration = 4000) =>
    add('info', message, title, duration);

  return {
    toasts,
    add,
    remove,
    success,
    danger,
    error,
    warning,
    info,
  };
};
