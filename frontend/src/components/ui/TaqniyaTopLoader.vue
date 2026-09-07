<script setup lang="ts">
import { useRouteLoader } from '../../composables/useRouteLoader';

const { isLoading, progress } = useRouteLoader();
</script>

<template>
  <div
    v-if="isLoading"
    class="fixed top-0 left-0 right-0 z-[99999] h-[3px] bg-transparent pointer-events-none"
  >
    <div
      class="h-full bg-gradient-to-r from-purple-600 via-bx-primary to-indigo-400 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(109,40,217,0.7)]"
      :style="{ width: `${progress}%` }"
    ></div>
  </div>
</template>
