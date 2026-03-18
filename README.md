# ПУСЗ Оаза — Портал за Вработени

Static web portal hosted on GitHub Pages, using Supabase for authentication.

## File structure

```
├── index.html          # Login page
├── dashboard.html      # Почетна (home dashboard)
├── logs.html           # Записи
├── tasks.html          # Задачи
├── reports.html        # Извештаи
├── settings.html       # Поставки
├── auth-guard.js       # Auth protection — included in all protected pages
├── sidebar.js          # Shared sidebar component
├── shared.css          # Shared styles
├── supabase-setup.sql  # Run once in Supabase SQL Editor
└── .nojekyll           # Tells GitHub Pages not to process with Jekyll
```

## Deploy to GitHub Pages

1. Push all files to your repo root
2. Go to **Settings → Pages → Source** → Deploy from branch → `main` / `/ (root)`
3. Your app will be at `https://<username>.github.io/<repo-name>/`

## Supabase configuration

See `supabase-setup.sql` for full instructions.

Quick checklist:
- [ ] Run `supabase-setup.sql` in the SQL Editor
- [ ] Set Site URL in Authentication → URL Configuration
- [ ] Add Redirect URLs (see SQL file for the full list)
- [ ] Turn OFF email confirmation (Authentication → Providers → Email)
- [ ] Create employee accounts with email format: `username@oaza.internal`

## Adding employees

In the Supabase Dashboard → Authentication → Users → **Add user**:
- Email: `username@oaza.internal`
- Password: (set a temporary password, user should change it)
- Auto Confirm User: ✅

Users log in with just their `username` — the app appends `@oaza.internal` automatically.
