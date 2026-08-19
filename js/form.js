/* ==========================================================================
   Rezervacijska forma — validacija i slanje.

   Validira se na hrvatskom i u pregledniku (novalidate na <form> gasi
   preglednikove poruke). Poslužitelj kad dođe mora validirati ponovno —
   ovo je udobnost za korisnika, ne sigurnosna provjera.
   ========================================================================== */

(function (global) {
  "use strict";

  var forma = document.getElementById("forma-rezervacije");
  if (!forma) return;

  var poruka = document.getElementById("forma-poruka");
  var gumb = forma.querySelector('button[type="submit"]');
  var salje = false;

  /* --- Pravila -----------------------------------------------------------
     Svako pravilo vraća tekst greške ili null ako je vrijednost u redu. */

  var pravila = {
    ime: function (vrijednost) {
      if (!vrijednost) return "Upišite ime i prezime.";
      if (vrijednost.length < 3) return "Ime je prekratko.";
      return null;
    },

    telefon: function (vrijednost) {
      if (!vrijednost) return "Upišite broj telefona.";
      // Namjerno široko: prihvaća 091 234 5678, +385 1 6603 913, (01) 660-3913.
      // Uži uzorak bi odbijao valjane brojeve, a broj ionako provjerava čovjek.
      var znamenke = vrijednost.replace(/[^\d]/g, "");
      if (znamenke.length < 8) return "Broj izgleda prekratko.";
      if (!/^[\d\s+()/.-]+$/.test(vrijednost)) return "Broj sadrži nedopuštene znakove.";
      return null;
    },

    email: function (vrijednost) {
      if (!vrijednost) return null; // e-mail nije obavezan
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(vrijednost))
        return "Provjerite adresu e-pošte.";
      return null;
    },

    datum: function (vrijednost) {
      if (!vrijednost) return "Odaberite datum.";

      var odabrani = new Date(vrijednost + "T00:00:00");
      if (isNaN(odabrani.getTime())) return "Datum nije valjan.";

      var danas = new Date();
      danas.setHours(0, 0, 0, 0);
      if (odabrani < danas) return "Datum je u prošlosti.";

      // Rezervacije više od godine unaprijed gotovo sigurno su greška u unosu
      var godinaUnaprijed = new Date(danas);
      godinaUnaprijed.setFullYear(godinaUnaprijed.getFullYear() + 1);
      if (odabrani > godinaUnaprijed) return "Datum je predaleko u budućnosti.";

      return null;
    },

    vrijeme: function (vrijednost) {
      if (!vrijednost) return "Odaberite vrijeme.";
      return null;
    },

    osobe: function (vrijednost) {
      if (!vrijednost) return "Odaberite broj osoba.";
      return null;
    },
  };

  /* --- Prikaz grešaka ----------------------------------------------------- */

  function postaviGresku(polje, tekst) {
    var omotac = polje.closest(".polje");
    var element = document.getElementById("greska-" + polje.name);

    if (tekst) {
      omotac.classList.add("ima-gresku");
      polje.setAttribute("aria-invalid", "true");
      if (element) element.textContent = tekst;
    } else {
      omotac.classList.remove("ima-gresku");
      polje.removeAttribute("aria-invalid");
      if (element) element.textContent = "";
    }
  }

  function provjeriPolje(polje) {
    var pravilo = pravila[polje.name];
    if (!pravilo) return true;

    var greska = pravilo(polje.value.trim());
    postaviGresku(polje, greska);
    return !greska;
  }

  function provjeriSve() {
    var ispravno = true;
    var prvoNeispravno = null;

    Object.keys(pravila).forEach(function (ime) {
      var polje = forma.elements[ime];
      if (!polje) return;

      if (!provjeriPolje(polje)) {
        ispravno = false;
        if (!prvoNeispravno) prvoNeispravno = polje;
      }
    });

    if (prvoNeispravno) prvoNeispravno.focus();
    return ispravno;
  }

  /* --- Reakcija na unos ---------------------------------------------------
     Greška se prvi put prikazuje tek na blur ili na slanje — javljati se dok
     korisnik još tipka je nametljivo. Nakon što se jednom pojavi, ispravlja
     se u stvarnom vremenu. */

  Object.keys(pravila).forEach(function (ime) {
    var polje = forma.elements[ime];
    if (!polje) return;

    polje.addEventListener("blur", function () {
      provjeriPolje(polje);
    });

    polje.addEventListener("input", function () {
      if (polje.closest(".polje").classList.contains("ima-gresku")) {
        provjeriPolje(polje);
      }
    });
  });

  /* --- Prikupljanje i slanje ---------------------------------------------- */

  function prikupi() {
    return {
      ime: forma.elements.ime.value.trim(),
      telefon: forma.elements.telefon.value.trim(),
      email: forma.elements.email.value.trim(),
      datum: forma.elements.datum.value,
      vrijeme: forma.elements.vrijeme.value,
      osobe: forma.elements.osobe.value,
      prigoda: forma.elements.prigoda.value,
      napomena: forma.elements.napomena.value.trim(),
    };
  }

  function postaviPoruku(tekst, vrsta) {
    poruka.textContent = tekst;
    poruka.classList.remove("je-uspjeh", "je-greska");
    if (vrsta) poruka.classList.add(vrsta);
  }

  function zakljucaj(zakljucano) {
    salje = zakljucano;
    gumb.disabled = zakljucano;
    gumb.textContent = zakljucano ? "Šaljem…" : "Pošalji zahtjev";
  }

  forma.addEventListener("submit", function (dogadaj) {
    dogadaj.preventDefault();
    if (salje) return;

    // Zamka za robote: ako je skriveno polje ispunjeno, tiho odustajemo
    if (forma.elements.web && forma.elements.web.value) return;

    postaviPoruku("", null);

    if (!provjeriSve()) {
      postaviPoruku("Provjerite označena polja.", "je-greska");
      return;
    }

    zakljucaj(true);

    global.SZS.api
      .posaljiRezervaciju(prikupi())
      .then(function () {
        forma.reset();
        postaviPoruku(
          "Hvala, zahtjev je zaprimljen. Javljamo se s potvrdom u najkraćem roku.",
          "je-uspjeh"
        );
      })
      .catch(function (greska) {
        console.error("Slanje rezervacije nije uspjelo:", greska);
        postaviPoruku(
          "Slanje nije uspjelo. Pokušajte ponovno ili nas nazovite na 01 6603 913.",
          "je-greska"
        );
      })
      .finally(function () {
        zakljucaj(false);
      });
  });

  /* --- Datum: ne dopuštamo odabir prošlosti u samom biraču ---------------- */

  var poljeDatum = forma.elements.datum;
  if (poljeDatum) {
    var danas = new Date();
    var mjesec = String(danas.getMonth() + 1).padStart(2, "0");
    var dan = String(danas.getDate()).padStart(2, "0");
    poljeDatum.min = danas.getFullYear() + "-" + mjesec + "-" + dan;
  }
})(window);
