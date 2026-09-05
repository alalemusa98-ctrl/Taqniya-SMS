import { ref } from 'vue';

const isDark = ref(
  localStorage.getItem('taqniya_theme') === 'dark' ||
    (!localStorage.getItem('taqniya_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
);

const applyTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('taqniya_theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('taqniya_theme', 'light');
  }
};

// Initialize immediately
applyTheme();

export const useTheme = () => {
  const toggleTheme = () => {
    isDark.value = !isDark.value;
    applyTheme();
  };

  return {
    isDark,
    toggleTheme,
  };
};
