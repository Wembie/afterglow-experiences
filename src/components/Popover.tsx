import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface Props {
  label: string;
  icon: ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
}

/** Disclosure button + non-modal panel. Escape or an outside click closes it. */
export function Popover({ label, icon, children, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`popover ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
      </button>
      <div id={panelId} className="popover__panel" hidden={!open}>
        {open && children(() => setOpen(false))}
      </div>
    </div>
  );
}
