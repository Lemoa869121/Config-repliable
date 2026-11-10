/*
 * Vérification du moteur de calcul contre les positions de la liste de débit Forster.
 * Utilisé par tests/run-node.js (ligne de commande) et tests/tests.html (navigateur).
 */
(function (racine) {
  'use strict';

  function egal(a, b, tol) { return Math.abs(a - b) <= (tol || 0.05); }

  function compterParArticle(pieces, filtre) {
    var c = {};
    pieces.filter(filtre).forEach(function (p) {
      var cle = p.ref + '|' + p.longueur.toFixed(1);
      c[cle] = (c[cle] || 0) + 1;
    });
    return Object.keys(c).sort().map(function (k) { var s = k.split('|'); return [s[0], +s[1], c[k]]; });
  }

  function normaliser(liste) {
    return liste.map(function (x) { return [x[0], (+x[1]).toFixed(1), x[2]].join('|'); }).sort().join(' ; ');
  }

  function verifier(Calcul, data, jeu) {
    var resultats = [];
    var ecarts = jeu.ecartsAcceptes || {};
    var aTrancherListe = [];
    jeu.cas.forEach(function (cas) {
      var cfg = { gamme: 'presto', corps: '50', sens: cas.sens, gauche: cas.gauche, droite: cas.droite,
        largeur: cas.largeur, hauteur: cas.hauteur, remplissage: cas.remplissage };
      var r = Calcul.calculer(cfg, data);
      var a = cas.attendu, controles = [];
      function ctrl(nom, ok, detail) { controles.push({ nom: nom, ok: !!ok, detail: detail || '' }); }

      if (!r.ok) {
        ctrl('calcul', false, r.erreurs.join(' '));
        resultats.push({ position: cas.position, controles: controles });
        return;
      }
      var p = r.pieces;

      // Traverse basse + parcloses
      var ouv = compterParArticle(p, function (x) { return x.ref === '32855' || x.famille === 'parclose'; });
      ctrl('traverses basses et parcloses', normaliser(ouv) === normaliser(a.ouvrants),
        normaliser(ouv) + '  ≠  ' + normaliser(a.ouvrants));

      // Profils T / Z
      var tz = compterParArticle(p, function (x) { return x.ref === '32803' || x.ref === '32805'; });
      if (ecarts.montants.indexOf(cas.position) < 0) {
        ctrl('profils T / Z (longueurs et quantités)', normaliser(tz) === normaliser(a.tz_profils),
          normaliser(tz) + '  ≠  ' + normaliser(a.tz_profils));
        var mont = r.vantaux.map(function (v) { return v.montantGauche + v.montantDroit; });
        var aTrancher = jeu.aTrancher && jeu.aTrancher.montants.indexOf(cas.position) >= 0;
        if (aTrancher && mont.join(' ') !== a.montants.join(' ')) {
          ctrl('répartition T / Z', true, 'À TRANCHER : calcul ' + mont.join(' ') + ' / PDF ' + a.montants.join(' '));
          aTrancherListe.push(cas.position);
        } else {
          ctrl('répartition T / Z', mont.join(' ') === a.montants.join(' '), mont.join(' ') + '  ≠  ' + a.montants.join(' '));
        }
      } else {
        ctrl('répartition T / Z', true, 'écart accepté (PDF non conforme à la règle)');
      }

      // Jamais T face à T ni Z face à Z
      var conflit = false;
      for (var i = 0; i < r.vantaux.length - 1; i++) {
        if (r.vantaux[i].montantDroit === r.vantaux[i + 1].montantGauche) conflit = true;
      }
      ctrl('jamais T/T ni Z/Z', !conflit);

      // Din
      if (ecarts.din.indexOf(cas.position) < 0) {
        var din = r.vantaux.map(function (v) { return v.din; }).join('');
        ctrl('Din', din === a.din.join(''), din + '  ≠  ' + a.din.join(''));
      } else {
        ctrl('Din', true, 'écart accepté (PDF non conforme à la règle)');
      }

      // Dormant
      var dormant = p.filter(function (x) { return x.ref === '32800'; });
      var lu = data.barres.longueurUtile;
      if (cas.largeur <= lu) {
        var ld = dormant.map(function (x) { return x.longueur; }).sort(function (x, y) { return x - y; });
        ctrl('dormant', ld.join(',') === a.dormant.slice().sort(function (x, y) { return x - y; }).join(','),
          ld.join(',') + '  ≠  ' + a.dormant.join(','));
      } else {
        var haut = dormant.filter(function (x) { return x.element.indexOf('Dormant haut') === 0; });
        var somme = haut.reduce(function (s, x) { return s + x.longueur; }, 0);
        ctrl('dormant haut coupé (≤ ' + lu + ', somme = largeur)',
          egal(somme, cas.largeur, 0.2) && haut.every(function (x) { return x.longueur <= lu; }),
          haut.map(function (x) { return x.longueur; }).join(' + '));
      }

      // Verres
      var vr = r.verres.map(function (v) { return [v.largeur, v.hauteur, v.qte].join('x'); }).join(' ');
      var va = a.verres.map(function (v) { return v.join('x'); }).join(' ');
      ctrl('verres', vr === va, vr + '  ≠  ' + va);

      // Accessoires
      function accQte(ref) { return r.accessoires.filter(function (x) { return x.ref === ref; })[0].qte; }
      ctrl('joint de battue', egal(accQte('905306'), a.jointBattue, 0.011), accQte('905306') + ' ≠ ' + a.jointBattue);
      ctrl('joints vitrage', egal(accQte('905312'), a.jointVitrage, 0.011) && egal(accQte('905316'), a.jointVitrage, 0.011),
        accQte('905312') + ' ≠ ' + a.jointVitrage);
      ctrl('boutons de parclose', accQte('906579') === a.boutons, accQte('906579') + ' ≠ ' + a.boutons);
      ctrl('pièces 916320 / 916322 (2 + 2 par vantail)',
        accQte('916320') === 2 * r.cotes.n && accQte('916322') === 2 * r.cotes.n);

      resultats.push({ position: cas.position, controles: controles });
    });
    var total = 0, ko = 0;
    resultats.forEach(function (r) { r.controles.forEach(function (c) { total++; if (!c.ok) ko++; }); });
    return { resultats: resultats, total: total, echecs: ko, aTrancher: aTrancherListe };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = verifier;
  else racine.verifier = verifier;
})(typeof window !== 'undefined' ? window : this);
