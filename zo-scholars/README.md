# Zo Scholars Journal Club

A small, self-contained website for the journal club. It lives in this folder
only — nothing here touches the personal site in the parent directory, but both
are published from the same GitHub repository.

```
zo-scholars/
├── index.html          mission, introduction, mailing-list, submit article, members table
├── articles.html       articles listing and submit article section
├── article.html        individual article reader page
├── events.html         the upcoming events page
├── css/style.css       all styling
├── js/articles-data.js ← the file you edit to publish articles
├── js/articles.js      renders the articles listing
├── js/article-detail.js renders full individual articles
├── js/submit-article.js handles article upload & email to samuelzkh@gmail.com
├── js/events-data.js   ← the file you edit to add events
├── js/events.js        renders the events page
├── js/app.js           registration form + members table
├── js/xlsx.js          writes .xlsx files in the browser (no libraries)
├── server.py           optional local server for offline testing
└── data/members.json   public members list shown on the live site
```

---

## Article Submissions & Publishing

Visitors and scholars can upload and submit articles directly through the **Submit an Article** section on `index.html` or `articles.html`.

### How submissions reach you:
1. When someone submits the form, it sends an email with the author details, title, summary, text, and any attached files (PDF, Word doc, etc.) directly to **`samuelzkh@gmail.com`**.
2. *(First-time setup)*: The very first time a submission is sent through FormSubmit, FormSubmit will send a one-time activation confirmation email to `samuelzkh@gmail.com`. Click "Activate Form" once to start receiving all submissions.

### How to publish a submitted article to the site:
1. Open `zo-scholars/js/articles-data.js`.
2. Add an entry to `ZO_ARTICLES`:
```js
{
  id: "article-slug-id",
  date: "2026-08-15",
  label: "Article", // or "Sharing", "Video", "Tutorial"
  title: "Title of the Article",
  author: "Author Name (Affiliation)",
  // If it's a PDF article, put the PDF file inside `zo-scholars/` and set:
  pdfUrl: "filename.pdf",
  // Or if it's text content:
  content: [
    "First paragraph...",
    "Second paragraph..."
  ],
  // Or if it's a video:
  videoUrl: "https://youtu.be/..."
}
```
3. Commit and push the changes to GitHub. The live site updates immediately!

---

## Editing other content

**The introduction** — open `index.html`, find the comment block that starts
with `INTRODUCTION` (just above `<section id="introduction">`) and replace the
two placeholder paragraphs below it. Each paragraph sits between its own `<p>`
and `</p>`.

**Upcoming events** — open `js/events-data.js`. Copy one of the blocks between
`{` and `}`, change the text, and keep the commas between blocks. Anything
dated in the past moves itself into "Past sessions" automatically.

```js
{
  date: "2026-08-16",          // required, YYYY-MM-DD — this sorts the list
  time: "6:00 PM IST",
  title: "Paper discussion — …",
  speaker: "Name of presenter",
  venue: "Zoom",
  link: "",                    // optional joining URL
  description: "A short paragraph."
}
```

**The mission statement** is in `index.html` near the top, inside
`<span lang="lus">`.

---

## The mailing list and the Excel file

GitHub Pages serves static files only — it has no server that can write to a
spreadsheet. So the site works in two modes and picks the right one by itself.

### Collecting registrations — run it locally

```
cd zo-scholars
python3 server.py
```

Then open <http://localhost:8000>. Nothing needs installing; it uses only the
Python standard library. Every registration is written straight to disk:

| file | contents |
|---|---|
| `registrations.xlsx` | the full list — name, email, institute, subject, designation, timestamp |
| `data/registrations.json` | the same data, used as the source of truth |
| `data/members.json` | institute / subject / designation only — the public list |

Open `registrations.xlsx` in Excel, Numbers or LibreOffice as normal.

### The live GitHub Pages site

With no server running, the form saves each registration into the visitor's own
browser (localStorage) and **Download mailing list (Excel)** produces a real
`.xlsx` from whatever that browser holds.

The important limitation: **a registration made by a visitor on the live site
stays in that visitor's browser — it does not reach you.** Static hosting cannot
do otherwise. Three ways to handle it, cheapest first:

1. **Publish the directory by hand.** Run the local server yourself, add people
   as they email you, commit `data/members.json`, and the live members table
   updates. This is what the site does out of the box.
2. **Point the form at a form service.** Sign up for Formspree, Getform or
   similar, then in `js/app.js` replace the `fetch('api/register', …)` URL with
   the endpoint they give you. Submissions land in your inbox and export to
   Excel from their dashboard.
3. **Use a Google Form** for signups and link to it from the Join section.

### Privacy

`.gitignore` deliberately keeps `registrations.xlsx` and
`data/registrations.json` out of git, because they contain names and email
addresses and this repository is public. `data/members.json` holds only
institute, subject and designation — that one is meant to be committed, and it
is what the members table on the live site reads.

---

## Publishing

The folder is already inside the `Sam_site` repository, so it goes live with a
normal commit and push:

```
git add zo-scholars
git commit -m "Add Zo Scholars Journal Club site"
git push
```

Once GitHub Pages has built, the site is at:

```
https://samuelkhiangte.github.io/Sam_site/zo-scholars/
```

If you would rather it had its own address, create a new repository named
`zo-scholars`, copy this folder into it, and enable Pages there — no file in
this folder needs changing, since every link is relative.

---

## Previewing without the registration features

```
cd zo-scholars
python3 -m http.server 8000
```

Opening `index.html` straight from Finder mostly works too, but browsers block
`fetch` on `file://` URLs, so the members table will show only entries made in
that same browser.
