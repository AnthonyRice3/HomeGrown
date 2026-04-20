// Stripe.js types — CDN-loaded via <Script src="https://js.stripe.com/v3/" /> in layout.tsx

export interface StripeInstance {
  elements: (opts: { clientSecret: string; appearance?: object }) => StripeElements;
  confirmPayment: (opts: {
    elements: StripeElements;
    confirmParams: { return_url: string };
    redirect?: "always" | "if_required";
  }) => Promise<{ error?: { message: string } }>;
}

export interface StripeElements {
  create: (type: string) => StripeElement;
  submit: () => Promise<{ error?: { message: string } }>;
}

export interface StripeElement {
  mount: (selector: string) => void;
  unmount: () => void;
  on: (event: string, handler: () => void) => void;
}

declare global {
  interface Window {
    Stripe?: (key: string) => StripeInstance;
  }
}
