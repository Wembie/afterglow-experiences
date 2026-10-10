import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useExperience } from '../engine/ExperienceContext';
import { format } from '../engine/strings';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { Photo } from './Photo';

const SWIPE_THRESHOLD = 48;

/** Photo gallery with buttons, arrow keys and horizontal swipe. */
export function Gallery({ photoIds, title }: { photoIds: string[]; title: string }) {
  const { getImage, strings } = useExperience();
  const [index, setIndex] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const total = photoIds.length;
  const current = Math.min(index, Math.max(total - 1, 0));
  const image = getImage(photoIds[current]);

  const go = (delta: number) => {
    if (total < 2) return;
    setIndex((i) => (i + delta + total) % total);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    // Only clearly horizontal gestures count, so vertical scrolling stays natural.
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const caption = image?.caption;

  return (
    <figure
      className="gallery"
      aria-roledescription="carousel"
      aria-label={title}
      onKeyDown={onKeyDown}
    >
      <div
        className="gallery__stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (start.current = null)}
      >
        <div key={current} className="gallery__frame">
          <Photo image={image} eager className="photo--graded gallery__photo" label={title} />
        </div>
        {total > 1 && (
          <>
            <button
              type="button"
              className="icon-btn gallery__nav gallery__nav--prev"
              onClick={() => go(-1)}
              aria-label={strings.previousPhoto}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="icon-btn gallery__nav gallery__nav--next"
              onClick={() => go(1)}
              aria-label={strings.nextPhoto}
            >
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>
      {(caption || total > 1) && (
        <figcaption className="gallery__caption">
          {caption && <span>{caption}</span>}
          {total > 1 && (
            <span className="gallery__count" aria-live="polite">
              {format(strings.photoOf, { current: current + 1, total })}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
