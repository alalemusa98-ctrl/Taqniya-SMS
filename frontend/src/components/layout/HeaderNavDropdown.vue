<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { ChevronDown, ChevronLeft } from 'lucide-vue-next';

export interface NavDropdownItem {
  label: string;
  to: string;
  description: string;
  icon: any;
  badge?: string;
}

const props = defineProps<{
  id: string;
  title: string;
  icon: any;
  items: NavDropdownItem[];
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'close'): void;
}>();

const route = useRoute();

const isGroupActive = computed(() => {
  return props.items.some(
    (item) => route.path === item.to || route.path.startsWith(item.to + '/')
  );
});

const isItemActive = (to: string) => {
  return route.path === to || route.path.startsWith(to + '/');
};

const handleTriggerClick = (e: MouseEvent) => {
  e.stopPropagation();
  emit('toggle');
};

const handleItemClick = () => {
  emit('close');
};
</script>

<template>
  <div class="relative nav-dropdown-container">
    <!-- Trigger Capsule Button (Standard Taqniya Capsule) -->
    <button
      type="button"
      @click="handleTriggerClick"
      class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none border shadow-xs"
      :class="[
        isGroupActive
          ? 'bg-bx-primary text-white border-bx-primary shadow-md shadow-bx-primary/30 font-black hover:bg-bx-primary-hover'
          : isOpen
          ? 'bg-purple-500/15 text-bx-title border-bx-primary/60 ring-2 ring-bx-primary/20 dark:bg-purple-900/30'
          : 'bg-transparent text-bx-muted border-transparent hover:text-bx-title hover:bg-[var(--bx-pill)] hover:border-[#B4AED8]/40 dark:hover:border-white/10 hover:scale-[1.02] active:scale-[0.98]'
      ]"
      :aria-expanded="isOpen"
    >
      <component :is="icon" class="w-4 h-4 shrink-0 stroke-[2.2]" />
      <span>{{ title }}</span>
      <ChevronDown
        class="w-3.5 h-3.5 shrink-0 transition-transform duration-250 ease-out"
        :class="[
          isOpen ? 'rotate-180' : '',
          isGroupActive ? 'text-white/80' : 'text-bx-muted'
        ]"
      />
    </button>

    <!-- Floating Dropdown Panel (Spatial UI - 100% Solid, Elevated, Circular 50% Icons) -->
    <Transition
      enter-active-class="transition duration-200 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="transform scale-95 opacity-0 -translate-y-2"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-2"
    >
      <div
        v-if="isOpen"
        @click.stop
        class="absolute top-full mt-2.5 start-0 w-[330px] z-[80] p-2 rounded-[22px] border border-[#B4AED8] dark:border-white/20 bg-white dark:bg-[#1E1F31] shadow-2xl shadow-purple-950/20 dark:shadow-black/80 ring-1 ring-black/5 dark:ring-white/10 space-y-1 text-start"
      >
        <!-- Category Section Header -->
        <div class="px-3 pt-2 pb-1.5 flex items-center justify-between border-b border-[#B4AED8]/30 dark:border-white/[0.08] mb-1">
          <span class="text-[11px] font-black text-bx-primary font-display flex items-center gap-1.5">
            <component :is="icon" class="w-3.5 h-3.5 stroke-[2.2]" />
            <span>{{ title }}</span>
          </span>
          <span class="text-[10px] font-mono text-bx-muted font-bold bg-purple-500/10 px-2 py-0.5 rounded-full">
            {{ items.length }} وجهات
          </span>
        </div>

        <!-- Dropdown Items List -->
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          @click="handleItemClick"
          class="flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-150 group cursor-pointer border border-transparent"
          :class="[
            isItemActive(item.to)
              ? 'bg-purple-500/10 dark:bg-purple-500/25 border-purple-500/20 text-bx-primary'
              : 'hover:bg-purple-500/[0.06] dark:hover:bg-white/[0.05] hover:border-[#B4AED8]/30 dark:hover:border-white/10 text-bx-title'
          ]"
        >
          <!-- Circular Icon Container with 50% border-radius (rounded-full) as explicitly requested -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 border shadow-xs group-hover:scale-110"
            style="border-radius: 50% !important;"
            :class="[
              isItemActive(item.to)
                ? 'bg-bx-primary text-white border-bx-primary shadow-sm shadow-bx-primary/30'
                : 'bg-purple-500/10 dark:bg-white/[0.08] text-bx-primary dark:text-purple-300 border-purple-500/25 dark:border-white/15 group-hover:bg-bx-primary group-hover:text-white group-hover:border-bx-primary'
            ]"
          >
            <component :is="item.icon" class="w-4 h-4 stroke-[2.2]" />
          </div>

          <!-- Title and Description -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-1.5">
              <span
                class="text-xs leading-tight truncate"
                :class="[
                  isItemActive(item.to)
                    ? 'font-black text-bx-primary'
                    : 'font-bold text-bx-title group-hover:text-bx-primary transition-colors'
                ]"
              >
                {{ item.label }}
              </span>
              <span
                v-if="item.badge"
                class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shrink-0 font-mono"
              >
                {{ item.badge }}
              </span>
            </div>
            <p class="text-[11px] text-bx-muted font-medium leading-relaxed mt-0.5 line-clamp-1">
              {{ item.description }}
            </p>
          </div>

          <!-- Left Navigation Indicator Arrow (in RTL) -->
          <ChevronLeft
            class="w-4 h-4 text-bx-muted/40 transition-all duration-200 group-hover:text-bx-primary group-hover:-translate-x-1 shrink-0"
            :class="{ 'text-bx-primary opacity-100': isItemActive(item.to) }"
          />
        </RouterLink>
      </div>
    </Transition>
  </div>
</template>
