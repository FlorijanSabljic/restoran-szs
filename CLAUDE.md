# Stara Zagrebačka Škola — kontekst projekta

> Sažetak stanja, odluka i dogovorenih pristupa. Ažurira se na kraju svake
> radne sesije. **Ne upisivati tajne** — repozitorij je javan.

---

## Što je ovo

Redizajn web stranice restorana i cateringa **Stara Zagrebačka Škola**
(Kombolova 2a, Zagreb, otvoren 1998.).

**Ovo je vježba i portfolio projekt, ne klijentski posao.** Restoran postoji i
podaci su stvarni, ali stranica nije naručena niti odobrena od vlasnika. Ako
projekt ikad krene javno, to treba dogovoriti s njima.

Postojeća stranica koja je poslužila kao izvor sadržaja:
https://restoran-starazagrebackaskola.com

---

## Tehnologija i zašto baš ona

Čisti **HTML, CSS i vanilla JavaScript**, bez build koraka i bez ovisnosti.

Razmatran je i Astro, ali je odbačen: stranica je jedna, sadržaj je statičan, a
Node i build korak ne bi platili svoju cijenu. Za lokalni restoran je statični
HTML ujedno i najbolji za tražilice. Ako projekt naraste na više stranica
(jelovnik, blog, galerija po eventima), Astro je prirodan sljedeći korak i
migracija je bezbolna.

Jedina vanjska ovisnost su Google Fonts (Cormorant Garamond, Inter). Ako se
ikad želi potpuna neovisnost, fontovi se skinu u `assets/fonts/`.

### Pokretanje lokalno

Stranica radi i otvaranjem `index.html`, ali zbog putanja je bolje kroz
poslužitelj:

```bash
python -m http.server 5180
```

Zatim http://localhost:5180

---

## Struktura

```
index.html            — cijela stranica, jedan dokument
css/
  variables.css       — paleta, tipografija, razmaci; SVE vrijednosti ovdje
  base.css            — reset, tipografska osnova, gumbi, pomoćne klase
  sections.css        — sekcije, mobile-first
  animations.css      — otkrivanje pri skrolanju, hero ulaz, reduced-motion
js/
  api.js              — jedini sloj koji zna za poslužitelj
  form.js             — validacija i slanje rezervacije
  main.js             — navigacija, otkrivanje, galerija
```

Podjela CSS-a i JS-a po odgovornosti je namjerna — ako projekt ikad pređe na
komponente, granice su već povučene.

---

## Dizajn

- **Paleta:** podloga `#100c08`, plohe `#16110c` i `#1e1811`, akcent zlatna
  `#d9b46a`, tekst krem `#f5efe4`. Boje se koriste **isključivo preko
  semantičkih imena** (`--boja-pozadina`, `--boja-akcent`), nikad doslovno.
- **Tipografija:** Cormorant Garamond za naslove, Inter za tekst. Naslovi
  koriste `clamp()` pa nema skokova na breakpointima.
- **Plošno:** bez gradijenata i sjena, osim jedne diskretne na karticama i
  suptilnog radijalnog sjaja u hero pozadini.
- **Imena klasa su na hrvatskom** (`.kartica`, `.nadnaslov`, `.je-vidljiv`),
  kao i komentari i poruke — u skladu s ostatkom koda.
- Stanja nose prefiks `je-` (`.je-otvoren`, `.je-vidljiv`, `.je-pomaknuta`).

### Slike

Sve slike su trenutno **CSS placeholderi** — `<figure class="placeholder">` s
točnim `aspect-ratio` i opisnom oznakom. Kad stignu prave fotografije, svaki
placeholder se zamjenjuje s `<img src="…" alt="…" loading="lazy">` uz **isti
omjer stranica**; layout se ne dira.

---

## Backend — plan za kasnije

Backend **još ne postoji**. Predviđeno: **Spring Boot + Supabase (PostgreSQL)**.

Arhitektura je već pripremljena tako da se doda bez prepisivanja frontenda:

- Sva komunikacija s poslužiteljem ide **isključivo kroz `js/api.js`**. Nijedna
  druga datoteka ne zna za `fetch` ni za adrese.
- `api.js` ima `Konfiguracija.MOCK = true`. Dok je tako, forma ne šalje ništa —
  simulira uspjeh nakon 900 ms i ispisuje podatke u konzolu.
