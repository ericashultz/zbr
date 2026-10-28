# ZBR redesign: go-live checklist (apply to the existing Squarespace site)

Plan: keep the existing site, its domain, orders, customers, analytics and payments. Add the redesign on top of it with
Custom CSS, footer code, and a few new Not Linked pages. Nothing is renamed or deleted, so product addresses do not change.

Everything below is copied from the duplicate site (`garlic-piccolo-bcg6.squarespace.com`), which stays untouched as the reference.

Files live in `/Users/eshultz/zbr/squarespace/` (and `assets/fonts/` one level up).
To copy a file to the clipboard: `pbcopy < /Users/eshultz/zbr/squarespace/<file>` (one command per terminal line).

---

## 0. Before you start (do these first, they cannot be redone later)

- [ ] **Back up the live site's current Custom CSS.** (If the box is empty there is nothing to save: skip the next two items, and note that rolling back later just means clearing the boxes.) Pages > Custom Code (or Design > Custom CSS). Select all, copy, save to a file named `old-custom.css`.
- [ ] **Back up the live site's footer Code Injection** (Settings > Advanced > Code Injection > Footer) to `old-footer.html`. Also copy the Header box if it has anything in it.
- [ ] **Export what Squarespace cannot bring over later.**
  - Analytics: no export exists. Screenshot or Print > Save as PDF each Analytics panel at the widest date range.
  - Orders: Products & Services > Orders > Export data > Download CSV (all statuses, all dates).
  - Customers: Lists & Segments > Customers > export icon.
  - Mailing list: Lists & Segments > the list > ... > Export (use the "subscribed" CSV only).
- [ ] **Screenshot the live site** (home, store, a product, cart, contact) so you can compare and roll back if needed.
- [ ] Pick a quiet time. The site never goes down, but the look changes at step 6.

## 1. Upload the font (the one thing the CSS fetches from outside Squarespace)

The CSS currently loads the pixel font from `zbr-rho.vercel.app`. To make the live site fully independent of Vercel:

- [ ] Design > Custom CSS > **Manage Custom Files** > upload `assets/fonts/FixedsysExcelsior.woff2` and `assets/fonts/FixedsysExcelsior.woff`.
- [ ] In `zbr-custom.css` (then re-run `python3 build-css.py`), the two `@font-face` rules near the top Replace each `https://zbr-rho.vercel.app/assets/fonts/FixedsysExcelsior.woff2` with `/s/FixedsysExcelsior.woff2` and each `.woff` with `/s/FixedsysExcelsior.woff` (use whatever your uploaded address is if it differs). Do the same on the duplicate; it is already done there if you replaced it earlier.

## 2. Create the pages (all **Not Linked** until step 5)

Pages panel > + > create each one, then move it to **Not Linked**.

| Page | Slug (URL) | What goes in it |
|---|---|---|
| News Sidebar | `news-sidebar` | One **Code Block** (HTML mode, "Display Source" OFF) with `news-sidebar.html` |
| Mailing List | `mailing-list` | One **Newsletter** block. Set storage to your list; text is only a fallback, the pop-up shows its own thank-you |
| Guestbook | `guestbook` | A **Blog** page. Inside it ONE post with slug `sign`. Comments ON (site-wide in Settings and per post), Require Approval ON |
| Archives | keep the slug the site already uses | One **Code Block** with `archives-page.html` (edit the existing Archives page rather than making a second one) |
| Canada/Intl Store | pick one, e.g. `canada-intl-store` | One **Code Block** with `store-grid-inline.html` (Display Source OFF) |

Notes:
- The store grid reads these existing store pages by slug, so **do not rename, delete or re-create them**:
  `zegema-beach-releases`, `tomb-tree-tapes`, `softseed`, `pvr` (Persistent Vision Records; it must be enabled, not Disabled, or it shows "not found" and the store loads without it), `specials`, `steals`, `12inches`, `12distro2`, `distro-7inch`,
  `oddvinyl`, `cassettes`, `cds`, `shirts`, `posters1`, `posters2`, `buttons`, `stickers`.
  They can sit in Not Linked. Their product URLs stay exactly the same.
- The Guestbook buttons in the sidebar point to `/guestbook/sign`. Keep those slugs.
- The Mailing List pop-up loads `/mailing-list`. Keep that slug (it is set in `footer-code.html`).

## 3. Match the site settings from the duplicate

Compare the duplicate and the live site, panel by panel, and copy anything that differs:

