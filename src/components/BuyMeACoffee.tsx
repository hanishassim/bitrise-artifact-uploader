import { useEffect, useRef } from 'react';
import { trackClickDonationLink } from '@/integrations/firebase';

interface BuyMeACoffeeButtonProps {
  className?: string;
}

export function BuyMeACoffeeButton({ className }: BuyMeACoffeeButtonProps) {
  return (
    <div className={className}>
      <a
        href="https://www.buymeacoffee.com/hanis"
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackClickDonationLink}
      >
        <img
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
          alt="Buy Me A Coffee"
          className="h-10 hover:opacity-80 transition-opacity"
        />
      </a>
    </div>
  );
}

export function useBuyMeACoffeeWidget() {
  const widgetLoaded = useRef(false);

  const showWidget = () => {
    // Prevent loading multiple times
    if (widgetLoaded.current) return;

    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', 'hanis');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', 'If this tool helped, you can buy me a coffee.');
    script.setAttribute('data-color', '#BD5FFF');
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '18');

    document.body.appendChild(script);
    widgetLoaded.current = true;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove widget elements if they exist
      const widget = document.getElementById('bmc-wbtn');
      if (widget) widget.remove();
      const widgetContainer = document.querySelector('.bmc-btn-container');
      if (widgetContainer) widgetContainer.remove();
    };
  }, []);

  return { showWidget };
}
