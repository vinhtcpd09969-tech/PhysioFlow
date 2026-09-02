import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToAnchor() {
  const { hash, pathname, search } = useLocation();

  useEffect(() => {
    if (hash) {
      // Find element by hash selector
      const element = document.querySelector(hash);
      if (element) {
        // Small delay to ensure route transitions/DOM are complete
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      const params = new URLSearchParams(search);
      const hasFocusTarget = params.has('appointmentId') || params.has('treatmentId') || params.has('triggerFocus');
      if (!hasFocusTarget) {
        // Scroll to top on standard page navigation
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [hash, pathname, search]);

  return null;
}
