import { ref } from 'vue';

const isLoading = ref(false);
const progress = ref(0);
let progressTimer: any = null;

export function useRouteLoader() {
  function start() {
    isLoading.value = true;
    progress.value = 15;
    clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      if (progress.value < 85) {
        progress.value += Math.random() * 12;
      }
    }, 120);
  }

  function finish() {
    clearInterval(progressTimer);
    progress.value = 100;
    setTimeout(() => {
      isLoading.value = false;
      progress.value = 0;
    }, 250);
  }

  function error() {
    clearInterval(progressTimer);
    progress.value = 100;
    setTimeout(() => {
      isLoading.value = false;
      progress.value = 0;
    }, 400);
  }

  return {
    isLoading,
    progress,
    start,
    finish,
    error,
  };
}
