# Deployment

AFTERGLOW builds to a fully static site (HTML, JS, CSS, images). It runs on GitHub
Pages for free: no backend, no database, no secrets in the browser.

## Choosing the public URL

Every deployment decides its own address, e.g. `https://wembie.github.io/mejoramigaisa`
instead of `https://wembie.github.io/afterglow-experiences`.

There are two halves to that, and both must agree:

1. **The build must know its path** — set `AFTERGLOW_SITE_URL` (or `AFTERGLOW_BASE_PATH`).
   Vite then prefixes every asset with `/mejoramigaisa/`.
2. **GitHub Pages must serve the files at that path.** Pages serves:
   - a _user site_ repository (`<owner>/<owner>.github.io`) at `/`,
   - every other repository at `/<repository-name>/`,
     on the user's Pages domain: `<owner>.github.io` by default (e.g.
     `https://wembie.github.io/mejoramigaisa/`), or a custom domain if one is configured
     on the user site (then `https://<custom-domain>/mejoramigaisa/`).

An environment variable alone cannot change where GitHub serves a repository. So the
workflow publishes each deployment _to the place that matches its path_:

| Want                                     | Profile settings                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| `wembie.github.io/mejoramigaisa`         | `PAGES_TARGET_REPO=Wembie/mejoramigaisa` (an empty repo named like the path)  |
| `wembie.github.io/mejoramigaisa` (alt.)  | `PAGES_TARGET_REPO=Wembie/Wembie.github.io`, `PAGES_TARGET_DIR=mejoramigaisa` |
| `wembie.github.io/afterglow-experiences` | no `PAGES_TARGET_REPO` (published from this repository)                       |

`node scripts/profile.mjs check <profile>` (also run in CI) fails when the URL and the
target disagree, before anything is published.

## Deployment profiles

A profile is a small public file, `deployments/<name>.env`:

```ini
AFTERGLOW_SITE_URL=https://wembie.github.io/mejoramigaisa
AFTERGLOW_EXPERIENCES=isa
AFTERGLOW_SITE_TITLE=Un universo propio
AFTERGLOW_SITE_DESCRIPTION=Cada recuerdo deja un poquito de luz.
PAGES_TARGET_REPO=Wembie/mejoramigaisa
PAGES_TARGET_BRANCH=gh-pages
```

Only `AFTERGLOW_*` and `PAGES_TARGET_{REPO,BRANCH,DIR}` keys are accepted; anything that
looks like a secret is rejected. Files starting with `_` are ignored
(`deployments/_template.env` documents every option).

| Variable                       | Meaning                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `AFTERGLOW_SITE_URL`           | Public address. Its path becomes the base path. Used for social metadata.                |
| `AFTERGLOW_BASE_PATH`          | Explicit base path (`mejoramigaisa`, `/a/b/`, `/`). Wins over the URL's path.            |
| `AFTERGLOW_EXPERIENCES`        | Comma-separated experience slugs to bundle. Default: all. Others are not emitted at all. |
| `AFTERGLOW_DEFAULT_EXPERIENCE` | Experience opened at the site root. Default: the only bundled one, if there is one.      |
| `AFTERGLOW_SITE_TITLE`         | `<title>` and link-preview title.                                                        |
| `AFTERGLOW_SITE_DESCRIPTION`   | Meta / link-preview description.                                                         |
| `AFTERGLOW_OG_IMAGE`           | Share image, relative to the site root or absolute URL. Default `og-image.png`.          |
| `AFTERGLOW_THEME_COLOR`        | Browser UI colour.                                                                       |
| `PAGES_TARGET_REPO`            | `owner/name` to publish to. Unset = this repository.                                     |
| `PAGES_TARGET_BRANCH`          | Branch in the target repository. Default `gh-pages`.                                     |
| `PAGES_TARGET_DIR`             | Sub-folder inside the target (for publishing into a user site). Other files are kept.    |

With no base path at all the build uses a relative base (`./`), which works under any
path thanks to hash routing — handy for previews, less precise for link previews.

## One-time setup for `wembie.github.io/mejoramigaisa`

1. **Domain** — nothing to do: project repositories are served at
   `https://wembie.github.io/<repo-name>/`. _(Optional: if you configure a custom domain
   such as `example.com` on `Wembie/Wembie.github.io`, every project repository moves to
   `https://example.com/<repo-name>/` — then change `AFTERGLOW_SITE_URL` to match. The
   path, and therefore the build, stays the same.)_
2. **Target repository** — create an empty public repository `Wembie/mejoramigaisa`.
3. **Token** — create a fine-grained personal access token limited to
   `Wembie/mejoramigaisa` with **Contents: Read and write**. In _this_ repository add it
   as the secret `PAGES_DEPLOY_TOKEN` (Settings → Secrets and variables → Actions).
   The token is used only by the workflow; it never reaches the built site.
4. **First deploy** — push to `main` (or run the workflow manually). It creates the
   `gh-pages` branch in `Wembie/mejoramigaisa`.
5. **Enable Pages on the target** — in `Wembie/mejoramigaisa`: Settings → Pages →
   Source: _Deploy from a branch_ → `gh-pages` / `(root)`.
6. Open `https://wembie.github.io/mejoramigaisa/`.

Another person, another URL: `npm run new-experience -- sam "Sam"`, fill in the content,
rename `deployments/_sam.env` to `sam.env`, set `PAGES_TARGET_REPO=Wembie/para-sam` and
the URL `https://wembie.github.io/para-sam`, create that repository, extend the token to it.

## Publishing from this repository instead

Leave `PAGES_TARGET_REPO` unset in exactly one profile (or have no profiles — then every
experience is built for this repository's Pages URL). In this repository: Settings →
Pages → Source: **GitHub Actions**. The site is then at
`https://<pages-domain>/afterglow-experiences/` unless this repository gets its own
custom domain (then set `AFTERGLOW_BASE_PATH=/`).

## The workflow (`.github/workflows/deploy.yml`)

1. **quality** — `npm ci`, Prettier check, ESLint, `tsc`, Vitest, profile checks,
   Playwright journeys against a production build served under `/mejoramigaisa/`.
   Runs on pull requests too. Nothing deploys if it fails.
2. **plan** — splits profiles into "publish elsewhere" and "publish here".
3. **deploy-external** — one job per profile: load profile → check → build → push
   `dist/` to the target branch (`peaceiris/actions-gh-pages`).
4. **deploy-here** — official `upload-pages-artifact` + `deploy-pages`.

Manual runs (_Actions → Quality and deploy → Run workflow_) accept a comma-separated
list of profiles.

## Local builds

```bash
node scripts/profile.mjs check isa
node scripts/profile.mjs run isa -- npm run build
npx vite preview --base /mejoramigaisa/     # http://localhost:4173/mejoramigaisa/
```

On Git Bash for Windows, values that start with `/` are rewritten into Windows paths.
Write `AFTERGLOW_BASE_PATH=mejoramigaisa` (no leading slash); the build explains the
problem if it detects it.

## Limitations

- Link previews: crawlers read the static `<head>`, so title/description/image come
  from the profile, not from the experience file. Some platforms cache previews or
  ignore `og:image` on small sites.
- `noindex, nofollow` is set by default. It asks search engines not to index the page;
  it is not access control.
- The site is public: anyone with the URL can open it and download its assets.
