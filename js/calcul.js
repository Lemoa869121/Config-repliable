/*
 * Config-repliable – moteur de calcul
 * Fonctions pures : aucune dépendance au navigateur, utilisables aussi sous Node (tests).
 *
 * Notations : L = largeur de baie, H = hauteur de baie, n = nombre de vantaux,
 * k = vantaux repliés à gauche, m = vantaux repliés à droite (n = k + m).
 */
(function (racine) {
  'use strict';

  /* ---------- Arrondis ---------- */
  function arrondi(x, decimales) {
    var f = Math.pow(10, decimales || 0);
    return Math.round(x * f + (x >= 0 ? 1e-6 : -1e-6)) / f;
  }

  /* ---------- Din de chaque vantail ----------
   * Extérieur : groupe gauche depuis le mur L, R, L… ; groupe droit depuis le mur R, L, R…
   * Intérieur : inverse.
   */
  function dinVantaux(k, m, sens) {
    var res = [], i;
    for (i = 0; i < k; i++) res.push(i % 2 === 0 ? 'L' : 'R');
    var droite = [];
    for (i = 0; i < m; i++) droite.push(i % 2 === 0 ? 'R' : 'L');
    res = res.concat(droite.reverse());
    if (sens === 'int') res = res.map(function (d) { return d === 'L' ? 'R' : 'L'; });
    return res;
  }

  /* ---------- Montants T / Z ----------
   * Règle générale : jamais T face à T ni Z face à Z.
   * Positions confirmées par Forster le 10/11/2026 : A 3+2 = TT ZZ TT ZT ZT ; I 3+2 = ZZ TT ZZ TT ZZ.
   * L'intérieur n'est donc PAS le simple inverse de l'extérieur.
   */
  function inverserTZ(s) {
    return s.split('').map(function (c) { return c === 'T' ? 'Z' : 'T'; }).join('');
  }
  function oppose(x) { return x === 'T' ? 'Z' : 'T'; }

  /* Extérieur – par jonctions. 'TZ' = montant droit du vantail de gauche en T, montant gauche du suivant en Z.
   *  - montants contre le dormant : T ;
   *  - groupe gauche depuis le mur : T|Z, Z|T, T|Z… ;
   *  - 1 vantail à droite : rencontre Z|T ; 2 ou plus : rencontre T|Z puis T|Z, Z|T… depuis la rencontre ;
   *  - tout à droite : miroir de « tout à gauche ».
   */
  function jonctionsExterieur(k, m) {
    var j = [], i;
    for (i = 0; i < k - 1; i++) j.push(i % 2 === 0 ? 'TZ' : 'ZT');
    if (m === 0) return j;
    if (m === 1) { j.push('ZT'); return j; }
    j.push('TZ');
    for (i = 0; i < m - 1; i++) j.push(i % 2 === 0 ? 'TZ' : 'ZT');
    return j;
  }

  function montantsExterieur(k, m) {
    var n = k + m;
    var jonctions = k === 0
      ? jonctionsExterieur(m, 0).reverse().map(function (s) { return s[1] + s[0]; })
      : jonctionsExterieur(k, m);
    var v = [], i;
    for (i = 0; i < n; i++) v.push({ g: 'T', d: 'T' });
    for (i = 0; i < n - 1; i++) { v[i].d = jonctions[i][0]; v[i + 1].g = jonctions[i][1]; }
    return v;
  }

  /* Intérieur – par groupes, profils inversés (montants contre le dormant en Z) :
   *  - chaque groupe alterne ZZ, TT, ZZ… en partant de son mur ;
   *  - en cas de conflit à la rencontre, un seul vantail mixte (le dernier du groupe gauche
   *    s'il n'y a qu'un vantail à droite, sinon le premier du groupe droit).
   */
  function montantsInterieur(k, m) {
    var n = k + m, v = [], i;
    for (i = 0; i < k; i++) { var a = i % 2 === 0 ? 'T' : 'Z'; v.push({ g: a, d: a }); }
    var droite = [];
    for (i = 0; i < m; i++) { var b = i % 2 === 0 ? 'T' : 'Z'; droite.push({ g: b, d: b }); }
    v = v.concat(droite.reverse());
    v[0].g = 'T'; v[n - 1].d = 'T';
    if (k >= 1 && m >= 1 && v[k - 1].d === v[k].g) {
      if (m === 1) v[k - 1].d = oppose(v[k].g);
      else v[k].g = oppose(v[k - 1].d);
    }
    return v.map(function (x) { return { g: inverserTZ(x.g), d: inverserTZ(x.d) }; });
  }

  /* Profil (T ou Z) des montants gauche / droit de chaque vantail */
  function montantsVantaux(k, m, sens) {
    return sens === 'int' ? montantsInterieur(k, m) : montantsExterieur(k, m);
  }

  /* ---------- Coupe d'une pièce trop longue sur les axes des vantaux ---------- */
  function decouperSurAxes(axes, longueurUtile) {
    // axes : largeurs d'axe successives (somme = longueur totale)
    var total = axes.reduce(function (a, b) { return a + b; }, 0);
    if (total <= longueurUtile + 1e-9) return [total];
    var bornes = [], cumul = 0, i;
    for (i = 0; i < axes.length - 1; i++) { cumul += axes[i]; bornes.push(cumul); }
    var meilleur = null;
    // Nombre minimal de morceaux, puis morceaux les plus équilibrés (plus grand morceau le plus petit)
    for (var nb = 2; nb <= axes.length && !meilleur; nb++) {
      combinaisons(bornes.length, nb - 1).forEach(function (choix) {
        var pts = [0].concat(choix.map(function (c) { return bornes[c]; }), [total]);
        var morceaux = [];
        for (var p = 0; p < pts.length - 1; p++) morceaux.push(pts[p + 1] - pts[p]);
        var maxi = Math.max.apply(null, morceaux);
        if (maxi > longueurUtile + 1e-9) return;
        var mini = Math.min.apply(null, morceaux);
        if (!meilleur || maxi < meilleur.maxi - 1e-9 ||
            (Math.abs(maxi - meilleur.maxi) < 1e-9 && mini > meilleur.mini + 1e-9)) {
          meilleur = { morceaux: morceaux, maxi: maxi, mini: mini };
        }
      });
    }
    return meilleur ? meilleur.morceaux : null; // null : impossible (un axe dépasse la barre)
  }

  function combinaisons(n, p) {
    var res = [];
    (function rec(debut, courant) {
      if (courant.length === p) { res.push(courant.slice()); return; }
      for (var i = debut; i < n; i++) { courant.push(i); rec(i + 1, courant); courant.pop(); }
    })(0, []);
    return res;
  }

  /* ---------- Optimisation des barres (premier ajustement décroissant) ---------- */
  function optimiserBarres(longueurs, longueurUtile, traitDeScie) {
    var pieces = longueurs.slice().sort(function (a, b) { return b - a; });
    var barres = [];
    pieces.forEach(function (l) {
      var place = false;
      for (var i = 0; i < barres.length; i++) {
        var besoin = l + (barres[i].pieces.length ? traitDeScie : 0);
        if (barres[i].reste + 1e-9 >= besoin) {
          barres[i].pieces.push(l); barres[i].reste -= besoin; place = true; break;
        }
      }
      if (!place) barres.push({ pieces: [l], reste: longueurUtile - l });
    });
    var net = longueurs.reduce(function (a, b) { return a + b; }, 0);
    var brut = barres.length * longueurUtile;
    return {
      barres: barres,
      nombre: barres.length,
      netMm: net,
      chutePct: brut ? arrondi((brut - net) / brut * 100, 1) : 0
    };
  }

  /* ---------- Contrôle des saisies ---------- */
  function controler(cfg, data) {
    var erreurs = [], alertes = [];
    var lim = data.limites || {};
    var n = cfg.gauche + cfg.droite;
    if (!(cfg.largeur > 0)) erreurs.push('Indiquez la largeur de baie.');
    if (!(cfg.hauteur > 0)) erreurs.push('Indiquez la hauteur de baie.');
    if (n < (lim.vantauxMin || 2)) erreurs.push('Il faut au moins ' + (lim.vantauxMin || 2) + ' vantaux.');
    if (lim.vantauxMax && n > lim.vantauxMax) erreurs.push('Maximum ' + lim.vantauxMax + ' vantaux.');
    if (!data.corps[cfg.corps]) erreurs.push('Épaisseur de profil non disponible pour le moment.');
    if (!data.remplissages[cfg.remplissage]) erreurs.push('Remplissage non disponible pour le moment.');
    ['largeur', 'hauteur'].forEach(function (c) {
      var min = lim[c + 'Min'], max = lim[c + 'Max'];
      if (min && cfg[c] < min) alertes.push('La ' + c + ' est inférieure au minimum (' + min + ' mm).');
      if (max && cfg[c] > max) alertes.push('La ' + c + ' dépasse le maximum (' + max + ' mm).');
    });
    var listes = data.configurationsVerifiees || {};
    var verifiee = (listes[cfg.sens] || []).some(function (c) {
      return c[0] === cfg.gauche && c[1] === cfg.droite;
    });
    if (!verifiee && n >= 2) {
      alertes.push('Répartition ' + cfg.gauche + ' à gauche / ' + cfg.droite +
        ' à droite en ouverture ' + (cfg.sens === 'int' ? 'intérieure' : 'extérieure') +
        ' non vérifiée sur un exemple Forster : contrôlez les T / Z et les Din sur le schéma.');
    }
    return { erreurs: erreurs, alertes: alertes };
  }

  /* ---------- Calcul complet ---------- */
  function calculer(cfg, data) {
    var ctl = controler(cfg, data);
    if (ctl.erreurs.length) return { ok: false, erreurs: ctl.erreurs, alertes: ctl.alertes };

    var corps = data.corps[cfg.corps];
    var c = corps.cotes, art = corps.articles;
    var remp = data.remplissages[cfg.remplissage];
    var acc = data.accessoires;
    var barresCfg = data.barres;
    var k = cfg.gauche, m = cfg.droite, n = k + m;
    var L = cfg.largeur, H = cfg.hauteur;

    var LvBrut = (L - c.dormantLargeur) / n + c.recouvrementOuvrant;
    var Lv = arrondi(LvBrut, 1);
    var Hv = H - c.dormantHauteur;
    // Largeurs d'axe (cotes du schéma) : valeurs exactes pour les calculs, arrondies pour l'affichage
    var axesBruts = [];
    for (var i = 0; i < n; i++) axesBruts.push(LvBrut + (i === 0 || i === n - 1 ? c.axeExtreme : c.axeCourant));
    var axes = axesBruts.map(function (x) { return arrondi(x, 1); });

    var din = dinVantaux(k, m, cfg.sens);
    var montants = montantsVantaux(k, m, cfg.sens);
    var profilTraverseHaute = cfg.sens === 'int' ? 'Z' : 'T';

    var pieces = []; // { famille, ref, designation, longueur, coupe, element, vantail }
    function ajouter(famille, article, longueur, coupe, element, vantail) {
      pieces.push({ famille: famille, ref: article.ref, designation: article.designation,
        longueur: arrondi(longueur, 1), coupe: coupe, element: element, vantail: vantail || null });
    }

    // Dormant
    var morceauxHaut = decouperSurAxes(axesBruts, barresCfg.longueurUtile);
    var alertes = ctl.alertes.slice();
    if (!morceauxHaut) {
      morceauxHaut = [L];
      alertes.push('Le dormant haut ne peut pas être coupé sur un axe de vantail en morceaux de ' +
        barresCfg.longueurUtile + ' mm maximum.');
    }
    morceauxHaut.forEach(function (lg, idx) {
      var gauche = idx === 0 ? '45°' : '90°', droite = idx === morceauxHaut.length - 1 ? '45°' : '90°';
      ajouter('profil', art.dormant, lg, gauche + ' / ' + droite,
        morceauxHaut.length > 1 ? 'Dormant haut (morceau ' + (idx + 1) + '/' + morceauxHaut.length + ')' : 'Dormant haut');
    });
    ajouter('profil', art.dormant, H, '45° haut / 90° bas', 'Dormant gauche');
    ajouter('profil', art.dormant, H, '45° haut / 90° bas', 'Dormant droit');
    if (H > barresCfg.longueurUtile) {
      alertes.push('Les montants de dormant dépassent ' + barresCfg.longueurUtile + ' mm : cas non prévu.');
    }

    // Ouvrants
    for (var v = 1; v <= n; v++) {
      ajouter('profil', art[profilTraverseHaute], Lv, '45° / 45°', 'Traverse haute', v);
      ajouter('profil', art[montants[v - 1].g], Hv, '45° haut / 90° bas', 'Montant gauche', v);
      ajouter('profil', art[montants[v - 1].d], Hv, '45° haut / 90° bas', 'Montant droit', v);
      ajouter('profil', art.traverseBasse, Lv - c.traverseBasse, '90° / 90°', 'Traverse basse', v);
      for (var p = 0; p < 2; p++) ajouter('parclose', remp.parclose, Lv - c.parcloseHorizontale, 'droite', 'Parclose horizontale', v);
      for (p = 0; p < 2; p++) ajouter('parclose', remp.parclose, Hv - c.parcloseVerticale, 'droite', 'Parclose verticale', v);
    }

    // Débit regroupé (article + longueur + coupe)
    var debit = [];
    pieces.forEach(function (pc) {
      var cle = pc.ref + '|' + pc.longueur + '|' + pc.coupe + '|' + pc.element.replace(/ \(morceau.*\)/, '');
      var ligne = debit.filter(function (d) { return d.cle === cle; })[0];
      if (!ligne) {
        ligne = { cle: cle, famille: pc.famille, ref: pc.ref, designation: pc.designation, longueur: pc.longueur,
          coupe: pc.coupe, element: pc.element.replace(/ \(morceau.*\)/, ''), qte: 0, vantaux: [] };
        debit.push(ligne);
      }
      ligne.qte++;
      if (pc.vantail && ligne.vantaux.indexOf(pc.vantail) < 0) ligne.vantaux.push(pc.vantail);
    });
    debit.sort(function (a, b) {
      return a.famille.localeCompare(b.famille) || a.ref.localeCompare(b.ref) || b.longueur - a.longueur;
    });

    // Barres par article
    var parArticle = {};
    pieces.forEach(function (pc) {
      (parArticle[pc.ref] = parArticle[pc.ref] || { ref: pc.ref, designation: pc.designation, famille: pc.famille, longueurs: [] })
        .longueurs.push(pc.longueur);
    });
    var barres = Object.keys(parArticle).sort().map(function (ref) {
      var a = parArticle[ref];
      var opt = optimiserBarres(a.longueurs, barresCfg.longueurUtile, barresCfg.traitDeScie);
      return { ref: ref, designation: a.designation, famille: a.famille, pieces: a.longueurs.length,
        ml: arrondi(opt.netMm / 1000, 2), barres: opt.nombre, chutePct: opt.chutePct, detail: opt.barres };
    });

    // Accessoires
    var mlParclose = arrondi(pieces.filter(function (x) { return x.famille === 'parclose'; })
      .reduce(function (s, x) { return s + x.longueur; }, 0) / 1000, 2);
    var feuillureL = Lv - c.feuillure, feuillureH = Hv - c.feuillure;
    var mlJointVitrage = arrondi(n * 2 * (feuillureL + feuillureH) / 1000, 2);
    var mlJointBattue = arrondi(n * (2 * Lv + 4 * Hv - c.jointBattueConstante) / 1000, 2);
    var accessoires = [
      { ref: acc.jointBattue.ref, designation: acc.jointBattue.designation, qte: mlJointBattue, unite: 'ML', aConfirmer: true },
      { ref: acc.jointVitrageExt.ref, designation: acc.jointVitrageExt.designation, qte: mlJointVitrage, unite: 'ML' },
      { ref: acc.jointVitrageInt.ref, designation: acc.jointVitrageInt.designation, qte: mlJointVitrage, unite: 'ML' },
      { ref: acc.boutonParclose.ref, designation: acc.boutonParclose.designation,
        qte: Math.floor(mlParclose / acc.boutonParclose.pasMetres + 0.5), unite: 'Pce' }
    ];
    acc.piecesAngle.forEach(function (a) {
      accessoires.push({ ref: a.ref, designation: a.designation, qte: a.parVantail * n, unite: 'Pce' });
    });

    // Verres
    var vL = Math.floor(Lv - c.verre + 0.5), vH = Math.floor(Hv - c.verre + 0.5);
    var verres = [{ libelle: remp.libelle, qte: n, largeur: vL, hauteur: vH,
      m2Unitaire: arrondi(vL * vH / 1e6, 2), m2Total: arrondi(n * vL * vH / 1e6, 2) }];

    return {
      ok: true,
      alertes: alertes,
      aConfirmer: data.aConfirmer || [],
      entree: cfg,
      cotes: { n: n, Lv: Lv, Hv: Hv, axes: axes, feuillure: [arrondi(feuillureL, 1), feuillureH] },
      vantaux: din.map(function (d, idx) {
        return { numero: idx + 1, din: d, montantGauche: montants[idx].g, montantDroit: montants[idx].d,
          traverseHaute: profilTraverseHaute, cote: idx < k ? 'gauche' : 'droite' };
      }),
      pieces: pieces,
      debit: debit,
      barres: barres,
      accessoires: accessoires,
      verres: verres
    };
  }

  var api = {
    calculer: calculer,
    dinVantaux: dinVantaux,
    montantsVantaux: montantsVantaux,
    decouperSurAxes: decouperSurAxes,
    optimiserBarres: optimiserBarres,
    arrondi: arrondi
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.Calcul = api;
})(typeof window !== 'undefined' ? window : this);
