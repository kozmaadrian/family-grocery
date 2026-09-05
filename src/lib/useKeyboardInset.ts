import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/**
 * Height (px) currently covered by the on-screen keyboard, via the
 * VisualViewport API. 0 when no keyboard / unsupported.
 */
export function useKeyboardInset(): Ref<number> {
  const inset = ref(0);
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;

  function update() {
    if (!vv) return;
    const covered = window.innerHeight - vv.height - vv.offsetTop;
    inset.value = covered > 40 ? covered : 0;
  }

  onMounted(() => {
    if (!vv) return;
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  });
  onUnmounted(() => {
    if (!vv) return;
    vv.removeEventListener('resize', update);
    vv.removeEventListener('scroll', update);
  });

  return inset;
}
