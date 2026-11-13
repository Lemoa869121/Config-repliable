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
   * Extérieur (A 3+2 = L R L R R confirmé le 10/11/2026) : alternance L, R, L… depuis la gauche ;
   *   s'il y a au moins un vantail à droite, le dernier vantail est toujours R ; tout à droite : miroir.
   * Intérieur : groupe gauche depuis le mur L, R, L… ; groupe droit depuis le mur R, L, R… ; puis tout inversé.
   */
  function dinVantaux(k, m, sens) {
    var res = [], i, n = k + m;
    function inv(d) { return d === 'L' ? 'R' : 'L'; }
    if (sens === 'int') {
      for (i = 0; i < k; i++) res.push(i % 2 === 0 ? 'L' : 'R');
      var droite = [];
      for (i = 0; i < m; i++) droite.push(i % 2 === 0 ? 'R' : 'L');
      return res.concat(droite.reverse()).map(inv);
    }
    if (k === 0) return dinVantaux(m, 0, 'ext').reverse().map(inv);
    for (i = 0; i < n; i++) res.push(i % 2 === 0 ? 'L' : 'R');
    if (m >= 1) res[n - 1] = 'R';
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

  /* ---------- Quincaillerie FMF 150 (Mantion OPENTEC) ----------
   * Règles vérifiées sur les 40 devis Slidsoft (20 configurations × repli intérieur / extérieur) :
   *  - paumelles : par groupe de g vantaux, floor(g/2) + 1 sets ; groupe gauche 1 HOL + reste HOR,
   *    groupe droit reste HOL + 1 HOR (intérieur) ; extérieur : HOL <-> HOR ;
   *  - montures : floor((n - 1)/2) ; une EH remplace une IH si les deux côtés ont des vantaux en nombres
   *    de parités différentes (intérieur : EHL si le côté pair est à gauche ; extérieur : inversé) ;
   *  - aimants floor(n/2) + 1 ; pênes bas floor(n/2) ;
   * Règles Forster (10/11/2026) :
   *  - rail, profil bas, joint, seuil : barres de 6000 mm → arrondi supérieur de L / 6000 ;
   *  - supports : 1 à chaque bout + 1 tous les 500 mm → ceil(L / 500) + 1 supports, par sets de 4.
   */
  function quincaillerieFMF150(k, m, sens, largeur, q) {
    var n = k + m, a = q.articles;
    function sets(g) { return g > 0 ? Math.floor(g / 2) + 1 : 0; }
    var hol = (k > 0 ? 1 : 0) + (m > 0 ? sets(m) - 1 : 0);
    var hor = (k > 0 ? sets(k) - 1 : 0) + (m > 0 ? 1 : 0);
    if (sens === 'ext') { var t = hol; hol = hor; hor = t; }
    var montures = Math.floor((n - 1) / 2);
    var ehl = 0, ehr = 0;
    if (k > 0 && m > 0 && (k % 2) !== (m % 2) && montures > 0) {
      var pairAGauche = k % 2 === 0;
      if ((sens === 'int') === pairAGauche) ehl = 1; else ehr = 1;
    }
    var barres = Math.ceil(largeur / q.barres.longueur - 1e-9);
    var nbSupports = Math.ceil(largeur / q.supports.entraxe - 1e-9) + 1;
    var lignes = [
      [a.rail, barres], [a.profilBas, barres], [a.joint, barres], [a.seuil, barres],
      [a.montureIntermediaire, montures - ehl - ehr], [a.montureExtremiteGauche, ehl], [a.montureExtremiteDroite, ehr],
      [a.paumellesGauche, hol], [a.paumellesDroite, hor],
      [a.supports, Math.ceil(nbSupports / q.supports.parSet)],
      [a.aimant, Math.floor(n / 2) + 1], [a.pene, Math.floor(n / 2)],
      [a.gabarit, 1], [a.emballage, 1], [a.notice, 1]
    ];
    return lignes.filter(function (l) { return l[1] > 0; }).map(function (l) {
      return { ref: l[0].ref, designation: l[0].designation, qte: l[1], unite: 'Pce' };
    });
  }

  /* ---------- Quincaillerie FMF 100 (Mantion OPENTEC) ----------
   * Règles vérifiées sur les 80 devis Slidsoft (20 configurations × intérieur / extérieur × murale / plafond) :
   *  - aucun article gauche / droite : intérieur = extérieur ;
   *  - montures : floor((n - 1)/2) ; une GJ10430EH remplace une IH si les deux côtés ont des vantaux
   *    en nombres de parités différentes ;
   *  - 1512SOM12 = montures ; 1512SOG = 2 × n + 2 × côtés équipés + EH ;
   *  - GHLK-01 = montures ; GHLK-02 = nombre de côtés ayant un nombre impair de vantaux ≥ 3 ;
   *  - emballage (GH10430L en murale, GH10430LSB en plafond) seulement si les deux côtés ont des vantaux ;
   *  - fixation murale seulement : bandeau, équerres, supports et embouts de bandeau ;
   *    supports de bandeau : arrondi supérieur de L / 2500 (relevé Slidsoft, à confirmer).
   * Règles Forster (comme le FMF 150) : rail, bandeau, profil bas, joint, seuil en barres de 6000 mm ;
   *  équerres : 1 à chaque bout + 1 tous les 500 mm, par sets de 4.
   */
  function quincaillerieFMF100(k, m, largeur, fixation, q) {
    var n = k + m, a = q.articles, murale = fixation !== 'plafond';
    var montures = Math.floor((n - 1) / 2);
    var eh = (k > 0 && m > 0 && (k % 2) !== (m % 2) && montures > 0) ? 1 : 0;
    var cotes = (k > 0 ? 1 : 0) + (m > 0 ? 1 : 0);
    var impairs3 = [k, m].filter(function (g) { return g >= 3 && g % 2 === 1; }).length;
    var barres = Math.ceil(largeur / q.barres.longueur - 1e-9);
    var equerres = Math.ceil((Math.ceil(largeur / q.equerres.entraxe - 1e-9) + 1) / q.equerres.parSet);
    var emballage = (k > 0 && m > 0) ? 1 : 0;
    var lignes = [
      [a.rail, barres],
      [a.bandeau, murale ? barres : 0],
      [a.equerres, murale ? equerres : 0],
      [a.supportsBandeau, murale ? Math.ceil(largeur / q.supportsBandeau.largeurParSet - 1e-9) : 0],
      [a.emboutsBandeau, murale ? 1 : 0],
      [a.profilBas, barres], [a.joint, barres], [a.seuil, barres],
      [a.montureIntermediaire, montures - eh], [a.montureExtremite, eh],
      [a.charniereM12, montures], [a.charniereGraisseur, 2 * n + 2 * cotes + eh],
      [a.aimant26, montures], [a.aimant60, impairs3],
      [a.gabarit, 1],
      [murale ? a.emballageMural : a.emballagePlafond, emballage],
      [a.notice, 1]
    ];
    return lignes.filter(function (l) { return l[1] > 0; }).map(function (l) {
      return { ref: l[0].ref, designation: l[0].designation, qte: l[1], unite: 'Pce' };
    });
  }

  /* ---------- Fermeture : serrure, crémone, pièces de paumelle (consignes Forster du 13/11/2026) ----------
   *  - serrure sur toutes les portes : 1 point ou 3 points ;
   *  - crémone seulement si le nombre de vantaux est impair des deux côtés (3+1, 5+1, 3+3…) ;
   *  - pièces de paumelle FFR.065F à FFR.069F : quantités par paumelle Mantion
   *    (sets GJ10530HOL / HOR en FMF 150, charnières 1512SOG en FMF 100 ; aucune sans quincaillerie).
   * Les articles identiques (ex. F19.3976.41 de la serrure 3 points et de la crémone) sont additionnés.
   */
  function avecCremone(k, m) { return k % 2 === 1 && m % 2 === 1; }

  function fermeture(cfg, f, quincaillerie) {
    var lignes = [], index = {};
    function ajouter(a, qte, groupe) {
      if (!(qte > 0)) return;
      if (index[a.ref]) { index[a.ref].qte += qte; return; }
      index[a.ref] = { ref: a.ref, designation: a.designation, qte: qte, unite: 'Pce', groupe: groupe };
      lignes.push(index[a.ref]);
    }
    var serrure = f.serrures[cfg.serrure] || f.serrures['1pt'];
    serrure.articles.forEach(function (a) { ajouter(a, a.qte, 'Serrure'); });
    var cremone = null;
    if (avecCremone(cfg.gauche, cfg.droite)) {
      cremone = f.cremones[cfg.cremone] || f.cremones.levier;
      cremone.articles.forEach(function (a) { ajouter(a, a.qte, 'Crémone'); });
    }
    var refsPaumelles = (f.piecesPaumelle.paumellesMantion[cfg.quincaillerie] || []);
    var nbPaumelles = (quincaillerie || []).filter(function (q) { return refsPaumelles.indexOf(q.ref) >= 0; })
      .reduce(function (s, q) { return s + q.qte; }, 0);
    f.piecesPaumelle.articles.forEach(function (a) { ajouter(a, a.parPaumelle * nbPaumelles, 'Pièces de paumelle'); });
    return { lignes: lignes, serrure: serrure.libelle, cremone: cremone ? cremone.libelle : null, paumellesMantion: nbPaumelles };
  }

  /* ---------- Parclosage (tableau Forster Presto VP 3.8.22 / 3.8.23) ----------
   * Pour une épaisseur de remplissage y, liste des combinaisons parclose + joint extérieur + joint intérieur
   * possibles, triées par préférence : joint extérieur 905312 avant 905314 ; joint intérieur 905316,
   * puis 905315, puis 905317 ; à égalité, parclose la plus large.
   */
  function combinaisonsParclosage(y, p) {
    var pe = p.priorite.jointsExterieurs, pi = p.priorite.jointsInterieurs;
    return p.tableau.filter(function (l) { return l[0] === y; }).map(function (l) {
      return { cle: l[1] + '|' + l[2] + '|' + l[3], epaisseur: l[0], parclose: l[1], jointExterieur: l[2], jointInterieur: l[3], a2: l[4],
        b: p.parcloses[l[1]].b };
    }).sort(function (x, z) {
      return pe.indexOf(x.jointExterieur) - pe.indexOf(z.jointExterieur) ||
        pi.indexOf(x.jointInterieur) - pi.indexOf(z.jointInterieur) || z.b - x.b;
    });
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
    var pc = data.parclosage, ep = Number(cfg.remplissage);
    if (!(ep > 0)) erreurs.push('Indiquez l\'épaisseur du remplissage.');
    else if (Math.round(ep) !== ep) erreurs.push('Épaisseur du remplissage : nombre entier de millimètres (tableau de parclosage).');
    else if (ep < pc.epaisseurMin || ep > pc.epaisseurMax) {
      erreurs.push('Épaisseur du remplissage hors tableau de parclosage : ' + pc.epaisseurMin + ' à ' + pc.epaisseurMax + ' mm.');
    } else if (!combinaisonsParclosage(ep, pc).length) erreurs.push('Aucune parclose ne convient pour ' + ep + ' mm.');
    if (n >= 1 && cfg.largeur > 0) {
      var parVantail = cfg.largeur / n;
      if (lim.largeurParVantailMax && parVantail > lim.largeurParVantailMax + 1e-9) {
        erreurs.push('Largeur par vantail trop grande : ' + arrondi(parVantail, 1) + ' mm (maximum ' + lim.largeurParVantailMax +
          ' mm). Il faut au moins ' + Math.ceil(cfg.largeur / lim.largeurParVantailMax - 1e-9) + ' vantaux.');
      }
      if (lim.largeurParVantailMin && parVantail < lim.largeurParVantailMin - 1e-9) {
        erreurs.push('Largeur par vantail trop petite : ' + arrondi(parVantail, 1) + ' mm (minimum ' + lim.largeurParVantailMin +
          ' mm). Au plus ' + Math.floor(cfg.largeur / lim.largeurParVantailMin + 1e-9) + ' vantaux.');
      }
    }
    if (cfg.quincaillerie && cfg.quincaillerie !== 'aucune') {
      var qc = data.quincailleries && data.quincailleries[cfg.quincaillerie];
      if (!qc) {
        erreurs.push('Quincaillerie non disponible pour le moment.');
      } else if (qc.limites) {
        var lq = qc.limites, nomQ = qc.libelle.replace(/ \(.*\)$/, '');
        if (lq.vantauxMin && n < lq.vantauxMin) erreurs.push(nomQ + ' : au moins ' + lq.vantauxMin + ' vantaux.');
        if (lq.vantauxMax && n > lq.vantauxMax) erreurs.push(nomQ + ' : ' + lq.vantauxMax + ' vantaux maximum.');
        if (lq.largeurMax && cfg.largeur > lq.largeurMax) erreurs.push(nomQ + ' : largeur maximum ' + lq.largeurMax + ' mm.');
        if (lq.hauteurMax && cfg.hauteur > lq.hauteurMax) erreurs.push(nomQ + ' : hauteur maximum ' + lq.hauteurMax + ' mm.');
        if (lq.pairPairInterdit && cfg.gauche % 2 === 0 && cfg.droite % 2 === 0) {
          erreurs.push(nomQ + ' : répartition ' + cfg.gauche + ' + ' + cfg.droite +
            ' impossible (nombre pair de vantaux des deux côtés).');
        }
      }
    }
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
    var pcl = data.parclosage, epaisseur = Number(cfg.remplissage);
    var combinaisons = combinaisonsParclosage(epaisseur, pcl);
    var choixParclosage = combinaisons.filter(function (x) { return x.cle === cfg.parclosage; })[0] || combinaisons[0];
    var parclose = { ref: choixParclosage.parclose, designation: pcl.parcloses[choixParclosage.parclose].designation };
    var jointExt = { ref: choixParclosage.jointExterieur, designation: pcl.jointsExterieurs[choixParclosage.jointExterieur].designation };
    var jointInt = { ref: choixParclosage.jointInterieur, designation: pcl.jointsInterieurs[choixParclosage.jointInterieur].designation };
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
      for (var p = 0; p < 2; p++) ajouter('parclose', parclose, Lv - c.parcloseHorizontale, 'droite', 'Parclose horizontale', v);
      for (p = 0; p < 2; p++) ajouter('parclose', parclose, Hv - c.parcloseVerticale, 'droite', 'Parclose verticale', v);
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
      { ref: jointExt.ref, designation: jointExt.designation, qte: mlJointVitrage, unite: 'ML' },
      { ref: jointInt.ref, designation: jointInt.designation, qte: mlJointVitrage, unite: 'ML' },
      { ref: acc.boutonParclose.ref, designation: acc.boutonParclose.designation,
        qte: Math.floor(mlParclose / acc.boutonParclose.pasMetres + 0.5), unite: 'Pce' }
    ];
    acc.piecesAngle.forEach(function (a) {
      accessoires.push({ ref: a.ref, designation: a.designation, qte: a.parVantail * n, unite: 'Pce' });
    });

    // Verres
    var vL = Math.floor(Lv - c.verre + 0.5), vH = Math.floor(Hv - c.verre + 0.5);
    var verres = [{ libelle: 'Remplissage ' + epaisseur + ' mm', qte: n, largeur: vL, hauteur: vH,
      m2Unitaire: arrondi(vL * vH / 1e6, 2), m2Total: arrondi(n * vL * vH / 1e6, 2) }];

    var quincaillerie = [], libelleQuincaillerie = null;
    if (cfg.quincaillerie === 'fmf150') {
      var q = data.quincailleries.fmf150;
      quincaillerie = quincaillerieFMF150(k, m, cfg.sens, L, q);
      libelleQuincaillerie = q.libelle;
    } else if (cfg.quincaillerie === 'fmf100') {
      var q100 = data.quincailleries.fmf100;
      quincaillerie = quincaillerieFMF100(k, m, L, cfg.fixation, q100);
      libelleQuincaillerie = q100.libelle + ' – fixation ' + (cfg.fixation === 'plafond' ? 'plafond' : 'murale');
    }

    var ferm = data.fermeture ? fermeture(cfg, data.fermeture, quincaillerie) : null;

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
      quincaillerie: quincaillerie,
      libelleQuincaillerie: libelleQuincaillerie,
      fermeture: ferm,
      parclosage: { choix: choixParclosage, combinaisons: combinaisons },
      verres: verres
    };
  }

  var api = {
    calculer: calculer,
    dinVantaux: dinVantaux,
    montantsVantaux: montantsVantaux,
    decouperSurAxes: decouperSurAxes,
    quincaillerieFMF150: quincaillerieFMF150,
    quincaillerieFMF100: quincaillerieFMF100,
    fermeture: fermeture,
    combinaisonsParclosage: combinaisonsParclosage,
    avecCremone: avecCremone,
    optimiserBarres: optimiserBarres,
    arrondi: arrondi
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.Calcul = api;
})(typeof window !== 'undefined' ? window : this);
