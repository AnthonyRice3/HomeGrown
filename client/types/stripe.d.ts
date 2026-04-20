// Global Stripe.js types — loaded via CDN <Script src="https://js.stripe.com/v3/" /> in layout.tsx
declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance;
  }
}

interface StripeInstance {
  elements: (opts: { clientSecret: string; appearance?: object }) => StripeElements;
  confirmPayment: (opts: {
    elements: StripeElements;
    confirmParams: { return_url: string };
    redirect?: "always" | "if_required";
  }) => Promise<{ error?: { message: string } }>;
}

interface StripeElements {
  create: (type: string) => StripeElement;
  submit: () => Promise<{ error?: { message: string } }>;
}

interface StripeElement {
  mount: (selector: string) => void;
  unmount: () => void;
  on: (event: string, handler: () => void) => void;
}

export {};
