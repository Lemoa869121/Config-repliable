/* Config-repliable – interface (formulaire, affichage, export) */
(function () {
  'use strict';

  var CLE_STOCKAGE = 'config-repliable-v1';
  var form = document.getElementById('formulaire');
  var contenu = document.getElementById('contenu');
  var message = document.getElementById('message');
  var data = null;
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
      quincaillerie: f.get('quincaillerie') || 'aucune',
      fixation: f.get('fixation') || 'murale'
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

  /* ---------- Schéma ---------- */
  function schema(r) {
    var e = r.entree, L = e.largeur, H = e.hauteur;
    var u = Math.max(L, H) / 100;           // unité de dessin
    var marge = 9 * u, fs = 2.4 * u;
    var W = L + 2 * marge + 6 * u, Ht = H + 2.6 * marge;
    var oy = 1.3 * marge;                    // haut de la baie
    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + Ht + '" xmlns="http://www.w3.org/2000/svg" font-family="Faktum, sans-serif" role="img" aria-label="Schéma de la porte, vue de l\'extérieur">');
    // Cote largeur totale
    s.push(ligneCote(marge, oy - 4 * u, marge + L, oy - 4 * u, nf(L) , fs, u));
    // Cote hauteur
    s.push('<line x1="' + (marge + L + 3 * u) + '" y1="' + oy + '" x2="' + (marge + L + 3 * u) + '" y2="' + (oy + H) + '" stroke="#051939" stroke-width="' + 0.15 * u + '"/>');
    s.push('<text x="' + (marge + L + 4 * u) + '" y="' + (oy + H / 2) + '" font-size="' + fs + '" fill="#051939" dominant-baseline="middle">' + nf(H) + '</text>');
    // Dormant
    var ep = 1.2 * u;
    s.push('<rect x="' + marge + '" y="' + oy + '" width="' + L + '" height="' + H + '" fill="#DDE2E9" stroke="#003C75" stroke-width="' + 0.3 * u + '"/>');
    // Vantaux
    var x = marge;
    r.vantaux.forEach(function (v, i) {
      var la = r.cotes.axes[i];
      var vx = x + (i === 0 ? ep : 0.3 * u), vw = la - (i === 0 || i === r.vantaux.length - 1 ? ep : 0) - 0.6 * u;
      if (i === r.vantaux.length - 1) vw = marge + L - ep - vx;
      var vy = oy + ep, vh = H - ep - 0.3 * u;
      s.push('<rect x="' + vx + '" y="' + vy + '" width="' + vw + '" height="' + vh + '" fill="#fff" stroke="#003C75" stroke-width="' + 0.25 * u + '"/>');
      s.push('<rect x="' + (vx + 2.2 * u) + '" y="' + (vy + 2.2 * u) + '" width="' + (vw - 4.4 * u) + '" height="' + (vh - 4.4 * u) + '" fill="#EEF3F9" stroke="#0F4196" stroke-width="' + 0.1 * u + '"/>');
      // Lignes d'ouverture (pointe côté droit en Din G, côté gauche en Din D)
      var pivot = v.din === 'L' ? vx + vw : vx, oppose = v.din === 'L' ? vx : vx + vw; // comme sur les plans Forster
      s.push('<polyline points="' + oppose + ',' + vy + ' ' + pivot + ',' + (vy + vh / 2) + ' ' + oppose + ',' + (vy + vh) + '" fill="none" stroke="#0F4196" stroke-width="' + 0.12 * u + '" stroke-dasharray="' + u + ' ' + 0.6 * u + '"/>');
      var cx = vx + vw / 2, cy = vy + vh / 2;
      s.push('<rect x="' + (cx - 2.2 * u) + '" y="' + (cy - 5.6 * u) + '" width="' + 4.4 * u + '" height="' + 3.6 * u + '" fill="#003C75"/>');
      s.push('<text x="' + cx + '" y="' + (cy - 3.8 * u) + '" font-size="' + fs + '" fill="#fff" text-anchor="middle" dominant-baseline="middle" font-weight="600">' + v.numero + '</text>');
      s.push('<text x="' + cx + '" y="' + (cy + 1 * u) + '" font-size="' + fs + '" fill="#051939" text-anchor="middle" font-weight="500">Din ' + (v.din === 'L' ? 'G' : 'D') + '</text>');
      // T / Z
      var ty = vy + 5 * u;
      s.push('<text x="' + (vx + 0.9 * u) + '" y="' + ty + '" font-size="' + fs * 0.9 + '" fill="#0F4196" font-weight="600">' + v.montantGauche + '</text>');
      s.push('<text x="' + (vx + vw - 0.9 * u) + '" y="' + ty + '" font-size="' + fs * 0.9 + '" fill="#0F4196" font-weight="600" text-anchor="end">' + v.montantDroit + '</text>');
      s.push('<text x="' + cx + '" y="' + (vy + 1.9 * u) + '" font-size="' + fs * 0.75 + '" fill="#0F4196" text-anchor="middle" dominant-baseline="middle">' + v.traverseHaute + '</text>');
      // Cote d'axe
      s.push(ligneCote(x, oy + H + 4 * u, x + la, oy + H + 4 * u, nf(la, 1), fs * 0.85, u));
      x += la;
    });
    // Sens de repli
    var k = e.gauche, m = e.droite;
    if (k) s.push('<text x="' + marge + '" y="' + (oy + H + 9 * u) + '" font-size="' + fs * 0.85 + '" fill="#051939">◀ ' + k + ' replié' + (k > 1 ? 's' : '') + ' à gauche</text>');
    if (m) s.push('<text x="' + (marge + L) + '" y="' + (oy + H + 9 * u) + '" font-size="' + fs * 0.85 + '" fill="#051939" text-anchor="end">' + m + ' replié' + (m > 1 ? 's' : '') + ' à droite ▶</text>');
    s.push('</svg>');
    return s.join('');
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
      tuile('Configuration', (e.sens === 'ext' ? 'Ext.' : 'Int.') + ' ' + e.gauche + ' + ' + e.droite) +
      tuile('Vantaux', r.cotes.n) +
      tuile('Baie', nf(e.largeur) + ' × ' + nf(e.hauteur)) +
      tuile('Ouvrant (Lv × Hv)', nf(r.cotes.Lv, 1) + ' × ' + nf(r.cotes.Hv)) +
      tuile('Verre', nf(r.verres[0].largeur) + ' × ' + nf(r.verres[0].hauteur)) +
      '</div>');

    html.push('<section class="section"><div class="bandeau">Schéma <span class="note">vue de l\'extérieur – T / Z : profil des montants et de la traverse haute</span></div><div class="schema">' + schema(r) + '</div></section>');

    // Débit
    var lignes = '';
    [['profil', 'Profilés'], ['parclose', 'Parcloses']].forEach(function (fam) {
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
    html.push('<section class="section"><div class="bandeau">Barres <span class="note">longueur utile ' + nf(data.barres.longueurUtile) + ' mm</span></div>' +
      '<table><thead><tr><th>Réf.</th><th>Désignation</th><th class="n">Pièces</th><th class="n">Total (ml)</th><th class="n">Barres</th><th class="n">Chute</th></tr></thead><tbody>' +
      r.barres.map(function (b) {
        return '<tr><td class="ref">' + b.ref + '</td><td>' + esc(b.designation) + '</td><td class="n">' + b.pieces +
          '</td><td class="n">' + nf(b.ml, 2) + '</td><td class="n">' + b.barres + '</td><td class="n">' + nf(b.chutePct, 1) + ' %</td></tr>';
      }).join('') + '</tbody></table></section>');

    // Accessoires
    html.push('<section class="section"><div class="bandeau">Accessoires</div>' +
      '<table><thead><tr><th>Réf.</th><th>Désignation</th><th class="n">Qté</th><th>Unité</th></tr></thead><tbody>' +
      r.accessoires.map(function (a) {
        return '<tr><td class="ref">' + a.ref + '</td><td>' + esc(a.designation) +
          (a.aConfirmer ? ' <span class="a-confirmer">formule à confirmer</span>' : '') +
          '</td><td class="n">' + (a.unite === 'ML' ? nf(a.qte, 2) : nf(a.qte)) + '</td><td>' + a.unite + '</td></tr>';
      }).join('') + '</tbody></table></section>');

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
    lignes.push(['Gamme', data.libelle, 'Sens', e.sens === 'ext' ? 'Extérieur' : 'Intérieur', 'Vantaux', e.gauche + ' à gauche + ' + e.droite + ' à droite']);
    lignes.push(['Largeur', e.largeur, 'Hauteur', e.hauteur, 'Corps', data.corps[e.corps].libelle, 'Remplissage', data.remplissages[e.remplissage].libelle,
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
    return (prefixe || 'repliable_') + (e.chantier ? e.chantier.replace(/[^\w\-]+/g, '_') + '_' : '') +
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
      (n && v.largeur ? ' – ' + nf(v.largeur / n, 0) + ' mm par vantail (' +
        nf(data.limites.largeurParVantailMin) + ' à ' + nf(data.limites.largeurParVantailMax) + ')' : '');
  }

  function recalculer() {
    var v = lireFormulaire();
    document.getElementById('blocFixation').hidden = v.quincaillerie !== 'fmf100';
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

  Promise.all([charger('data/presto.json'), charger('data/fmf150.json'), charger('data/fmf100.json')])
    .then(function (res) {
      data = res[0];
      data.quincailleries = { fmf150: res[1], fmf100: res[2] };
      remplirFormulaire(lireStockage());
      recalculer();
    })
    .catch(function (e) {
      message.hidden = false;
      message.textContent = 'Impossible de charger les données (' + e.message + '). Ouvrez l\'application par son adresse web ou via un serveur local.';
    });
})();
