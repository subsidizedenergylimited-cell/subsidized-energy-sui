# Frontend

The Subsidized Energy dApp — a Next.js app using Sui dApp Kit.

## What it does

- Connect a Sui wallet and register as a producer
- View your `$SUB` daily certificates and `$SRE` balance
- **Verify a certificate** — pull the original reading from Walrus using the on-chain proof ID and confirm it matches. This is the core demo: trust the math, not the backend.

## Planned structure

```
frontend/
├── src/
│   ├── app/         # Next.js routes
│   ├── components/  # wallet connect, certificate list, verify view
│   └── lib/         # Sui + Walrus client helpers
├── package.json
└── next.config.js
```

## Getting started

```bash
npm install
npm run dev
```

Built with [`@mysten/dapp-kit`](https://sdk.mystenlabs.com/dapp-kit).
