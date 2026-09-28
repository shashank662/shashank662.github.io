# Setting up the feedback form

The Feedback button works from day one: until these steps are done, Send opens a filled-in issue on GitHub's own
page (the visitor needs a GitHub account). After them, anyone can send feedback from the site, no account needed.

Everything below is done by the owner in Cloudflare and GitHub. No secret ever goes in the repo.

## 1. A GitHub token that can only write this repo's issues

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
2. Name it `portfolio-feedback`. Expiration: up to a year (put a reminder in your calendar to renew it).
3. Repository access: **Only select repositories** → `shashank662/shashank662.github.io`.
4. Permissions → Repository permissions → **Issues: Read and write**. Leave everything else at "No access".
5. Generate, and copy the token. You will paste it into Cloudflare in step 3 and nowhere else.

## 2. A Turnstile widget (Cloudflare's free check that a person is sending)

1. Cloudflare dashboard → **Turnstile** → Add widget.
2. Name: `portfolio-feedback`. Hostnames: `shashankhr.in` (this covers its subdomains, such as `www.shashankhr.in`),
   `shashank662.github.io`, and your Worker's `workers.dev` hostname. The Worker takes feedback from the same sites:
   `shashankhr.in` and any subdomain of it over https, GitHub Pages, and its own address (`worker/index.ts`).
3. Widget mode: **Managed**.
4. Copy the **site key** (public) and the **secret key** (private).

## 3. Give the Worker its two secrets

Cloudflare dashboard → Workers & Pages → `shashank662-portfolio` → Settings → Variables and Secrets → Add:

| Name | Type | Value |
| --- | --- | --- |
| `GITHUB_TOKEN` | Secret | the token from step 1 |
| `TURNSTILE_SECRET` | Secret | the secret key from step 2 |

## 4. Tell Claude two public values

- The Worker's address, e.g. `https://shashank662-portfolio.<your-account>.workers.dev` (Workers & Pages → the Worker → its `workers.dev` link).
- The Turnstile **site key** from step 2 (public by design).

They go into `src/data/feedback.ts`; after a deploy, the form sends straight to the Worker.

## Checking it works

Send a test note from the live site. An issue labelled `feedback` should appear in the repo within a few seconds,
and the form shows its link. Close the test issue afterwards.
