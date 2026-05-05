"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

const UI_SCALE = 0.9;

interface DraggableWindowProps {
  id: string;
  label: string;
  visible: boolean;
  defaultPosition: { x: number; y: number };
  className?: string;
  onClose: () => void;
  children: ReactNode;
}

function clampPosition(x: number, y: number, width: number, height: number): { x: number; y: number } {
  const viewportWidth = window.innerWidth / UI_SCALE;
  const viewportHeight = window.innerHeight / UI_SCALE;
  const clampedX = Math.max(0, Math.min(viewportWidth - width, x));
  const clampedY = Math.max(0, Math.min(viewportHeight - height, y));
  return { x: clampedX, y: clampedY };
}

export function DraggableWindow({
  id,
  label,
  visible,
  defaultPosition,
  className,
  onClose,
  children
}: DraggableWindowProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPosition(defaultPosition);
  }, [defaultPosition.x, defaultPosition.y]);

  useEffect(() => {
    if (!visible || !rootRef.current) return;
    const width = rootRef.current.offsetWidth;
    const height = rootRef.current.offsetHeight;
    setPosition((prev) => clampPosition(prev.x, prev.y, width, height));
  }, [visible]);

  useEffect(() => {
    const onResize = () => {
      if (!rootRef.current) return;
      const width = rootRef.current.offsetWidth;
      const height = rootRef.current.offsetHeight;
      setPosition((prev) => clampPosition(prev.x, prev.y, width, height));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const width = rootRef.current?.offsetWidth ?? 280;
      const height = rootRef.current?.offsetHeight ?? 160;
      const next = clampPosition(event.clientX / UI_SCALE - offset.x, event.clientY / UI_SCALE - offset.y, width, height);
      setPosition(next);
    };

    const onUp = () => {
      setDragging(false);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, offset.x, offset.y]);

  if (!visible) return null;

  return (
    <section
      id={id}
      ref={rootRef}
      className={`floating-panel draggable-window ${className ?? ""}`}
      style={{ left: position.x, top: position.y }}
    >
      <header
        className="drag-handle"
        onPointerDown={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("button")) return;
          setDragging(true);
          setOffset({
            x: event.clientX / UI_SCALE - position.x,
            y: event.clientY / UI_SCALE - position.y
          });
        }}
      >
        <span>{label}</span>
        <button className="window-close" onClick={onClose} aria-label={`Close ${label}`}>
          ×
        </button>
      </header>
      <div className="window-body">{children}</div>
    </section>
  );
}
