import { useEffect, useRef } from "react";

export function LabRemote() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const mountCounter = (await import("lab/Counter")).default;
      if (ref.current) {
        cleanup = mountCounter(ref.current);
      }
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  return <div ref={ref} />;
}
