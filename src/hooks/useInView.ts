import { useEffect, useRef, useState } from 'react';

/**
 * True while the element crosses the middle band of the viewport. On touch
 * devices this replaces hover as the "approach" signal.
 */
export function useInView<T extends Element>(
  options: { rootMargin?: string; once?: boolean } = {},
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const { rootMargin = '-35% 0px -35% 0px', once = false } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  return [ref, inView];
}
