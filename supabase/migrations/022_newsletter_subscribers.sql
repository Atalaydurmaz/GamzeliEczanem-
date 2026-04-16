-- Newsletter aboneleri tablosu
create table if not exists newsletter_subscribers (
  id          bigint generated always as identity primary key,
  email       text not null,
  created_at  timestamptz not null default now(),

  -- Her e-posta yalnızca bir kez kaydedilir
  constraint newsletter_subscribers_email_unique unique (email)
);

-- Sadece service_role okuyabilir/yazabilir, anonim erişim kapalı
alter table newsletter_subscribers enable row level security;

-- Hiçbir public policy yok → RLS tüm anonim erişimi reddeder
-- service_role key RLS'i bypass eder, API route'larımız bu key'i kullanır
