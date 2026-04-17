-- ローカル開発用シード: サンプルレース + ゼッケン1〜10
with r as (
  insert into races (name) values ('サンプル駅伝 2026') returning id
)
insert into runners (race_id, bib, name, team)
select r.id, g.bib, '選手' || g.bib, 'チーム' || ((g.bib - 1) / 5 + 1)
from r, generate_series(1, 10) as g(bib);
