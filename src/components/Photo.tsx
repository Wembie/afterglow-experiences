import { useState, type CSSProperties } from 'react';
import { assetUrl } from '../engine/assets';
import { useExperience } from '../engine/ExperienceContext';
import type { ImageAsset } from '../engine/schema';
import './photo.css';

interface Props {
  image: ImageAsset | undefined;
  className?: string;
  /** Forces eager loading (first visible photo). */
  eager?: boolean;
  /** Shown in the placeholder when there is no image. */
  label?: string;
  /** Decorative thumbnails hide alt text from assistive tech when a label exists elsewhere. */
  decorative?: boolean;
}

/**
 * A photograph that keeps its natural aspect ratio and focal point, reserves
 * space to avoid layout shift, and degrades to a designed placeholder.
 */
export function Photo({ image, className = '', eager = false, label, decorative = false }: Props) {
  const { experience, strings } = useExperience();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const src = image ? assetUrl(experience.slug, image.src) : null;
  const failed = src !== null && failedSrc === src;
  const loaded = src !== null && loadedSrc === src;

  if (!image || !src || failed) {
    return (
      <div
        className={`photo photo--missing ${className}`}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : (image?.alt ?? label ?? strings.missingPhoto)}
        aria-hidden={decorative || undefined}
        data-testid="photo-missing"
      >
        <svg viewBox="0 0 120 80" aria-hidden="true" className="photo__placeholder-art">
          <circle cx="86" cy="24" r="9" />
          <path d="M6 70 L40 38 L62 58 L78 46 L114 70" />
        </svg>
        <span className="photo__placeholder-text">{strings.missingPhoto}</span>
      </div>
    );
  }

  const style: CSSProperties = {
    objectPosition: image.focalPoint ? `${image.focalPoint.x}% ${image.focalPoint.y}%` : undefined,
    aspectRatio: image.width && image.height ? `${image.width} / ${image.height}` : undefined,
  };

  return (
    <img
      className={`photo ${loaded ? 'photo--loaded' : ''} ${className}`}
      src={src}
      alt={decorative ? '' : image.alt}
      width={image.width}
      height={image.height}
      loading={eager || image.priority === 'high' ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={image.priority === 'high' ? 'high' : undefined}
      style={style}
      ref={(el) => {
        // Cached images can finish before React attaches onLoad.
        if (el?.complete && el.naturalWidth > 0 && loadedSrc !== src) setLoadedSrc(src);
      }}
      onLoad={() => setLoadedSrc(src)}
      onError={() => setFailedSrc(src)}
      draggable={false}
    />
  );
}
