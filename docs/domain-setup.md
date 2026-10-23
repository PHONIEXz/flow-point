# Connecting Flow Point to the shared domain

## What each part does

- `phoenixreborn.tech` is the registered parent domain.
- `flowpoint` is the subdomain label for this project.
- Render hosts the website files.
- DNS tells browsers where that subdomain should go.
- HTTPS encrypts the browser connection; Render manages the website certificate after domain verification.

Think: domain = address, hosting = building, DNS = directions.

## 1. Deploy the working app

Connect Render to `PHONIEXz/flow-point`. The current `render.yaml` describes a Node Web Service, not the earlier static preview.

| Setting | Value |
| --- | --- |
| Service name | `flow-point-app` |
| Runtime | Node |
| Branch | `main` |
| Build command | `npm ci && npm test && npm run build` |
| Start command | `npm start` |
| Health-check path | `/healthz` |
| Secret environment variable | `GEMINI_API_KEY` |
| Model variable | `GEMMA_MODEL=gemma-4-26b-a4b-it` |

Set the key privately in Render, never in the repository or browser code. Keep an older static preview running until the Node service works. Changing the Blueprint does not itself prove the service type was migrated.

Wait for a live deployment, open the exact Render URL it returns, and test `/workspace`. Verify a novel live Gemma request and a downloaded pack before connecting the domain.

## 2. Tell Render the public address

In the created service, open Settings > Custom Domains and add:

`flowpoint.phoenixreborn.tech`

Render will display the hostname/DNS instructions for that exact service. Retain them. Do not guess a hostname based on the project name.

## 3. Add the DNS direction

Open the DNS settings for `phoenixreborn.tech` at the domain provider. First inspect existing records for `flowpoint`. If one exists, resolve the conflict instead of blindly creating a duplicate.

| DNS field | Intended value | Meaning |
| --- | --- | --- |
| Type | `CNAME` | This name points to another hostname. |
| Host / Name | `flowpoint` | Creates `flowpoint.phoenixreborn.tech`; some providers require the complete name. |
| Target / Value | Exact hostname returned by Render | The actual destination of this website. |
| TTL | Provider default | How long DNS answers may be cached. |

The target is a hostname, without `https://` or a URL path. Follow the provider's field format. Preserve the root domain, other projects and email records. A new subdomain generally does not require changing nameservers. If a conflicting record exists for this exact subdomain, review that record before changing it.

## 4. Verify the connection

Return to Render and verify the custom domain. DNS changes can take time to reach different resolvers. Wait for Render's certificate to be issued, then open `https://flowpoint.phoenixreborn.tech` and verify that the expected site appears without certificate warnings.

## Current state

The Node app is live at https://flow-point-app.onrender.com/workspace and the live desktop generation/review/export workflow has passed.

The user signed in to the .tech dashboard. Existing CNAME, A and AAAA sections showed no records before the change. Created and verified this entry in the dashboard:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| CNAME | flowpoint | flow-point-app.onrender.com | Auto |

Custom-domain setup is complete. On 21 October 2026, after the user completed the Render domain step, https://flowpoint.phoenixreborn.tech/workspace loaded the expected Flow Point workspace over HTTPS without a certificate warning. An HTTPS GET to /healthz returned HTTP 200 with {"status":"ok"}, using normal certificate validation. The Render dashboard's domain/certificate status labels were not separately observed; the public HTTPS checks establish that the custom address serves the app. The original onrender.com address remains available.

Draft storage is scoped to the browser origin. Drafts saved at the onrender.com address do not automatically appear at the custom domain.

## Official references

- https://render.com/docs/static-sites
- https://render.com/docs/custom-domains
- https://render.com/docs/configure-other-dns
