# Shared project domain

Registered parent domain: `phoenixreborn.tech`.

Use a separate subdomain for each project. Each subdomain can point to a different hosting provider without requiring a second domain purchase.

| Intended address | Project | Status |
| --- | --- | --- |
| phoenixreborn.tech | Project directory / personal brand | Proposed |
| flowpoint.phoenixreborn.tech | Flow Point | Proposed |
| signal.phoenixreborn.tech | Signal | Proposed |
| outsideclass.phoenixreborn.tech | OutsideClass | Proposed |

Do not change existing projects' canonical URLs until their deployments and OAuth callback requirements have been checked. This document records a naming plan, not applied DNS records.

For Flow Point, first deploy the app. Add its intended hostname to the hosting provider, use the provider's exact returned DNS target, then verify DNS and HTTPS. Do not guess CNAME targets or replace nameservers unnecessarily. Preserve unrelated DNS and email records.

The contest describes publishing the project on a Hacktoberfest-claimed .tech domain. Subdomain eligibility is not explicitly resolved in that description. Confirm eligibility before claiming the category.
