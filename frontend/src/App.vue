<script setup lang="ts">
import { RouterView } from 'vue-router';
import TaqniyaToast from './components/ui/TaqniyaToast.vue';
import TaqniyaTopLoader from './components/ui/TaqniyaTopLoader.vue';
</script>

<template>
  <TaqniyaTopLoader />
  <RouterView />
  <TaqniyaToast />
</template>

