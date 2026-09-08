<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { ChevronDown } from 'lucide-vue-next';

export interface NavDropdownItem {
  label: string;
  to: string;
  description: string;
  icon: any;
  badge?: string;
}

const props = defineProps<{
  title: string;
  icon: any;
  items: NavDropdownItem[];
}>();

const route = useRoute();
const isOpen = ref(false);

const isGroupActive = computed(() => {
  return props.items.some(
    (item) => route.path === item.to || route.path.startsWith(item.to + '/')
  );
});

const closeDropdown = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="relative">
    <!-- Trigger Capsule Button -->
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none border border-transparent shadow-xs"
      :class="[
        isGroupActive
          ? 'bg-bx-primary text-white shadow-md shadow-bx-primary/25 font-black hover:bg-bx-primary-hover'
          : 'text-bx-muted hover:text-bx-title hover:bg-[var(--bx-pill)] hover:border-[#B4AED8]/30 dark:hover:border-white/10 hover:scale-[1.02] active:scale-[0.98]'
      ]"
    >
      <component :is="icon" class="w-4 h-4 shrink-0" />
      <span>{{ title }}</span>
      <ChevronDown
        class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
        :class="[
          isOpen ? 'rotate-180' : '',
          isGroupActive ? 'text-white/80' : 'text-bx-muted'
        ]"
      />
    </button>

    <!-- Overlay backdrop for click-outside dismissal -->
    <div
      v-if="isOpen"
      @click="closeDropdown"
      class="fixed inset-0 z-40"
    ></div>

    <!-- Floating Dropdown Panel (100% Solid Opaque Background with Premium Spatial Shadows) -->
    <div
      v-if="isOpen"
      class="absolute top-full mt-2.5 start-0 min-w-[320px] sm:min-w-[350px] z-[60] p-2.5 rounded-2xl border border-[#B4AED8] dark:border-white/20 bg-white dark:bg-[#24253B] shadow-2xl shadow-purple-950/20 dark:shadow-black/70 animate-in fade-in zoom-in-95 duration-150 space-y-1 text-start ring-1 ring-black/5 dark:ring-white/10"
    >
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        @click="closeDropdown"
        class="flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 group"
        :class="[
          route.path === item.to || route.path.startsWith(item.to + '/')
            ? 'bg-purple-500/10 dark:bg-purple-500/20 text-bx-primary'
            : 'hover:bg-purple-500/[0.05] dark:hover:bg-white/[0.04] text-bx-title'
        ]"
      >
        <!-- Icon Badge Container -->
        <div
          class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs"
          :class="[
            route.path === item.to || route.path.startsWith(item.to + '/')
              ? 'bg-bx-primary text-white shadow-sm shadow-bx-primary/30'
              : 'bg-purple-500/10 text-bx-primary dark:bg-white/10 dark:text-purple-300'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4" />
        </div>

        <!-- Text Block -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1.5">
            <span
              class="text-xs font-bold leading-tight truncate"
              :class="[
                route.path === item.to || route.path.startsWith(item.to + '/')
                  ? 'text-bx-primary font-black'
                  : 'text-bx-title group-hover:text-bx-primary transition-colors'
              ]"
            >
              {{ item.label }}
            </span>
            <span
              v-if="item.badge"
              class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shrink-0"
            >
              {{ item.badge }}
            </span>
          </div>
          <p class="text-[10.5px] text-bx-muted font-medium leading-relaxed mt-1">
            {{ item.description }}
          </p>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
