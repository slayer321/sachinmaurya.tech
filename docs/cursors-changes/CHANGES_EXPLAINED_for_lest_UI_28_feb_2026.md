# Website Changes - Detailed Explanation

This document explains every change made to your personal website, written for a backend engineer who wants to understand the frontend, CSS, and Hugo concepts behind each decision.

---

## Table of Contents

1. [How Hugo Theming Works](#1-how-hugo-theming-works)
2. [File-by-File Breakdown](#2-file-by-file-breakdown)
3. [CSS Explained](#3-css-explained-staticcsscustomcss)
4. [Hugo Templating Concepts Used](#4-hugo-templating-concepts-used)
5. [The Background Color Problem and Fix](#5-the-background-color-problem-and-fix)
6. [Post Template Improvements](#6-post-template-improvements)
7. [Content Structure](#7-content-structure)
8. [Config Changes](#8-config-changes-configtoml)
9. [How to Maintain Going Forward](#9-how-to-maintain-going-forward)

---

## 1. How Hugo Theming Works

Hugo uses a **lookup order** to find templates. Think of it like method overriding in Go interfaces:

```
Your project files  >  Theme files
```

When Hugo needs to render a page, it looks for the template in your project's `layouts/` folder first. If it doesn't find one, it falls back to `themes/hello-friend-ng/layouts/`.

This means:
- **You never edit theme files directly.** The theme is a Git submodule that can be updated independently.
- **To customize anything, you create a file with the same name/path in your project's `layouts/` directory.** Hugo will use yours instead.

Example:
```
themes/hello-friend-ng/layouts/index.html    <-- theme's homepage
layouts/index.html                            <-- YOUR override (Hugo uses this one)
```

Same principle applies to:
- `layouts/posts/single.html` overrides `themes/.../layouts/posts/single.html`
- `layouts/partials/subscribe-box.html` is brand new (theme doesn't have it)

For CSS, the theme compiles its SCSS into `main.css`. Your `static/css/custom.css` is loaded **after** the theme CSS (configured in `config.toml`), so your rules can override the theme's styles.

---

## 2. File-by-File Breakdown

Here is every file that was created or modified, grouped by purpose.

### Homepage: `layouts/index.html`

**What it does:** Controls what you see when you visit the root URL (`/`).

**Structure:**

```
{{ define "body" }}   <-- Sets the <body> tag (for background image support)
{{ define "main" }}   <-- The actual page content, injected into baseof.html

  home-hero           <-- Avatar + name + tagline + social icons
  home-section        <-- "Latest Writing" - lists 5 most recent blog posts
  home-section        <-- "Recent Notes" - lists 3 most recent notes
  home-section        <-- Subscribe box (RSS link)
```

Key decisions:
- Uses `.RelPermalink` instead of `.Permalink` for links. `.Permalink` generates absolute URLs like `https://sachinmaurya.tech/posts/...` which breaks local development. `.RelPermalink` generates `/posts/...` which works everywhere.
- The avatar is wrapped in a fixed-size `div` with `overflow: hidden` and `border-radius: 50%` instead of relying on the theme's `.circle` class, which used percentage-based sizing that looked inconsistent.
- Post list shows only title + abbreviated date ("Jan 2006") -- no tags, no descriptions. Keeps it scannable.

### Blog Post Template: `layouts/posts/single.html`

**What it does:** Controls the layout of individual blog posts (e.g., the Golang defer post).

**What changed from the theme's version:**

1. **Automatic Table of Contents**: The theme only shows TOC if you manually add `toc = true` to the post frontmatter. The new template also shows it automatically when a post has more than 800 words:
   ```
   {{- if or .Params.toc (gt .WordCount 800) }}
   ```

2. **Related Posts**: After the post content, Hugo finds up to 3 related posts based on shared tags, categories, or series:
   ```
   {{ $related := .Site.RegularPages.Related . | first 3 }}
   ```
   This uses the `[related]` config in `config.toml` (explained later).

3. **Subscribe Box**: Added the RSS subscription partial at the bottom of every post.

4. **Fallback text**: Added `| default "..."` to i18n calls so they don't show blank if translation strings are missing.

### RSS Partial: `layouts/partials/subscribe-box.html`

**What it does:** A reusable HTML snippet for the RSS subscription callout. Used on both the homepage and individual posts.

In Hugo, **partials** are like Go functions -- reusable template fragments you call with `{{ partial "name.html" . }}`. The `.` passes the current page context so the partial can access site variables.

The partial generates a simple box with a heading, description, and a link to `/index.xml` (Hugo's built-in RSS feed).

### Notes Archetype: `archetypes/notes.md`

**What it does:** When you run `hugo new notes/2026/my-note.md`, Hugo uses this as the template for the new file.

```toml
+++
title = "{{ replace .Name "-" " " | title }}"
date = {{ .Date }}
type = ["notes","note"]
tags = []
+++
```

- `replace .Name "-" " " | title` -- Takes the filename (e.g., `my-note`), replaces hyphens with spaces, and capitalizes each word -> "My Note".
- `type = ["notes","note"]` -- Tells Hugo this content belongs to the "notes" section. This is how the homepage query `where .Site.RegularPages "Type" "notes"` finds them.

### Content Pages

| File | Purpose |
|------|---------|
| `content/notes/_index.md` | Section landing page for `/notes/`. The title and description shown at the top of the notes list page. |
| `content/notes/2024/k8s-cronjob-timezone.md` | Sample note (Kubernetes CronJob timezone TIL) |
| `content/notes/2024/go-context-patterns.md` | Sample note (Go context cancellation patterns) |
| `content/now.md` | "/now" page -- what you're currently working on. Inspired by [nownownow.com](https://nownownow.com/about). |
| `content/uses.md` | "/uses" page -- your tools and setup. Inspired by [uses.tech](https://uses.tech). |

---

## 3. CSS Explained: `static/css/custom.css`

CSS (Cascading Style Sheets) controls how HTML elements look. If HTML is the struct definition, CSS is the formatting/display logic. Here's what each section does.

### Background Color Overrides (Lines 1-44)

This was the trickiest part. The theme defines background colors in compiled SCSS that can't be edited without rebuilding. Our CSS loads after the theme's, so **same-specificity rules win by load order**.

But the theme uses `@media (prefers-color-scheme: light)` rules which have **higher specificity** than a plain selector. So we had to match every variant:

```css
/* Base rule -- wins when no media query matches */
html { background-color: #f7f5f0; }
body { background-color: #f7f5f0; }

/* Override the theme's light media query */
@media (prefers-color-scheme: light) {
  html, body { background-color: #f7f5f0; }
  .header, .menu, .submenu { background: #f7f5f0; }
}

/* Override the theme's dark media query */
@media (prefers-color-scheme: dark) {
  html, body { background-color: #1a1b1e; }
  .header, .menu, .submenu { background: #1a1b1e; }
}

/* Override when user manually toggles theme via the moon/sun button */
[data-theme=light] html, [data-theme=light] body { ... }
[data-theme=dark] html, [data-theme=dark] body { ... }
```

Why `html` AND `body`? The `<html>` element is the root of the page. If only `body` has a background, the `<html>` behind it defaults to browser white. That's what caused the thin white strip at the top.

Why `.header` AND `.menu` AND `.submenu`? The theme sets background on each of these independently in its SCSS. If you only override `.header`, the `.menu` (the nav links container) still shows the theme's default white.

**Colors used:**
- `#f7f5f0` -- warm off-white (light mode). Easier on the eyes than pure white `#fff`.
- `#1a1b1e` -- warm dark (dark mode). Slightly warmer than the theme's `#232425`.

### Navbar (Lines 46-53)

```css
.header { padding: 14px 20px; }      /* Reduced from 20px -- less vertical space */
.header__inner { width: 580px; }      /* Narrowed from theme's 760px */
```

The theme spreads the logo and nav links across 760px. Narrowing to 580px pulls them closer together, making the navbar feel more intentional and less stretched.

### Homepage Layout (Lines 55-221)

**`.home-main`** -- The container for all homepage content.
- `max-width: 540px` -- Constrains the content width. Narrower = easier to read, feels more focused.
- `margin: 0 auto` -- Centers the container horizontally. `auto` left/right margins = centered block.

**`.home-avatar`** -- The profile photo container.
- `width: 88px; height: 88px` -- Fixed size instead of the theme's percentage-based sizing.
- `border-radius: 50%` -- Makes a square into a circle.
- `overflow: hidden` -- Crops the image to the circle boundary.
- `object-fit: cover` on the `img` -- Scales the image to cover the container while maintaining aspect ratio (like `background-size: cover` in Go terms, it fills the space without distortion).

**`.home-tagline`** -- The one-line description under your name.
- `opacity: 0.65` -- Makes text partially transparent. 1.0 = fully visible, 0 = invisible. This creates a visual hierarchy where your name (full opacity) is primary and the tagline is secondary.

**`.home-section h2`** -- Section headings like "LATEST WRITING".
- `text-transform: uppercase` -- Converts text to ALL CAPS.
- `letter-spacing: 0.1em` -- Adds space between letters. Standard for uppercase labels.
- `font-size: 0.8rem` -- Small. These are labels, not content headings.
- `opacity: 0.5` -- Dimmed so they don't compete with the actual content below.

**`.home-post-item a`** -- Each post row in the list.
- `display: flex` -- Flexbox layout. Think of it as a horizontal container.
- `justify-content: space-between` -- Title pushed left, date pushed right.
- `align-items: baseline` -- Aligns text by their baseline (the bottom of letters), so different font sizes still look aligned.

**`.home-post-date`**
- `font-variant-numeric: tabular-nums` -- Makes all digits the same width, so dates like "Jan 2024" and "Sep 2023" align their numbers neatly in a column.
- `white-space: nowrap` -- Prevents the date from wrapping to a new line.

**`.home-post-item a:hover .home-post-title`** -- When you hover over a post row:
- `text-decoration: underline` -- Adds underline to the title only, not the date. The selector reads: "when hovering the `<a>`, find the `.home-post-title` inside it and underline it."

### Subscribe Box (Lines 257-307)

- `border: 1px solid rgba(0, 0, 0, 0.08)` -- Very subtle border. `rgba` means red/green/blue/alpha. `0.08` = 8% opacity, so it's barely visible.
- `border-radius: 6px` -- Rounds the corners. Higher number = more rounded.
- The `[data-theme=dark]` override changes the border to white with 10% opacity so it's visible against the dark background.

### Reading Experience (Lines 309-494)

**`.post-content`**
- `line-height: 1.75` -- Space between lines of text. 1.0 = lines touch, 2.0 = double-spaced. 1.75 is comfortable for reading.
- `max-width: 720px` -- Limits line length. Long lines (80+ characters) are harder to read. This keeps it around 65-75 characters per line.

**`.post-content code`** -- Inline code (like `this`).
- `padding: 0.15rem 0.35rem` -- Small padding around the text.
- `background: rgba(0, 0, 0, 0.06)` -- Very light grey background to distinguish it.
- `font-size: 0.88em` -- Slightly smaller than surrounding text. `em` is relative to the parent's font size.

**`.post-content pre`** -- Code blocks (multi-line).
- `overflow-x: auto` -- Adds horizontal scrollbar if code is wider than the container, instead of breaking the layout.
- `border-radius: 6px` -- Rounded corners on code blocks.

**`.post-content blockquote`** -- Quoted text.
- `border-left: 3px solid var(--accent)` -- Colored left border. `var(--accent)` references a CSS variable defined by the theme that changes with light/dark mode.

**`.toc-sidebar`** -- Table of Contents box.
- Styled as a bordered card with padding and rounded corners.
- Links inside (`#toc a`) are dimmed (`opacity: 0.75`) and brighten on hover.

**`.related-posts`** -- "Related Posts" section at the bottom of posts.
- Same card-style border and padding.
- Each related post is a row with title left and date right, same pattern as the homepage.

### Responsive Design (Lines 496-522)

```css
@media (max-width: 684px) { ... }
```

This is a **media query** -- CSS rules that only apply when the browser window is narrower than 684px (roughly phone-sized). The number 684 matches the theme's `$media-size-phone` breakpoint.

Inside, we:
- Reduce font sizes slightly
- Reduce padding
- Shrink the gap between title and date in post lists

This ensures the site looks good on phones without needing a completely different layout.

---

## 4. Hugo Templating Concepts Used

### `{{ define "main" }}` / `{{ block "main" . }}`

Hugo's template inheritance system. The base template (`baseof.html`) has placeholder blocks:
```html
<div class="content">
    {{ block "main" . }}{{ end }}
</div>
```

Each page template fills in the block:
```html
{{ define "main" }}
    <main>...your content...</main>
{{ end }}
```

Think of it like interfaces in Go -- `baseof.html` defines the interface, each page template implements it.

### `{{ partial "name.html" . }}`

Includes a reusable HTML snippet from `layouts/partials/`. The `.` passes the current context (page variables, site config, etc.) to the partial. Like calling a function with an argument.

### `{{ where .Site.RegularPages "Type" "posts" }}`

Filters all pages in the site. Similar to a SQL WHERE clause:
- `.Site.RegularPages` -- All content pages (excludes list pages, taxonomy pages, etc.)
- `"Type" "posts"` -- Only pages whose content type is "posts" (determined by their location in `content/posts/`).

### `{{ range first 5 $recentPosts }}`

Iterates over the first 5 items. `range` in Hugo templates works like `for range` in Go. `first 5` is like taking a slice `[:5]`.

### `.RelPermalink` vs `.Permalink`

- `.Permalink` = `https://sachinmaurya.tech/posts/2024/09/golang-defer-cost-me-100-bucks/`
- `.RelPermalink` = `/posts/2024/09/golang-defer-cost-me-100-bucks/`

`.RelPermalink` is relative to the site root. It works in both local development (`localhost:1313/posts/...`) and production. `.Permalink` is absolute and always uses the `baseURL` from `config.toml`, which breaks local testing.

### `{{ .Date.Format "Jan 2006" }}`

Go's time formatting uses a reference date: `Mon Jan 2 15:04:05 MST 2006`. To get "Jan 2024", you write `"Jan 2006"`. This is Go-specific -- other languages use patterns like `MMM yyyy`.

### `{{ with .Description }}`

A conditional block that only renders if the value is truthy (non-empty). Inside the block, `.` refers to the value itself. Similar to:
```go
if desc := page.Description; desc != "" {
    render(desc)
}
```

### `{{ .Site.RegularPages.Related . | first 3 }}`

Hugo's built-in related content engine. It uses the `[related]` config to find pages that share tags, categories, or series with the current page, scored by weight. `| first 3` takes the top 3 matches.

---

## 5. The Background Color Problem and Fix

This is worth its own section because it was a multi-step debugging process.

### The Problem

We wanted a warm off-white (`#f7f5f0`) background instead of the theme's pure white (`#fff`). Despite setting `body { background-color: #f7f5f0; }`, a white strip kept appearing at the top of the page.

### Why It Happened

The page has this HTML structure:

```
<html>                    <-- Layer 1: root element
  <body>                  <-- Layer 2: page body
    <header class="header"> <-- Layer 3: navbar
      <nav class="menu">   <-- Layer 4: nav links
```

The theme's compiled SCSS sets background colors on `body`, `.header`, and `.menu` -- but NOT on `<html>`. The browser defaults `<html>` to white.

Additionally, the theme uses **four different CSS contexts** for colors:

1. Default (no media query)
2. `@media (prefers-color-scheme: light)` -- when OS is set to light mode
3. `@media (prefers-color-scheme: dark)` -- when OS is set to dark mode
4. `[data-theme=light]` / `[data-theme=dark]` -- when user clicks the theme toggle button

Each context is a separate CSS rule. If you only override context 1, contexts 2-4 still apply the theme's original colors.

### The Fix

Override ALL four contexts for ALL four elements:

| Element | Why it needs a background |
|---------|--------------------------|
| `html` | Root element, browser defaults to white |
| `body` | Main page container |
| `.header` | Theme sets its own background on this |
| `.menu` | Theme sets its own background on this separately |

Each one needed the color set in all four contexts (default, light media, dark media, data-theme toggle).

---

## 6. Post Template Improvements

### Automatic Table of Contents

The theme's original condition:
```
{{- if .Params.toc }}
```
Only shows TOC if you manually add `toc = true` to the post frontmatter.

Our improvement:
```
{{- if or .Params.toc (gt .WordCount 800) }}
```
Shows TOC if either:
- You manually set `toc = true`, OR
- The post has more than 800 words

`.WordCount` is a built-in Hugo variable that counts words in the content. `gt` means "greater than".

### Related Posts

The `[related]` section in `config.toml` tells Hugo how to find related content:

```toml
[related]
  includeNewer = true     # Include posts published after the current one
  threshold = 80          # Minimum relevance score (0-100) to be considered related

  [[related.indices]]
    name = "tags"         # Compare by tags
    weight = 100          # Tags are the strongest signal

  [[related.indices]]
    name = "categories"
    weight = 80

  [[related.indices]]
    name = "series"
    weight = 90

  [[related.indices]]
    name = "date"
    weight = 10           # Date similarity is weak signal
```

Hugo scores each page against the current page. A post sharing 2 tags scores higher than one sharing 1 tag. Posts in the same series score high. The top 3 are shown.

---

## 7. Content Structure

### Posts vs Notes

| | Posts | Notes |
|---|---|---|
| Location | `content/posts/YEAR/` | `content/notes/YEAR/` |
| Purpose | Full blog posts, long-form writing | Quick TILs, code snippets, short learnings |
| Frontmatter type | `type = ["posts","post"]` | `type = ["notes","note"]` |
| Homepage display | 5 most recent | 3 most recent |

### Year-Based Directories

Both posts and notes use year subdirectories:

```
content/
  posts/
    2022/
      07_22_LFX_mentorship_1.md
      07_22_LFX_mentorship_2.md
      07_22_a_new_journey.md
    2023/
      03_09_23_first_kubecon.md
    2024/
      01_09_24_golang_defer_cost_me_100_bucks.md
    2026/
      25_01_2026_social_media_diet.md
  notes/
    _index.md
    2024/
      k8s-cronjob-timezone.md
      go-context-patterns.md
```

This is purely organizational -- Hugo doesn't care about subdirectory structure for content type. The `type` field in frontmatter and the top-level directory (`posts/` or `notes/`) determine the content type.

### Archetypes

Archetypes are templates for new content. When you run:

```bash
hugo new notes/2026/my-new-note.md
```

Hugo looks for `archetypes/notes.md` and uses it as the template. The frontmatter is pre-filled with the correct `type`, date, and a title derived from the filename.

### Standalone Pages

`content/now.md` and `content/uses.md` are standalone pages (not part of a section). They render using the default single page template. They're accessible at `/now/` and `/uses/` but are not in the navigation menu.

---

## 8. Config Changes (`config.toml`)

### SEO Metadata

**Before:**
```toml
description = "Sachin's blog and portfolio"
keywords = "security, cybersecurity, open source, kubernetes..."
images = [""]
```

**After:**
```toml
description = "Backend engineer sharing insights on Go, Kubernetes, cloud security, and open source..."
keywords = "security, cybersecurity, open source, kubernetes, cloud security, devops, linux, golang, penetration testing, ethical hacking, blog, sachin maurya, backend engineering, cloud native, CNCF, software engineering"
images = ["/assets/images/social-preview.jpg"]
```

- `description` -- Appears in search engine results and when sharing links on social media (the preview text under the title).
- `keywords` -- Helps search engines understand what your site is about.
- `images` -- The image shown when someone shares your site link on Twitter/LinkedIn/Slack. You still need to add the actual image file at `static/assets/images/social-preview.jpg`.

### Navigation Menu

**Before:** About, Blog

**After:** About, Blog, Notes

Each menu item is defined in `config.toml`:
```toml
[[menu.main]]
  identifier = "notes"    # Internal ID (must be unique)
  name       = "Notes"    # Display text in the navbar
  url        = "notes/"   # URL path
  weight = 3              # Sort order (lower = further left)
```

### Related Content

Added the `[related]` section (explained in section 6 above). This didn't exist before -- Hugo's default related content matching is very basic without explicit configuration.

---

## 9. How to Maintain Going Forward

### Adding a New Blog Post

```bash
hugo new posts/2026/my-post-title.md
```

Edit the generated file in `content/posts/2026/`. The post will automatically:
- Appear on the homepage (if it's in the most recent 5)
- Get a Table of Contents if it exceeds 800 words
- Show related posts based on shared tags

### Adding a New Note

```bash
hugo new notes/2026/my-quick-note.md
```

The archetype pre-fills the frontmatter with `type = ["notes","note"]`. Add your content and tags.

### Updating the Homepage Tagline

Edit `layouts/index.html`, line 15:
```html
<p class="home-tagline">Backend engineer. Writing about Go, K8s &amp; cloud security.</p>
```

### Changing Colors

Edit `static/css/custom.css`. The two key colors:
- Light mode background: search for `#f7f5f0` and replace all occurrences
- Dark mode background: search for `#1a1b1e` and replace all occurrences

Remember to change it in ALL the media query blocks (there are 4 contexts -- see section 5).

### Adding/Removing Nav Items

Edit the `[menu]` section in `config.toml`. Add a new `[[menu.main]]` block or remove an existing one. The `weight` field controls ordering.

### Updating the "Now" or "Uses" Pages

Edit `content/now.md` or `content/uses.md` directly. These are standard Markdown files. They're not in the nav menu but are accessible via direct URL.

### Testing Locally

```bash
hugo server
```

Visit `http://localhost:1313`. Changes to templates and CSS reload automatically.

### Building for Production

```bash
hugo
```

Output goes to the `public/` directory. This is what gets deployed to your hosting.

---

## Quick Reference: File Map

```
sachinmaurya.tech/
├── config.toml                          # Site configuration (menu, metadata, related content)
├── static/css/custom.css                # All custom styling (loaded after theme CSS)
├── layouts/
│   ├── index.html                       # Homepage override
│   ├── posts/
│   │   └── single.html                  # Enhanced blog post template (TOC, related posts)
│   └── partials/
│       └── subscribe-box.html           # Reusable RSS subscription component
├── archetypes/
│   └── notes.md                         # Template for new notes
├── content/
│   ├── about/
│   │   └── _index.md                    # About page (unchanged)
│   ├── posts/
│   │   ├── 2022/                        # Posts by year
│   │   ├── 2023/
│   │   ├── 2024/
│   │   └── 2026/
│   ├── notes/
│   │   ├── _index.md                    # Notes section landing page
│   │   └── 2024/                        # Notes by year
│   │       ├── k8s-cronjob-timezone.md
│   │       └── go-context-patterns.md
│   ├── now.md                           # "What I'm doing now" page
│   └── uses.md                          # Tools and setup page
└── themes/
    └── hello-friend-ng/                 # Theme (Git submodule, DO NOT edit)
```
