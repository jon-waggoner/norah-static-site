# Code for Norahs site

This site has two games you can play! Pick one from the menu when you visit the site.

- **Star Catcher** — Catch falling stars and puppies in a basket using your mouse!
- **Sky Pilot** — Fly a plane, dodge birds and buildings, and land on the runway!

## Deploying

The site is hosted on Cloudflare Pages. There is no build step — it's all static HTML, JS, and images.

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=norah-static-site
```

Custom domain is configured in the Cloudflare dashboard under Workers & Pages > norah-static-site > Custom domains.
