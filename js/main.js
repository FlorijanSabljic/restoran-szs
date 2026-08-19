/* ==========================================================================
   Ponašanje stranice: navigacija, otkrivanje pri skrolanju, galerija.
   ========================================================================== */

(function () {
  "use strict";

  var smanjenoKretanje = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======================================================================
     Navigacija — pozadina se pojavljuje tek kad se stranica pomakne
     ====================================================================== */

  (function navigacijaPriSkrolanju() {
    var navigacija = document.getElementById("navigacija");
    if (!navigacija) return;

    var cekaOkvir = false;

    function osvjezi() {
      navigacija.classList.toggle("je-pomaknuta", window.scrollY > 24);
      cekaOkvir = false;
    }

    // requestAnimationFrame drži posao na jednom čitanju po okviru — bez toga
    // se scroll handler okida stotinama puta u sekundi.
    window.addEventListener(
      "scroll",
      function () {
        if (cekaOkvir) return;
        cekaOkvir = true;
        window.requestAnimationFrame(osvjezi);
      },
      { passive: true }
    );

    osvjezi();
  })();

  /* ======================================================================
     Mobilni izbornik
     ====================================================================== */

  (function mobilniIzbornik() {
    var gumb = document.getElementById("hamburger");
    var izbornik = document.getElementById("izbornik");
    if (!gumb || !izbornik) return;

    function postavi(otvoren) {
      gumb.setAttribute("aria-expanded", String(otvoren));
      gumb.setAttribute("aria-label", otvoren ? "Zatvori izbornik" : "Otvori izbornik");
      izbornik.classList.toggle("je-otvoren", otvoren);
      document.body.classList.toggle("izbornik-otvoren", otvoren);
    }

    gumb.addEventListener("click", function () {
      postavi(gumb.getAttribute("aria-expanded") !== "true");
    });

    // Klik na poveznicu zatvara izbornik — inače ostane preko odredišta
    izbornik.addEventListener("click", function (dogadaj) {
      if (dogadaj.target.closest("a")) postavi(false);
    });

    document.addEventListener("keydown", function (dogadaj) {
      if (dogadaj.key === "Escape") postavi(false);
    });

    // Prelaskom na široki ekran izbornik prestaje biti preklop
    window.matchMedia("(min-width: 900px)").addEventListener("change", function (upit) {
      if (upit.matches) postavi(false);
    });
  })();

  /* ======================================================================
     Označavanje aktivne sekcije u navigaciji
     ====================================================================== */

  (function aktivnaSekcija() {
    var linkovi = Array.prototype.slice.call(
      document.querySelectorAll('.navigacija__linkovi a[href^="#"]:not(.gumb)')
    );
    if (!linkovi.length || !("IntersectionObserver" in window)) return;

    var sekcije = linkovi
      .map(function (link) {
        return document.querySelector(link.getAttribute("href"));
      })
      .filter(Boolean);

    var promatrac = new IntersectionObserver(
      function (unosi) {
        unosi.forEach(function (unos) {
          if (!unos.isIntersecting) return;

          linkovi.forEach(function (link) {
            link.classList.toggle(
              "je-aktivan",
              link.getAttribute("href") === "#" + unos.target.id
            );
          });
        });
      },
      // Uska vodoravna traka po sredini ekrana: aktivna je sekcija koja je
      // trenutno pred očima, a ne ona koja tek ulazi u vidokrug.
      { rootMargin: "-45% 0px -45% 0px" }
    );

    sekcije.forEach(function (sekcija) {
      promatrac.observe(sekcija);
    });
  })();

  /* ======================================================================
     Otkrivanje sadržaja pri skrolanju
     ====================================================================== */

  (function otkrivanje() {
    var elementi = Array.prototype.slice.call(document.querySelectorAll("[data-otkrij]"));
    if (!elementi.length) return;

    // Bez podrške ili uz isključene animacije sve je odmah vidljivo
    if (smanjenoKretanje || !("IntersectionObserver" in window)) {
      elementi.forEach(function (element) {
        element.classList.add("je-vidljiv");
      });
      return;
    }

    // Elementi iz iste skupine (kartice, stavke galerije) ulaze u nizu
    ["kartice", "galerija__mreza"].forEach(function (skupina) {
      document.querySelectorAll("." + skupina).forEach(function (spremnik) {
        var djeca = spremnik.querySelectorAll("[data-otkrij]");
        djeca.forEach(function (dijete, redni) {
          dijete.style.setProperty("--kasnjenje", redni * 90 + "ms");
        });
      });
    });

    var promatrac = new IntersectionObserver(
      function (unosi, instanca) {
        unosi.forEach(function (unos) {
          if (!unos.isIntersecting) return;
          unos.target.classList.add("je-vidljiv");
          // Animacija se izvodi jednom; dalje promatranje je bespotrebno.
          instanca.unobserve(unos.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    elementi.forEach(function (element) {
      promatrac.observe(element);
    });

    // Sigurnosna mreža: sadržaj je skriven dok ga observer ne otkrije, pa bi
    // svaki propali observer značio praznu stranicu. Ako se dvije sekunde nakon
    // učitavanja nije otkrilo ništa, otkrivamo sve ručno.
    window.addEventListener("load", function () {
      setTimeout(function () {
        if (document.querySelector("[data-otkrij].je-vidljiv")) return;

        console.warn("Otkrivanje pri skrolanju nije se pokrenulo — prikazujem sve.");
        elementi.forEach(function (element) {
          element.classList.add("je-vidljiv");
        });
      }, 2000);
    });
  })();

  /* ======================================================================
     Galerija — uvećani prikaz

     Trenutno prikazuje isti placeholder s opisom. Kad stignu prave
     fotografije, u lightbox se umeće <img> s punom rezolucijom.
     ====================================================================== */

  (function lightbox() {
    var lightbox = document.getElementById("lightbox");
    var opis = document.getElementById("lightbox-opis");
    var zatvori = document.getElementById("lightbox-zatvori");
    var mreza = document.getElementById("galerija-mreza");
    if (!lightbox || !mreza) return;

    var zadnjiFokus = null;

    function otvori(stavka) {
      zadnjiFokus = stavka;
      opis.textContent = stavka.dataset.opis || "";
      lightbox.hidden = false;
      document.body.classList.add("izbornik-otvoren");
      zatvori.focus();
    }

    function sakrij() {
      lightbox.hidden = true;
      document.body.classList.remove("izbornik-otvoren");
      // Fokus se vraća odakle je došao — inače tipkovnički korisnik ostane
      // na vrhu dokumenta.
      if (zadnjiFokus) zadnjiFokus.focus();
    }

    mreza.addEventListener("click", function (dogadaj) {
      var stavka = dogadaj.target.closest(".galerija__stavka");
      if (stavka) otvori(stavka);
    });

    mreza.addEventListener("keydown", function (dogadaj) {
      if (dogadaj.key !== "Enter" && dogadaj.key !== " ") return;
      var stavka = dogadaj.target.closest(".galerija__stavka");
      if (!stavka) return;
      dogadaj.preventDefault(); // razmaknica inače skrola stranicu
      otvori(stavka);
    });

    zatvori.addEventListener("click", sakrij);

    lightbox.addEventListener("click", function (dogadaj) {
      if (dogadaj.target === lightbox) sakrij();
    });

    document.addEventListener("keydown", function (dogadaj) {
      if (dogadaj.key === "Escape" && !lightbox.hidden) sakrij();
    });
  })();

  /* ======================================================================
     Godina u podnožju se ne mora ručno održavati
     ====================================================================== */

  (function godina() {
    var mjesto = document.getElementById("godina");
    if (mjesto) mjesto.textContent = String(new Date().getFullYear());
  })();
})();
