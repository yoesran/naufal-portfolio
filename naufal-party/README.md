# naufal-party

The **realtime server** of a polyglot microfrontend portfolio — a tiny [PartyKit](https://docs.partykit.io/) WebSocket relay that powers the multiplayer-cursor presence block. On connect it assigns each visitor a colour + friendly name (returned to that visitor as a `welcome` message — the client shows it as their own cursor tag); on a cursor message it broadcasts the normalized position (tagged `host`/`remote` and `mouse`/`touch` — touch positions render as fingertip trails, not arrows) to everyone else; on a `burst` message (a tap/click firework) it broadcasts the position in the sender's colour; on disconnect it broadcasts `leave`. The federated `Presence` component in `naufal-lab` opens its own socket to it, so cursors are shared across both deployments.

**Stack:** PartyKit (Cloudflare-owned) · TypeScript.

`npm run dev` runs it locally on `127.0.0.1:1999`; `npx partykit deploy` ships it to the managed `*.partykit.dev` runtime. See the project docs in [`../docs`](../docs) — [`../docs/features.md`](../docs/features.md) for the realtime architecture, [`../docs/deployment.md`](../docs/deployment.md) for the deploy.
