# Stara Zagrebačka Škola — redizajn

Redizajn web stranice restorana i cateringa *Stara Zagrebačka Škola* iz Zagreba
(Kombolova 2a, otvoren 1998.).

> **Portfolio projekt.** Restoran postoji i podaci su stvarni, ali stranica nije
> naručena ni odobrena od vlasnika.

## Tehnologija

Čisti HTML, CSS i vanilla JavaScript. Bez build koraka i bez ovisnosti — jedino
se fontovi dohvaćaju s Google Fontsa.

## Pokretanje

```bash
python -m http.server 5180
```

Zatim otvoriti http://localhost:5180

## Struktura

```
index.html      cijela stranica
css/            variables · base · sections · animations
js/             api · form · main
CLAUDE.md       odluke, dizajn sustav, plan backenda
```

## Backend

Još ne postoji. Planiran je Spring Boot + Supabase. Sva komunikacija ide kroz
`js/api.js`, koji trenutno radi u mock načinu — detalji i ugovor API-ja su u
[CLAUDE.md](CLAUDE.md).
