<template>
  <svg 
    class="icon" 
    :class="[`icon-${name}`, sizeClass]" 
    :style="style"
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    <!-- Navigation Icons -->
    <template v-if="name === 'dashboard'">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </template>
    <template v-else-if="name === 'contract'">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </template>
    <template v-else-if="name === 'records'">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </template>
    <template v-else-if="name === 'progress'">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </template>
    <template v-else-if="name === 'process'">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6"/>
      <path d="M21 12h-6m-6 0H3"/>
    </template>
    <template v-else-if="name === 'product'">
      <path d="m7.5 4.27 9 5.15"/>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/>
      <path d="M12 22V12"/>
    </template>
    <template v-else-if="name === 'employee'">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </template>
    <template v-else-if="name === 'wechat'">
      <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.57 2.78 4.67L4 17l2.5-1.5c.89.31 1.87.5 2.91.5A5.98 5.98 0 0 1 9 10.22"/>
      <path d="M15.5 8c.97 0 1.87.18 2.67.5L20.5 7l-.61-2.33C21.19 3.57 22.22 1.98 22 10c0 2.21-2.07 4-4.5 4"/>
      <path d="M11 14c.56.56 1.45 1 2.45 1h.1c1.78 0 3.22-1.23 3.22-2.75 0-1.52-1.44-2.75-3.22-2.75"/>
    </template>
    <template v-else-if="name === 'permission'">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </template>
    <template v-else-if="name === 'summary'">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </template>
    <template v-else-if="name === 'performance'">
      <path d="M12 20v-6M6 20V10M18 20V4"/>
    </template>
    
    <!-- UI Icons -->
    <template v-else-if="name === 'menu'">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </template>
    <template v-else-if="name === 'bell'">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </template>
    <template v-else-if="name === 'help'">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </template>
    <template v-else-if="name === 'user'">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </template>
    <template v-else-if="name === 'settings'">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </template>
    <template v-else-if="name === 'chevron-down'">
      <polyline points="6 9 12 15 18 9"/>
    </template>
    <template v-else-if="name === 'chevron-up'">
      <polyline points="18 15 12 9 6 15"/>
    </template>
    <template v-else-if="name === 'chevron-left'">
      <polyline points="15 18 9 12 15 6"/>
    </template>
    <template v-else-if="name === 'chevron-right'">
      <polyline points="9 18 15 12 9 6"/>
    </template>
    <template v-else-if="name === 'close'">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </template>
    <template v-else-if="name === 'plus'">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </template>
    <template v-else-if="name === 'trash'">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </template>
    <template v-else-if="name === 'eye'">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </template>
    <template v-else-if="name === 'eye-off'">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </template>
    <template v-else-if="name === 'check'">
      <polyline points="20 6 9 17 4 12"/>
    </template>
    <template v-else-if="name === 'refresh'">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </template>
    <template v-else-if="name === 'view'">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </template>
    <template v-else-if="name === 'lock'">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </template>
    <template v-else-if="name === 'unlock'">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </template>
    <template v-else-if="name === 'package'">
      <path d="m7.5 4.27 9 5.15"/>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/>
      <path d="M12 22V12"/>
    </template>
    <template v-else-if="name === 'file-text'">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </template>
    <template v-else-if="name === 'zap'">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </template>
    <template v-else-if="name === 'bar-chart'">
      <line x1="12" y1="20" x2="12" y2="10"/>
      <line x1="18" y1="20" x2="18" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="16"/>
    </template>
    <template v-else-if="name === 'alert-circle'">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </template>
    <template v-else-if="name === 'arrow-left'">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </template>
    <template v-else-if="name === 'arrow-right'">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </template>
    <template v-else-if="name === 'more-vertical'">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="5" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </template>
    <template v-else-if="name === 'filter'">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </template>
    <template v-else-if="name === 'download'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </template>
    <template v-else-if="name === 'upload'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </template>
    <template v-else-if="name === 'save'">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </template>
    <template v-else-if="name === 'printer'">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </template>
    <template v-else-if="name === 'mail'">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </template>
    <template v-else-if="name === 'phone'">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </template>
    <template v-else-if="name === 'home'">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </template>
    <template v-else-if="name === 'users'">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </template>
    <template v-else-if="name === 'truck'">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </template>
    <template v-else-if="name === 'dollar-sign'">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </template>
    <template v-else-if="name === 'trending-up'">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </template>
    <template v-else-if="name === 'activity'">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </template>
    <template v-else-if="name === 'layers'">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </template>
    <template v-else-if="name === 'grid'">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </template>
    <template v-else-if="name === 'list'">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </template>
    <template v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </template>
    <template v-else-if="name === 'warning'">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </template>
    <template v-else-if="name === 'success'">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </template>
    <template v-else-if="name === 'error'">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </template>
    
    <!-- Default: question mark -->
    <template v-else>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </template>
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 20
  },
  color: {
    type: String,
    default: 'currentColor'
  }
});

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'icon-sm';
  if (props.size === 'md') return 'icon-md';
  if (props.size === 'lg') return 'icon-lg';
  if (props.size === 'xl') return 'icon-xl';
  return '';
});

const style = computed(() => {
  const s = {};
  if (typeof props.size === 'number') {
    s.width = `${props.size}px`;
    s.height = `${props.size}px`;
  }
  if (props.color !== 'currentColor') {
    s.color = props.color;
  }
  return s;
});
</script>

<style scoped>
.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

.icon-sm {
  width: 16px;
  height: 16px;
}

.icon-md {
  width: 20px;
  height: 20px;
}

.icon-lg {
  width: 24px;
  height: 24px;
}

.icon-xl {
  width: 32px;
  height: 32px;
}
</style>
