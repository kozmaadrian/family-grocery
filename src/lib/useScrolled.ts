import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/** Reactive flag: has the window scrolled past `threshold` px. */
export function useScrolled(threshold = 8): Ref<boolean> {
  const scrolled = ref(false);
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      scrolled.value = window.scrollY > threshold;
      ticking = false;
    });
  }

  onMounted(() => {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  });
  onUnmounted(() => window.removeEventListener('scroll', onScroll));

  return scrolled;
}
