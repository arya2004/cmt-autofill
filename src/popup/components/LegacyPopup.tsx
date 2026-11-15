import { useEffect, useRef } from 'react';
import markup from '../legacy.html?raw';
import { initializeLegacyPopup } from '../legacy';

// React owns the host; the existing jQuery UI owns its children until item 3.
export function LegacyPopup() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    host.current.innerHTML = markup;
    return initializeLegacyPopup();
  }, []);
  return <div ref={host} />;
}