- **Kad backend proradi:** postaviti `MOCK` na `false` i `OSNOVNI_URL` na pravu
  adresu. To je jedina izmjena na frontendu.
- Ključevi koji se šalju su **na engleskom** iako je sučelje na hrvatskom —
  odgovaraju budućem Spring Boot DTO-u i stupcima u bazi.

### Ugovor prema `POST /api/reservations`

```json
{
  "fullName": "Ana Anić",
  "phone": "091 234 5678",
  "email": "ana@primjer.hr",
  "reservationDate": "2026-09-01",
  "reservationTime": "19:00",
  "partySize": 4,
  "occasion": "rodendan",
  "note": "Uz prozor"
}
```

Očekivani odgovor: `{ "id": "…", "status": "ZAPRIMLJENO", "primljeno": "…" }`.

### Što backend mora napraviti

- **Validirati ponovno.** Validacija u `form.js` je udobnost za korisnika, ne
  sigurnosna provjera.
- Ograničiti broj zahtjeva po IP-u (rate limiting) — forma je javna.
- CORS otvoriti samo prema adresi frontenda.
- Ne vjerovati polju `web` — to je zamka za robote, treba biti prazno.
- Supabase ključeve držati u varijablama okoline, **nikad u repozitoriju**.

---

## Odluke donesene u prvoj sesiji (16.8.2026)

| Odluka | Zašto |
|---|---|
| Rezervacijska, a ne obična kontakt forma | Hero CTA kaže "Rezervirajte stol" pa mora imati kamo voditi; ujedno je realniji podatkovni model za bazu |
| CSS placeholderi umjesto Unsplasha | Nema vanjskih ovisnosti, a zamjena je trivijalna |
| Validacija telefona namjerno široka | Uži uzorak odbija valjane hrvatske brojeve; broj ionako provjerava čovjek pri potvrdi |
| `novalidate` na formi | Preglednikove poruke su na jeziku sustava, a ne nužno hrvatskom |
| Sigurnosna mreža za otkrivanje | Sadržaj je skriven dok ga `IntersectionObserver` ne otkrije — da propali observer ne znači praznu stranicu, sve se otkriva 2 s nakon učitavanja ako se ništa nije okinulo |

---

## Pristupačnost — što je već ugrađeno

- "Preskoči na sadržaj" poveznica.
- Vidljiv fokus na svemu; nigdje `outline: none` bez zamjene.
- Mobilni izbornik i lightbox se zatvaraju na `Escape` i vraćaju fokus odakle
  je došao.
- Stavke galerije su dohvatljive tipkovnicom (`Enter` i razmaknica).
- Poruke forme idu kroz `role="alert"` i `aria-live`.
- `prefers-reduced-motion` gasi **sve** animacije.
- Polja forme imaju `font-size: 1rem` — ispod toga iOS Safari zumira pri fokusu.

---

## Stanje

**Gotovo:** sve sekcije (hero, o nama, ponuda, galerija, kontakt, podnožje),
navigacija s mobilnim izbornikom, rezervacijska forma s validacijom, lightbox
galerije, animacije otkrivanja, `api.js` sloj u mock načinu.

**Provjereno u pregledniku:** forma (prazna, neispravna i ispravna predaja,
stanje "Šaljem…", uspješna poruka, reset), mobilni izbornik, lightbox s
vraćanjem fokusa, rasporedi na 320 / 768 / 1280 px bez vodoravnog prelijevanja.

**Nije provjereno vizualno:** animacije otkrivanja i pozadina navigacije pri
skrolanju. Preglednik u razvojnom alatu radi skriven, pa `requestAnimationFrame`
i `IntersectionObserver` ne rade. Kod je ispravan i sigurnosna mreža je
potvrđena, ali ovo treba pogledati očima u pravom pregledniku.

### Što još treba

- **Prave fotografije** — najveći pojedinačni skok u dojmu. Do tada je stranica
  skup sivih ploha.
- Google karta u kontakt sekciji (sada placeholder). Ugraditi tek uz pristanak
  na kolačiće ili preko statične slike karte.
- Backend prema planu gore.
- Radno vrijeme — nije ga bilo na postojećoj stranici, a gostima je među prvim
  informacijama koje traže. Doznati i dodati.
- Razmisliti o `sitemap.xml` i pravoj OG slici prije javnog postavljanja.
- Ako projekt ikad ide javno: dogovor s vlasnikom restorana.