- [ ] **Site title and tagline** (the duplicate's tagline reads "A community rooted in promoting honest, passionate, inspiring music - usually with screaming.").
- [ ] **Logo / header image.**
- [ ] **Blog (News) settings:** posts per page and layout the same as the duplicate.
- [ ] **Footer content** (Design > Footer or the page footer): "(c) 2026 Zegema Beach Records -- Canada" and its links (Canada/Intl Store, USA Store, Bandcamp, Archives, Contact).
- [ ] **Contact page:** same form fields as the duplicate.
- [ ] **Search and Cart link pages** exist (they appear as "Search" and "View Cart" in the menu).

## 4. Paste the code (still invisible to visitors until the CSS goes in)

- [ ] Footer Code Injection: `pbcopy < /Users/eshultz/zbr/squarespace/footer-code.html` then paste into Settings > Advanced > Code Injection > Footer. Save.
- [ ] Header Code Injection (a few lines, keeps the cart count circle from making the menu shift): `pbcopy < /Users/eshultz/zbr/squarespace/header-code.html` then paste into Settings > Advanced > Code Injection > Header. Save.
- [ ] Re-check the News Sidebar page's Code Block holds the latest `news-sidebar.html`.
- [ ] Re-check the store page's Code Block holds the latest `store-grid-inline.html`.

Order matters: the footer script is safe on the old look; the CSS is what changes the appearance.

## 5. Match the navigation

On the live site, set the main menu to the same order as the duplicate:

1. Canada/Intl Store (the new page from step 2; move the old "Canada/International store" folder and its pages to Not Linked)
2. USA Store (external link, same as the duplicate)
3. News (or "ZBR NEWS"; it is the home page on the live site)
4. Search (link page)
5. Contact
6. View Cart (link page)

(The duplicate's footer also links to Bandcamp and Archives.)

## 6. Go live: paste the Custom CSS

- [ ] `pbcopy < /Users/eshultz/zbr/squarespace/zbr-custom.min.css` then paste into Pages > Custom Code (replace everything). Save. (Use the `.min.css` file: the Custom CSS box drops whatever goes past its size limit, and the readable `zbr-custom.css` is now too long. Run `python3 build-css.py` after editing `zbr-custom.css`.)
- [ ] Hard refresh the live site (Cmd+Shift+R) and open it on your phone too.

## 7. Test (desktop and phone)

- [ ] **News:** headlines are plain text, pill tags in pixel font, Read More works, numbered page buttons (1 2 3 4 ...) work, Quick Links collapsed bar under the menu and again under the page numbers on phone, sidebar widgets (Last Copy / Reviews / Features / Johnny's) in the sidebar on desktop and above the page numbers on phone.
- [ ] **Store:** filters, search, New Items / Steals, All Distro, pager; a shareable link works, e.g. `<store page URL>?cat=sticker`.
- [ ] **Product page:** price / selector / quantity / Add to Cart on one row, Bandcamp player under it, "Back to Store" returns to the same filters and scroll position.
- [ ] **Cart:** add something, cart page looks right, proceed to checkout. Run one **test order using a 100% discount code** (create it, use it, delete it).
- [ ] **Guestbook:** sign it from the sidebar button, approve the comment (Pages > Guestbook > Manage Comments > Unmoderated), check it appears; "Back to News" returns to where you were.
- [ ] **Mailing list pop-up** opens, submits, shows "Thank you for signing up!"; the address lands in the list.
- [ ] **Search** results page, **Contact** form submits, **Archives** landing page.
- [ ] Open Squarespace's **editor** once and confirm it is not broken (code does not run in the editor; the CSS does).

## 8. Rollback (if something looks wrong)

1. Paste `old-custom.css` back into Custom Code (or, if it was empty before, delete everything in the box). Save. The old look is back immediately.
2. Paste `old-footer.html` back into the footer injection (or clear the box if it was empty before).
3. Move the new pages back to Not Linked (they are harmless while unlinked). Restore the old menu order.

## 9. After launch

- [ ] Import the mailing list (subscribed CSV only) if it was exported from another site, or point the Newsletter block at the existing list.
- [ ] Keep the duplicate site for a few weeks as a reference, then cancel it.
- [ ] Optional: regenerate the news pager table (`make-news-pages.py`) only occasionally, e.g. once a year. New posts are picked up automatically (each visitor's browser asks Squarespace for the posts newer than the table, up to 80, and remembers them).
- [ ] Grid image fallback: if a store tile ever shows a placeholder image, load the store once with `?refresh=1` on the end of its URL to skip the one-hour product cache.

## Reference: what each file is

| File | Where it goes |
|---|---|
| `zbr-custom.min.css` | Pages > Custom Code (whole file). Built from `zbr-custom.css` (the readable source) by `build-css.py` |
| `footer-code.html` | Settings > Advanced > Code Injection > Footer |
| `header-code.html` | Settings > Advanced > Code Injection > Header |
| `store-grid-inline.html` | Code Block on the Canada/Intl Store page |
| `news-sidebar.html` | Code Block on the News Sidebar page |
| `archives-page.html` | Code Block on the Archives page |
| `assets/fonts/FixedsysExcelsior.woff2` / `.woff` | Design > Custom CSS > Manage Custom Files |
