/* Config-repliable – interface (formulaire, affichage, export) */
(function () {
  'use strict';

  var CLE_STOCKAGE = 'config-repliable-v1';
  var form = document.getElementById('formulaire');
  var contenu = document.getElementById('contenu');
  var message = document.getElementById('message');
  var data = null;            // données de la gamme choisie
  var donnees = {};           // { presto, unico }
  var gammeAffichee = 'presto';
  var dernier = null;

  /* ---------- Outils ---------- */
  function nf(x, dec) {
    return Number(x).toLocaleString('fr-FR', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function lireStockage() { try { return JSON.parse(localStorage.getItem(CLE_STOCKAGE) || 'null'); } catch (e) { return null; } }
  function ecrireStockage(v) { try { localStorage.setItem(CLE_STOCKAGE, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }

  function lireFormulaire() {
    var f = new FormData(form);
    return {
      chantier: (f.get('chantier') || '').trim(),
      gamme: f.get('gamme') || 'presto',
      sens: f.get('sens') || 'ext',
      gauche: parseInt(f.get('gauche'), 10) || 0,
      droite: parseInt(f.get('droite'), 10) || 0,
      largeur: parseFloat(f.get('largeur')) || 0,
      hauteur: parseFloat(f.get('hauteur')) || 0,
      corps: f.get('corps') || '50',
      remplissage: f.get('remplissage') || '9',
      matiereParclose: f.get('matiereParclose') || 'acier',
      parclosage: f.get('parclosage') || '',
      quincaillerie: f.get('quincaillerie') || 'aucune',
      fixation: f.get('fixation') || 'murale',
      serrure: f.get('serrure') || '1pt',
      cremone: (form.querySelector('input[name=cremone]:checked') || {}).value || 'levier'
    };
  }

  function remplirFormulaire(v) {
    if (!v) return;
    Object.keys(v).forEach(function (nom) {
      var champs = form.elements[nom];
      if (!champs) return;
      if (champs instanceof RadioNodeList) {
        Array.prototype.forEach.call(champs, function (r) { if (!r.disabled) r.checked = (r.value === String(v[nom])); });
      } else if (!champs.disabled) {
        champs.value = v[nom];
      }
    });
  }

  /* ---------- Schéma (style des plans Forster Pro Unico, pour toutes les gammes) ----------
   * Vue de l'extérieur : vitrage bleu clair, étiquette hexagonale 1.1, 1.2… (numérotation de gauche à droite),
   * lignes d'ouverture en V (pointe côté paumelles), flèche de repli en pointillé, « S » sur le vantail semi-fixe
   * (vantail qui reçoit le vantail principal), poignée sur le profil serrure, cotes d'axe, largeur et hauteur
   * (+ rail de 67 mm quand une quincaillerie est choisie). */
  var RAIL = 67;
  function vantailSemiFixe(r) {
    var p = r.vantailPrincipal, n = r.vantaux.length;
    if (!p) return null;
    var s = p.cote === 'g' ? p.vantail - 1 : p.vantail + 1;
    return s >= 1 && s <= n ? s : null;
  }

  function schema(r) {
    var e = r.entree, L = e.largeur, H = e.hauteur;
    var rail = e.quincaillerie && e.quincaillerie !== 'aucune' ? RAIL : 0;
    var u = Math.max(L, H + rail) / 100;     // unité de dessin
    var marge = 9 * u, fs = 2.4 * u;
    var W = L + 2 * marge + 10 * u, Ht = H + rail + 2.6 * marge;
    var oyRail = 1.3 * marge, oy = oyRail + rail;   // haut du rail, haut de la baie
    var bleu = '#003C75', bleu2 = '#0F4196', encre = '#051939';
    var semiFixe = vantailSemiFixe(r), princ = r.vantailPrincipal;
    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + Ht + '" xmlns="http://www.w3.org/2000/svg" font-family="Faktum, sans-serif" role="img" aria-label="Schéma de la porte, vue de l\'extérieur">');
    s.push('<defs><marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10" fill="none" stroke="' + bleu2 + '" stroke-width="1.4"/></marker></defs>');
    // Cotes générales
    s.push(ligneCote(marge, oyRail - 4 * u, marge + L, oyRail - 4 * u, nf(L), fs, u));
    var xc = marge + L + 3 * u;
    s.push(coteVerticale(xc, oy, oy + H, nf(H), fs, u));
    if (rail) {
      s.push(coteVerticale(xc, oyRail, oy, String(RAIL), fs * 0.75, u));
      s.push(coteVerticale(xc + 5 * u, oyRail, oy + H, nf(H + RAIL), fs, u));
      s.push('<rect x="' + marge + '" y="' + oyRail + '" width="' + L + '" height="' + rail + '" fill="#fff" stroke="' + bleu + '" stroke-width="' + 0.15 * u + '"/>');
    }
    // Dormant
    var ep = 1.2 * u;
    s.push('<rect x="' + marge + '" y="' + oy + '" width="' + L + '" height="' + H + '" fill="#fff" stroke="' + bleu + '" stroke-width="' + 0.3 * u + '"/>');
    s.push('<rect x="' + (marge + ep) + '" y="' + (oy + ep) + '" width="' + (L - 2 * ep) + '" height="' + (H - ep) + '" fill="none" stroke="' + bleu + '" stroke-width="' + 0.1 * u + '"/>');
    // Vantaux
    var x = marge, n = r.vantaux.length;
    r.vantaux.forEach(function (v, i) {
      var la = r.cotes.axes[i];
      var vx = x + (i === 0 ? ep : 0.3 * u), vw = la - (i === 0 || i === n - 1 ? ep : 0) - 0.6 * u;
      if (i === n - 1) vw = marge + L - ep - vx;
      var vy = oy + ep, vh = H - ep - 0.3 * u, cadre = 2.2 * u;
      s.push('<rect x="' + vx + '" y="' + vy + '" width="' + vw + '" height="' + vh + '" fill="#fff" stroke="' + bleu + '" stroke-width="' + 0.25 * u + '"/>');
      var gx = vx + cadre, gy = vy + cadre, gw = vw - 2 * cadre, gh = vh - 2 * cadre;
      s.push('<rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" fill="#CFE0F2" stroke="' + bleu + '" stroke-width="' + 0.12 * u + '"/>');
      // Lignes d'ouverture en V : pointe côté paumelles (côté droit en Din G, gauche en Din D, comme les plans Forster)
      var pivot = v.din === 'L' ? gx + gw : gx, oppose = v.din === 'L' ? gx : gx + gw;
      s.push('<polyline points="' + oppose + ',' + gy + ' ' + pivot + ',' + (gy + gh / 2) + ' ' + oppose + ',' + (gy + gh) + '" fill="none" stroke="' + encre + '" stroke-width="' + 0.1 * u + '"/>');
      var cx = gx + gw / 2, cy = gy + gh * 0.36;
      // Étiquette hexagonale
      var hw = 3.6 * u, hh = 1.7 * u, pt = 1.1 * u;
      s.push('<polygon points="' + [[cx - hw - pt, cy], [cx - hw, cy - hh], [cx + hw, cy - hh], [cx + hw + pt, cy], [cx + hw, cy + hh], [cx - hw, cy + hh]].map(function (p) { return p.join(','); }).join(' ') +
        '" fill="#fff" stroke="' + encre + '" stroke-width="' + 0.14 * u + '"/>');
      s.push('<text x="' + cx + '" y="' + cy + '" font-size="' + fs + '" fill="' + encre + '" text-anchor="middle" dominant-baseline="central" font-weight="500">1.' + v.numero + '</text>');
      s.push('<text x="' + cx + '" y="' + (cy + 4.2 * u) + '" font-size="' + fs * 0.8 + '" fill="' + bleu2 + '" text-anchor="middle">Din ' + (v.din === 'L' ? 'G' : 'D') + '</text>');
      if (semiFixe === v.numero) s.push('<text x="' + cx + '" y="' + (gy + gh * 0.55) + '" font-size="' + fs + '" fill="' + encre + '" text-anchor="middle" dominant-baseline="central">S</text>');
      // Flèche de repli (pointillés) vers le côté où le vantail se replie
      var fy = gy + gh * 0.68, fl = Math.min(gw * 0.35, 9 * u), versGauche = v.cote === 'gauche';
      var x1 = versGauche ? cx + fl / 2 : cx - fl / 2, x2 = versGauche ? cx - fl / 2 : cx + fl / 2;
      s.push('<line x1="' + x1 + '" y1="' + fy + '" x2="' + x2 + '" y2="' + fy + '" stroke="' + bleu2 + '" stroke-width="' + 0.14 * u + '" stroke-dasharray="' + 0.9 * u + ' ' + 0.6 * u + '" marker-end="url(#fl)"/>');
      // Poignée sur le profil serrure (vantail principal)
      if (princ && princ.vantail === v.numero) {
        var px = princ.cote === 'g' ? vx + 0.9 * u : vx + vw - 0.9 * u, py = vy + vh * 0.62;
        s.push('<rect x="' + (px - 0.45 * u) + '" y="' + (py - 2.4 * u) + '" width="' + 0.9 * u + '" height="' + 4.8 * u + '" rx="' + 0.3 * u + '" fill="' + bleu + '"/>');
      }
      // T / Z : profil des montants (⁵⁰ : profil serrure en 50)
      var ty = vy + 1.6 * u, tf = fs * 0.7;
      s.push('<text x="' + (vx + 0.5 * u) + '" y="' + ty + '" font-size="' + tf + '" fill="' + bleu2 + '" dominant-baseline="central">' + v.montantGauche + (v.profilSerrure === 'g' ? '⁵⁰' : '') + '</text>');
      s.push('<text x="' + (vx + vw - 0.5 * u) + '" y="' + ty + '" font-size="' + tf + '" fill="' + bleu2 + '" text-anchor="end" dominant-baseline="central">' + v.montantDroit + (v.profilSerrure === 'd' ? '⁵⁰' : '') + '</text>');
      s.push('<text x="' + (vx + vw / 2) + '" y="' + ty + '" font-size="' + tf + '" fill="' + bleu2 + '" text-anchor="middle" dominant-baseline="central">' + v.traverseHaute + '</text>');
      // Cote d'axe
      s.push(ligneCote(x, oy + H + 4 * u, x + la, oy + H + 4 * u, nf(la, 1), fs * 0.85, u));
      x += la;
    });
    // Sens de repli
    var k = e.gauche, m = e.droite;
    if (k) s.push('<text x="' + marge + '" y="' + (oy + H + 9 * u) + '" font-size="' + fs * 0.85 + '" fill="' + encre + '">◀ ' + k + ' replié' + (k > 1 ? 's' : '') + ' à gauche</text>');
    if (m) s.push('<text x="' + (marge + L) + '" y="' + (oy + H + 9 * u) + '" font-size="' + fs * 0.85 + '" fill="' + encre + '" text-anchor="end">' + m + ' replié' + (m > 1 ? 's' : '') + ' à droite ▶</text>');
    s.push('</svg>');
    return s.join('');
  }

  function coteVerticale(x, y1, y2, texte, fs, u) {
    var t = 0.12 * u, ym = (y1 + y2) / 2;
    return '<g stroke="#051939" stroke-width="' + t + '">' +
      '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '"/>' +
      '<line x1="' + (x - u) + '" y1="' + y1 + '" x2="' + (x + u) + '" y2="' + y1 + '"/>' +
      '<line x1="' + (x - u) + '" y1="' + y2 + '" x2="' + (x + u) + '" y2="' + y2 + '"/></g>' +
      '<text x="' + (x + 1.2 * u) + '" y="' + ym + '" font-size="' + fs + '" fill="#051939" dominant-baseline="middle" transform="rotate(-90 ' + (x + 1.2 * u) + ' ' + ym + ')" text-anchor="middle" dy="' + 0.9 * fs + '">' + texte + '</text>';
  }

  function ligneCote(x1, y, x2, y2, texte, fs, u) {
    var t = 0.12 * u;
    return '<g stroke="#051939" stroke-width="' + t + '">' +
      '<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
      '<line x1="' + x1 + '" y1="' + (y - u) + '" x2="' + x1 + '" y2="' + (y + u) + '"/>' +
      '<line x1="' + x2 + '" y1="' + (y - u) + '" x2="' + x2 + '" y2="' + (y + u) + '"/></g>' +
      '<text x="' + (x1 + x2) / 2 + '" y="' + (y - 0.8 * u) + '" font-size="' + fs + '" fill="#051939" text-anchor="middle">' + texte + '</text>';
  }

  /* ---------- Rendu ---------- */
  function rendre(r) {
    var e = r.entree;
    var html = [];
    var alertes = r.alertes.concat(r.aConfirmer);
    if (alertes.length) {
      html.push('<div class="alertes"><ul>' + alertes.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>');
    }
    html.push('<div class="synthese">' +
      tuile('Gamme', data.corps[e.corps].libelle.replace(/^Tout en corps/, 'Presto corps').replace(/^Corps de 20, profil serrure en 50$/, 'Presto 20 / 50')) +
      tuile('Configuration', (e.sens === 'ext' ? 'Ext.' : 'Int.') + ' ' + e.gauche + ' + ' + e.droite) +
      tuile('Vantaux', r.cotes.n) +
      tuile('Baie', nf(e.largeur) + ' × ' + nf(e.hauteur)) +
      tuile('Ouvrant (Lv × Hv)', nf(r.cotes.Lv, 1) + ' × ' + nf(r.cotes.Hv, r.cotes.Hv % 1 ? 1 : 0)) +
      tuile('Verre', nf(r.verres[0].largeur) + ' × ' + nf(r.verres[0].hauteur)) +
      tuile('Parclose', r.parclosage.choix.parclose + ' · ' + r.parclosage.choix.jointExterieur + ' / ' + r.parclosage.choix.jointInterieur) +
      '</div>');

    html.push('<section class="section"><div class="bandeau">Schéma <span class="note">vue de l\'extérieur – vantaux 1.1, 1.2… de gauche à droite ; S : vantail semi-fixe ; ▮ : poignée (vantail principal) ; T / Z : profil des montants et de la traverse haute ; ⁵⁰ : profil serrure en 50</span></div><div class="schema">' + schema(r) + '</div></section>');

    // Débit
    var lignes = '';
    [['profil', 'Profilés'], ['parclose', 'Parcloses'], ['fmf', 'Profilés de quincaillerie (Mantion, longueur réelle)']].forEach(function (fam) {
      var rows = r.debit.filter(function (d) { return d.famille === fam[0]; });
      if (!rows.length) return;
      lignes += '<tr class="sous-titre"><td colspan="7">' + fam[1] + '</td></tr>';
      rows.forEach(function (d) {
        lignes += '<tr><td class="ref">' + d.ref + '</td><td>' + esc(d.designation) + '</td><td>' + esc(d.element) +
          '</td><td class="n">' + d.qte + '</td><td class="n">' + nf(d.longueur, 1) + '</td><td>' + esc(d.coupe) +
          '</td><td>' + (d.vantaux.length ? d.vantaux.join(', ') : '–') + '</td></tr>';
      });
    });
    html.push('<section class="section"><div class="bandeau">Liste de débit <span class="note">longueurs en mm</span></div>' +
      '<table><thead><tr><th>Réf.</th><th>Désignation</th><th>Élément</th><th class="n">Qté</th><th class="n">Longueur</th><th>Coupe</th><th>Vantaux</th></tr></thead><tbody>' +
      lignes + '</tbody></table></section>');

    // Barres
    html.push('<section class="section"><div class="bandeau">Barres <span class="note">longueur utile ' + nf(data.barres.longueurUtile) + ' mm' +
      (r.barres.some(function (b) { return b.famille === 'fmf'; }) ? ' ; profilés Mantion : barres de 6000 mm' : '') + '</span></div>' +
      '<table><thead><tr><th>Réf.</th><th>Désignation</th><th class="n">Pièces</th><th class="n">Total (ml)</th><th class="n">Barres</th><th class="n">Chute</th></tr></thead><tbody>' +
      r.barres.map(function (b) {
        return '<tr><td class="ref">' + esc(b.ref) + '</td><td>' + esc(b.designation) + '</td><td class="n">' + b.pieces +
          '</td><td class="n">' + nf(b.ml, 2) + '</td><td class="n">' + b.barres + (b.famille === 'fmf' ? ' × 6 m' : '') + '</td><td class="n">' + nf(b.chutePct, 1) + ' %</td></tr>';
      }).join('') + '</tbody></table></section>');

    // Accessoires
    html.push('<section class="section"><div class="bandeau">Accessoires</div>' +
      '<table><thead><tr><th>Réf.</th><th>Désignation</th><th class="n">Qté</th><th>Unité</th></tr></thead><tbody>' +
      r.accessoires.map(function (a) {
        return '<tr><td class="ref">' + a.ref + '</td><td>' + esc(a.designation) +
          (a.aConfirmer ? ' <span class="a-confirmer">formule à confirmer</span>' : '') +
          '</td><td class="n">' + (a.unite === 'ML' ? nf(a.qte, 2) : nf(a.qte)) + '</td><td>' + a.unite + '</td></tr>';
      }).join('') + '</tbody></table></section>');

    // Fermeture (serrure, crémone, pièces de paumelle)
    if (r.fermeture && r.fermeture.lignes.length) {
      var note = r.fermeture.unico ? r.fermeture.serrure + ' – dossier Forster Pro'
        : r.fermeture.serrure + (r.fermeture.cremone ? ' + ' + r.fermeture.cremone : ' – sans crémone');
      var groupes = ['Serrure', 'Crémone', 'Pièces de paumelle', 'Verrouillage des vantaux'];
      var corps = '';
      groupes.forEach(function (g) {
        var rows = r.fermeture.lignes.filter(function (l) { return l.groupe === g; });
        if (!rows.length) return;
        corps += '<tr class="sous-titre"><td colspan="4">' + g +
          (g === 'Pièces de paumelle' ? ' (× ' + r.fermeture.paires + ' : paire' + (r.fermeture.paires > 1 ? 's' : '') + ' de vantaux repliés)' : '') +
          (g === 'Verrouillage des vantaux' ? ' (P = ' + r.fermeture.paires + ' paire' + (r.fermeture.paires > 1 ? 's' : '') + ' de vantaux)' : '') + '</td></tr>';
        rows.forEach(function (a) {
          corps += '<tr><td class="ref">' + esc(a.ref) + '</td><td>' + esc(a.designation) +
            (a.aConfirmer ? ' <span class="a-confirmer">' + esc(a.aConfirmer) + '</span>' : '') +
            '</td><td class="n">' + nf(a.qte) + '</td><td>' + a.unite + '</td></tr>';
        });
      });
      html.push('<section class="section"><div class="bandeau">Serrurerie <span class="note">' + esc(note) + '</span></div>' +
        '<table><thead><tr><th>Réf.</th><th>Désignation</th><th class="n">Qté</th><th>Unité</th></tr></thead><tbody>' + corps + '</tbody></table></section>');
    }

    // Quincaillerie
    if (r.quincaillerie.length) {
      html.push('<section class="section"><div class="bandeau">Quincaillerie <span class="note">' + esc(r.libelleQuincaillerie) + '</span></div>' +
        '<table><thead><tr><th>Réf.</th><th>Désignation</th><th class="n">Qté</th><th>Unité</th></tr></thead><tbody>' +
        r.quincaillerie.map(function (a) {
          return '<tr><td class="ref">' + esc(a.ref) + '</td><td>' + esc(a.designation) + '</td><td class="n">' + nf(a.qte) +
            '</td><td>' + a.unite + '</td></tr>';
        }).join('') + '</tbody></table></section>');
    }

    // Verres
    html.push('<section class="section"><div class="bandeau">Remplissage</div>' +
      '<table><thead><tr><th>Remplissage</th><th class="n">Qté</th><th class="n">Largeur</th><th class="n">Hauteur</th><th class="n">m² / pièce</th><th class="n">m² total</th></tr></thead><tbody>' +
      r.verres.map(function (v) {
        return '<tr><td>' + esc(v.libelle) + '</td><td class="n">' + v.qte + '</td><td class="n">' + nf(v.largeur) +
          '</td><td class="n">' + nf(v.hauteur) + '</td><td class="n">' + nf(v.m2Unitaire, 2) + '</td><td class="n">' + nf(v.m2Total, 2) + '</td></tr>';
      }).join('') + '</tbody></table></section>');

    contenu.innerHTML = html.join('');
  }

  function tuile(t, v) { return '<div class="tuile"><div class="t">' + esc(t) + '</div><div class="v">' + esc(v) + '</div></div>'; }

  /* ---------- Export ---------- */
  function tableau(r) {
    var e = r.entree, lignes = [];
    lignes.push(['Configurateur repliable Forster – liste matière (calcul non contractuel)']);
    if (e.chantier) lignes.push(['Chantier', e.chantier]);
    lignes.push(['Gamme', data.libelle + (e.gamme === 'unico' ? ' – parclose ' + data.parclosage.matieres[e.matiereParclose || 'acier'] : ''), 'Sens', e.sens === 'ext' ? 'Extérieur' : 'Intérieur', 'Vantaux', e.gauche + ' à gauche + ' + e.droite + ' à droite']);
    lignes.push(['Largeur', e.largeur, 'Hauteur', e.hauteur, 'Corps', data.corps[e.corps].libelle, 'Remplissage', e.remplissage + ' mm', 'Parclose', r.parclosage.choix.parclose,
      'Quincaillerie', r.libelleQuincaillerie || 'Sans']);
    lignes.push([]);
    lignes.push(['LISTE DE DÉBIT']);
    lignes.push(['Réf.', 'Désignation', 'Élément', 'Qté', 'Longueur (mm)', 'Coupe', 'Vantaux']);
    r.debit.forEach(function (d) { lignes.push([d.ref, d.designation, d.element, d.qte, d.longueur, d.coupe, d.vantaux.join(' ')]); });
    lignes.push([]);
    lignes.push(['BARRES (longueur utile ' + data.barres.longueurUtile + ' mm)']);
    lignes.push(['Réf.', 'Désignation', 'Pièces', 'Total (ml)', 'Barres', 'Chute (%)']);
    r.barres.forEach(function (b) { lignes.push([b.ref, b.designation, b.pieces, b.ml, b.barres, b.chutePct]); });
    lignes.push([]);
    lignes.push(['ACCESSOIRES']);
    lignes.push(['Réf.', 'Désignation', 'Qté', 'Unité']);
    r.accessoires.forEach(function (a) { lignes.push([a.ref, a.designation, a.qte, a.unite]); });
    if (r.fermeture && r.fermeture.lignes.length) {
      lignes.push([]);
      lignes.push(['SERRURERIE – ' + r.fermeture.serrure + (r.fermeture.cremone ? ' + ' + r.fermeture.cremone : '')]);
      lignes.push(['Réf.', 'Désignation', 'Qté', 'Unité']);
      r.fermeture.lignes.forEach(function (a) { lignes.push([a.ref, a.designation, a.qte, a.unite]); });
    }
    if (r.quincaillerie.length) {
      lignes.push([]);
      lignes.push(['QUINCAILLERIE – ' + r.libelleQuincaillerie]);
      lignes.push(['Réf.', 'Désignation', 'Qté', 'Unité']);
      r.quincaillerie.forEach(function (a) { lignes.push([a.ref, a.designation, a.qte, a.unite]); });
    }
    lignes.push([]);
    lignes.push(['REMPLISSAGE']);
    lignes.push(['Remplissage', 'Qté', 'Largeur', 'Hauteur', 'm² total']);
    r.verres.forEach(function (v) { lignes.push([v.libelle, v.qte, v.largeur, v.hauteur, v.m2Total]); });
    return lignes;
  }

  function enTexte(lignes, sep) {
    return lignes.map(function (l) {
      return l.map(function (c) {
        var s = typeof c === 'number' ? String(c).replace('.', ',') : String(c);
        return /[";\n\t]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(sep);
    }).join('\r\n');
  }

  function exporterCsv() {
    if (!dernier || !dernier.ok) return;
    telecharger(new Blob(['\ufeff' + enTexte(tableau(dernier), ';')], { type: 'text/csv;charset=utf-8' }), nomFichier('csv'));
  }

  function nomFichier(ext, prefixe) {
    var e = dernier.entree;
    return (prefixe || 'repliable_') + (e.gamme === 'unico' ? 'unico_' : '') + (e.chantier ? e.chantier.replace(/[^\w\-]+/g, '_') + '_' : '') +
      (e.sens === 'ext' ? 'ext' : 'int') + '_' + e.gauche + '+' + e.droite + '_' + e.largeur + 'x' + e.hauteur + '.' + ext;
  }

  function telecharger(blob, nom) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function exporterExcel() {
    if (!dernier || !dernier.ok) return;
    var octets = ExportExcel.classeur(dernier);
    telecharger(new Blob([octets], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nomFichier('xlsx', 'export_excel_FP_'));
  }

  function copier() {
    if (!dernier || !dernier.ok) return;
    var texte = enTexte(tableau(dernier), '\t');
    var bouton = document.getElementById('btnCopier');
    function ok() { bouton.textContent = 'Copié ✓'; setTimeout(function () { bouton.textContent = 'Copier'; }, 1500); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(ok, function () { secours(texte); ok(); });
    } else { secours(texte); ok(); }
  }
  function secours(texte) {
    var t = document.createElement('textarea'); t.value = texte; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) { /* rien */ } t.remove();
  }

  /* ---------- Cycle ---------- */
  function majTotal(v) {
    var n = v.gauche + v.droite;
    document.getElementById('totalVantaux').textContent = 'Total : ' + n + ' vantaux' +
      (n && v.largeur ? (data.limites.controleLargeur === 'vantail' && data.corps[v.corps]
        ? ' – vantail de ' + nf((v.largeur - data.corps[v.corps].cotes.dormantLargeur) / n + data.corps[v.corps].cotes.recouvrementOuvrant, 1) + ' mm'
        : ' – ' + nf(v.largeur / n, 0) + ' mm par vantail') + ' (' +
        nf(data.limites.largeurParVantailMin) + ' à ' + nf(data.limites.largeurParVantailMax) + ')' : '');
  }

  /* Liste des parcloses et joints possibles pour l'épaisseur saisie (tableau Forster) */
  function majParclosage(v) {
    var sel = document.getElementById('parclosage');
    var y = Number(v.remplissage);
    var combis = (y > 0 && Math.round(y) === y) ? Calcul.combinaisonsParclosage(y, data.parclosage, v.matiereParclose) : [];
    var cle = data.gamme + ':' + combis.map(function (c) { return c.cle; }).join(',');
    if (sel.dataset.cle !== cle) {
      var garder = v.parclosage || (lireStockage() || {}).parclosage;
      sel.innerHTML = combis.map(function (c, i) {
        var p = data.parclosage;
        return '<option value="' + c.cle + '">' + c.parclose + ' (' + c.b + ' mm) · ext. ' + c.jointExterieur +
          ' (a1 ' + p.jointsExterieurs[c.jointExterieur].a1 + ') · int. ' + c.jointInterieur + ' (a2 ' + c.a2 + ')' +
          (i === 0 ? ' – recommandé' : '') + '</option>';
      }).join('');
      sel.dataset.cle = cle;
      if (combis.some(function (c) { return c.cle === garder; })) sel.value = garder;
    }
    sel.disabled = !combis.length;
    var nomTableau = data.gamme === 'unico' ? 'tableau Forster Unico « vitrage à sec »' : 'tableau Forster Presto « vitrage à sec, 1 parclose »';
    document.getElementById('aideParclosage').textContent = combis.length
      ? combis.length + ' combinaison' + (combis.length > 1 ? 's' : '') + ' possible' + (combis.length > 1 ? 's' : '') + ' pour ' + y + ' mm (' + nomTableau + ').'
      : nomTableau.charAt(0).toUpperCase() + nomTableau.slice(1) + ' : ' + data.parclosage.epaisseurMin + ' à ' + data.parclosage.epaisseurMax + ' mm, nombre entier.';
  }

  /* Changement de gamme : épaisseurs de profils, bornes du remplissage, ferrure, quincaillerie */
  function majGamme(gamme) {
    data = donnees[gamme] || donnees.presto;
    gammeAffichee = gamme;
    var unico = gamme === 'unico';
    var bloc = document.getElementById('blocCorps');
    var actuel = (form.querySelector('input[name=corps]:checked') || {}).value;
    // Ordre d'affichage fixe (les clés numériques d'un objet JSON sont réordonnées par le navigateur)
    var cles = (unico ? ['50', '30', '50+30'] : ['50', '20', '20-50']).filter(function (c) { return data.corps[c]; });
    bloc.innerHTML = '<legend class="libelle">Épaisseur des profils</legend>' + cles.map(function (c) {
      var lib = unico ? data.corps[c].libelle : { '50': 'Tout en corps de 50', '20': 'Tout en corps de 20', '20-50': 'Corps de 20, profil serrure en 50' }[c] || data.corps[c].libelle;
      return '<label class="choix"><input type="radio" name="corps" value="' + esc(c) + '"' + ((cles.indexOf(actuel) >= 0 ? c === actuel : c === cles[0]) ? ' checked' : '') + '> ' + esc(lib) + '</label>';
    }).join('');
    var rp = form.elements.remplissage, pc = data.parclosage;
    rp.min = pc.epaisseurMin; rp.max = pc.epaisseurMax;
    var y = Number(rp.value);
    if (!(y >= pc.epaisseurMin && y <= pc.epaisseurMax)) rp.value = unico ? 24 : 9;
    document.getElementById('blocMatiere').hidden = !pc.matieres;
    document.getElementById('blocSerrure').hidden = unico;
    document.getElementById('blocCremone').hidden = unico;
    document.getElementById('blocFerrureUnico').hidden = !unico;
    var r100 = form.querySelector('input[name=quincaillerie][value=fmf100]');
    r100.disabled = unico;
    document.getElementById('choixFmf100').classList.toggle('inactif', unico);
    if (unico && r100.checked) form.querySelector('input[name=quincaillerie][value=fmf150]').checked = true;
    document.getElementById('aideQuincaillerie').hidden = !unico;
  }

  function recalculer() {
    var g0 = lireFormulaire().gamme;
    if (g0 !== gammeAffichee || !data) majGamme(g0);
    var v = lireFormulaire();
    if (v.gamme === 'unico') {
      var fu = data.fermeture.ferrures[data.fermeture.ferrureParCorps[v.corps]];
      document.getElementById('aideFerrureUnico').textContent = (fu ? fu.libelle + '. ' : '') +
        'Ferrure du dossier Forster Pro, imposée par l\'épaisseur des profils (pas de choix serrure / crémone en Unico).';
    }
    document.getElementById('blocFixation').hidden = v.quincaillerie !== 'fmf100';
    majParclosage(v);
    v.parclosage = document.getElementById('parclosage').value;
    var cremoneUtile = Calcul.avecCremone(v.gauche, v.droite);
    document.getElementById('blocCremone').classList.toggle('inactif', !cremoneUtile);
    Array.prototype.forEach.call(form.elements.cremone, function (r) { r.disabled = !cremoneUtile; });
    document.getElementById('aideCremone').textContent = cremoneUtile
      ? 'Nombre impair de vantaux des deux côtés : crémone ajoutée.'
      : 'Pas de crémone pour ' + v.gauche + ' + ' + v.droite + ' (seulement si le nombre de vantaux est impair des deux côtés : 3+1, 5+1, 3+3…).';
    ecrireStockage(v);
    majTotal(v);
    document.getElementById('titreResultat').textContent = 'Liste matière' + (v.chantier ? ' – ' + v.chantier : '');
    document.title = (v.chantier ? v.chantier + ' – ' : '') + 'Configurateur repliable – Forster';
    var r = Calcul.calculer(v, data);
    dernier = r;
    if (!r.ok) {
      message.hidden = false;
      message.innerHTML = r.erreurs.map(esc).join('<br>');
      contenu.innerHTML = '';
      return;
    }
    message.hidden = true;
    rendre(r);
  }

  form.addEventListener('input', recalculer);
  form.addEventListener('change', recalculer);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  document.getElementById('btnImprimer').addEventListener('click', function () { window.print(); });
  document.getElementById('btnCsv').addEventListener('click', exporterCsv);
  document.getElementById('btnExcel').addEventListener('click', exporterExcel);
  document.getElementById('btnCopier').addEventListener('click', copier);
  document.getElementById('btnReinit').addEventListener('click', function () {
    try { localStorage.removeItem(CLE_STOCKAGE); } catch (e) { /* rien */ }
    form.reset(); recalculer();
  });

  function charger(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (rep) {
      if (!rep.ok) throw new Error(url + ' : HTTP ' + rep.status);
      return rep.json();
    });
  }

  Promise.all([charger('data/presto.json'), charger('data/fmf150.json'), charger('data/fmf100.json'), charger('data/fermeture-presto.json'),
    charger('data/unico.json'), charger('data/fmf-unico.json'), charger('data/fermeture-unico.json')])
    .then(function (res) {
      donnees.presto = res[0];
      donnees.presto.quincailleries = { fmf150: res[1], fmf100: res[2] };
      donnees.presto.fermeture = res[3];
      donnees.unico = res[4];
      donnees.unico.quincailleries = { fmf150: res[5] };
      donnees.unico.fermeture = res[6];
      var memo = lireStockage();
      data = donnees[(memo && memo.gamme) || 'presto'] || donnees.presto;
      if (memo && memo.gamme) { remplirFormulaire({ gamme: memo.gamme }); majGamme(memo.gamme); }
      remplirFormulaire(memo);
      recalculer();
    })
    .catch(function (e) {
      message.hidden = false;
      message.textContent = 'Impossible de charger les données (' + e.message + '). Ouvrez l\'application par son adresse web ou via un serveur local.';
    });
})();
