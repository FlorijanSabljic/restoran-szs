/* ==========================================================================
   Sloj prema poslužitelju.

   Cijela komunikacija s backendom prolazi kroz ovu datoteku. Dok backend ne
   postoji, radi se u MOCK načinu — zahtjev se ne šalje, nego se simulira
   odgovor. Kad Spring Boot proradi, dovoljno je postaviti MOCK na false i
   upisati pravi OSNOVNI_URL; ostatak koda se ne dira.
   ========================================================================== */

(function (global) {
  "use strict";

  var Konfiguracija = {
    // Lokalni Spring Boot; u produkciji adresa deployanog API-ja.
    OSNOVNI_URL: "http://localhost:8080",

    // Prebaciti na false kad backend proradi.
    MOCK: true,

    // Koliko čekamo odgovor prije nego odustanemo (ms)
    ISTEK: 10000,
  };

  var Putanje = {
    rezervacije: "/api/reservations",
  };

  /**
   * Greška koja nosi HTTP status, da je pozivatelj može razlikovati od
   * mrežnog pada.
   */
  function GreskaApija(poruka, status) {
    var greska = new Error(poruka);
    greska.name = "GreskaApija";
    greska.status = status;
    return greska;
  }

  /**
   * Simulirani odgovor dok nema backenda. Kratko kašnjenje postoji namjerno —
   * bez njega se stanje "šaljem…" nikad ne vidi pa se ne može ni testirati.
   */
  function mockOdgovor(podaci) {
    return new Promise(function (razrijesi) {
      setTimeout(function () {
        console.info("[MOCK] Rezervacija bi bila poslana:", podaci);
        razrijesi({
          id: "mock-" + Date.now(),
          status: "ZAPRIMLJENO",
          primljeno: new Date().toISOString(),
        });
      }, 900);
    });
  }

  /**
   * Omotač oko fetcha: JSON u oba smjera, prekid nakon isteka, jedinstveno
   * rukovanje greškama.
   */
  function posalji(putanja, podaci) {
    var kontroler = new AbortController();
    var mjeracIsteka = setTimeout(function () {
      kontroler.abort();
    }, Konfiguracija.ISTEK);

    return fetch(Konfiguracija.OSNOVNI_URL + putanja, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(podaci),
      signal: kontroler.signal,
    })
      .then(function (odgovor) {
        clearTimeout(mjeracIsteka);

        if (!odgovor.ok) {
          return odgovor
            .json()
            .catch(function () {
              return {};
            })
            .then(function (tijelo) {
              throw GreskaApija(
                tijelo.message || "Poslužitelj je odbio zahtjev.",
                odgovor.status
              );
            });
        }

        return odgovor.json();
      })
      .catch(function (greska) {
        clearTimeout(mjeracIsteka);

        if (greska.name === "AbortError") {
          throw GreskaApija("Poslužitelj predugo ne odgovara.", 0);
        }

        throw greska;
      });
  }

  /**
   * Šalje zahtjev za rezervacijom.
   *
   * Ključevi su namjerno na engleskom jer odgovaraju polju u budućem Spring
   * Boot DTO-u i stupcima u Supabase tablici; hrvatski je u sučelju, engleski
   * na granici prema poslužitelju.
   *
   * @param {Object} rezervacija — vidi Forma.prikupi() u form.js
   * @returns {Promise<Object>}
   */
  function posaljiRezervaciju(rezervacija) {
    var tijelo = {
      fullName: rezervacija.ime,
      phone: rezervacija.telefon,
      email: rezervacija.email || null,
      reservationDate: rezervacija.datum,
      reservationTime: rezervacija.vrijeme,
      partySize: Number(rezervacija.osobe),
      occasion: rezervacija.prigoda || null,
      note: rezervacija.napomena || null,
    };

    if (Konfiguracija.MOCK) {
      return mockOdgovor(tijelo);
    }

    return posalji(Putanje.rezervacije, tijelo);
  }

  global.SZS = global.SZS || {};
  global.SZS.api = {
    konfiguracija: Konfiguracija,
    posaljiRezervaciju: posaljiRezervaciju,
  };
})(window);
