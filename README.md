# austinzentz.com

Personal site. React Router 8 (framework mode) on Cloudflare Workers, with posts in Cloudflare D1 and images in Cloudflare R2.

- `/` — bio (edit [`content/about.md`](content/about.md)), recent writing, sandbox demos
- `/posts`, `/posts/:slug` — writing, rendered from Markdown on the server
- `/sandbox/*` — small demos that keep their data in the visitor's browser (see `app/sandbox/`)
- `/admin` — write and edit posts behind Cloudflare Access, in a rich-text editor ([MDXEditor](https://mdxeditor.dev)) that saves Markdown. Paste, drop or use the toolbar to upload images (PNG, JPEG, GIF, WebP; 10 MB max). The toolbar's source and diff views show the raw Markdown and your unsaved changes. The editor only loads on admin pages; readers get server-rendered HTML.
- `/media/*` — uploaded images, served from R2 with long cache headers
- `/rss.xml`, `/sitemap.xml`, `/robots.txt`; `/contact` redirects to `/`

## Local development

```sh
npm install
npm run db:migrate:local   # create the posts table in the local D1 database
npm run db:seed:local      # import the archived posts from content/archive/
npm run dev                # http://localhost:5173 — /admin is open in dev
```

`npm run typecheck` runs the type checker; `npm run preview` serves a production build locally (where `/admin` is locked, like production).

Locally, D1 and R2 are simulated in `.wrangler/state`, so nothing you do in dev touches production.

### Adding a sandbox demo

1. Create `app/sandbox/<slug>/route.tsx` (copy `staffing-budget/` as a starting point). Use `useLocalState` for anything the visitor changes, and use fictional data only.
2. Register it in `app/routes.ts` and `app/sandbox/registry.ts`.

## Deploying

Costs: Workers, D1, R2 and Access are within Cloudflare's free tiers for a site this size. The domain is the only cost (Cloudflare Registrar charges the registry's price).

### 1. Create the Worker and database

```sh
npx wrangler login
npx wrangler d1 create portfolio      # copy the database_id into wrangler.jsonc
npx wrangler r2 bucket create portfolio-media
npm run db:migrate:remote
npm run db:seed:remote
npm run deploy                        # prints a *.workers.dev URL to check
```

### 2. Move DNS from Namecheap to Cloudflare (keep email working!)

1. Cloudflare dashboard → **Add a domain** → `austinzentz.com` → Free plan. Cloudflare scans and imports the existing records.
2. **Before changing nameservers,** compare the imported records against Namecheap's _Advanced DNS_ page, line by line. The iCloud Mail records must all be there:
   - `MX` records for `@` (iCloud's are `mx01.mail.icloud.com` and `mx02.mail.icloud.com`)
   - `TXT` for `@` containing `apple-domain=…` and the SPF record `v=spf1 include:icloud.com ~all`
   - `CNAME` `sig1._domainkey` → `sig1.dkim.austinzentz.com.at.icloudmailadmin.com` (DKIM)
   - Any `_dmarc` TXT record

   Copy whatever Namecheap actually has; the list above is what Apple usually asks for, not a substitute for checking.

3. Delete the old Vercel records (`A` → `76.76.21.21`, `CNAME` → `cname.vercel-dns.com`) and the old Amazon SES records for `mail.austinzentz.com` (the contact form is gone).
4. At Namecheap → Domain → **Nameservers** → _Custom DNS_ → the two Cloudflare nameservers. Wait for Cloudflare to show the domain as **Active**, then send yourself a test email.

### 3. Point the domain at the Worker

Uncomment `routes` and `workers_dev` in `wrangler.jsonc`, then `npm run deploy`. `www` redirects to the bare domain.

### 4. Lock down /admin with Cloudflare Access

1. Cloudflare dashboard → **Zero Trust** (pick a team name; the Free plan covers up to 50 users).
2. **Access → Applications → Add → Self-hosted.** Add two destinations: domain `austinzentz.com` with path `admin`, and domain `austinzentz.com` with path `admin.data`. The second one covers the data requests React Router makes when you click a link back to `/admin`; without it, those requests skip Access and the app answers 403. Policy: _Allow_, rule _Emails_ = your address. Login method: _One-time PIN_ (or add GitHub/Google as an identity provider).
3. Copy the application's **AUD tag**. In `wrangler.jsonc` set `ACCESS_TEAM_DOMAIN` to `<team>.cloudflareaccess.com` and `ACCESS_AUD` to the tag, then `npm run deploy`.

The app also verifies Access's signed JWT on every `/admin` request, and refuses everyone if those two values are missing.

### 5. Transfer the registration (optional, after DNS is settled)

Namecheap → unlock the domain and get the auth code → Cloudflare dashboard → **Domain Registration → Transfer**. The transfer adds a year to the registration at Cloudflare's price.

### 6. Clean up

Delete the Vercel project, and in AWS delete the SES identity and the SMTP credentials used by the old contact form.
