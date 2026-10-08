# Architecture rules

- Keep payment-provider credentials and checkout-session creation in authenticated edge functions; the browser should receive only a validated hosted checkout URL to protect partner credentials.