/*
 * Config-repliable – export au format du fichier d'import Excel
 * (« 2020 - Import - EN - Zusatzartikel.xlsx », feuille Tabelle1).
 *
 * Correspondance validée le 10/11/2026 :
 *  - profilés et parcloses : Formula = Fixed Length, Lenght = longueur de débit, Quantity = quantité ;
 *  - joints au mètre : Lenght = longueur totale en mm, Quantity = 1 ;
 *  - accessoires et quincaillerie à la pièce : Lenght = 0, Quantity = nombre de pièces ;
 *  - Location : dormant haut = Top, dormant gauche = Left, dormant droit = Right, le reste = Free ;
 *  - Primary Angles 1 / 2 = angle de coupe à chaque bout (45 ou 90), Secondary Angles 1 / 2 = 90 (profilés et parcloses) ;
 *  - Price, Colour, Extension, Per Meter, Formula 2, Length 2, Assembly Name : vides.
 * Les remplissages (verres) n'ont pas de référence article : ils ne sont pas exportés.
 */
(function (racine) {
  'use strict';

  var MODELE = (typeof module !== 'undefined' && module.exports)
    ? require('./modele-import-excel.js') : racine.MODELE_IMPORT_EXCEL;

  var COLONNES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
  var CHAMPS = ['article', 'longueur', 'quantite', 'parMetre', 'extension', 'couleur', 'formule', 'emplacement',
    'anglePrimaire1', 'anglePrimaire2', 'angleSecondaire1', 'angleSecondaire2', 'prix', 'formule2', 'longueur2', 'assemblage'];

  /* "45° haut / 90° bas" → [45, 90] ; "droite" → [90, 90] */
  function angles(coupe) {
    var a = (coupe.match(/\d+(?=°)/g) || []).map(Number);
    if (a.length === 2) return a;
    return [90, 90];
  }

  function emplacement(element) {
    if (element.indexOf('Dormant haut') === 0) return 'Top';
    if (element === 'Dormant gauche') return 'Left';
    if (element === 'Dormant droit') return 'Right';
    return 'Free';
  }

  /* Lignes d'import à partir du résultat de Calcul.calculer */
  function lignesImport(r) {
    var lignes = [], index = {};
    var ordre = { profil: 0, parclose: 1 };
    r.debit.slice().sort(function (x, y) { return ordre[x.famille] - ordre[y.famille]; }).forEach(function (d) {
      var a = angles(d.coupe), lieu = emplacement(d.element);
      // Regroupe les pièces identiques (même article, longueur, coupes et emplacement)
      var cle = [d.ref, d.longueur, a[0], a[1], lieu].join('|');
      if (index[cle]) { index[cle].quantite += d.qte; return; }
      index[cle] = { article: d.ref, longueur: d.longueur, quantite: d.qte, formule: 'Fixed Length',
        emplacement: lieu, anglePrimaire1: a[0], anglePrimaire2: a[1], angleSecondaire1: 90, angleSecondaire2: 90 };
      lignes.push(index[cle]);
    });
    (r.accessoires.concat(r.quincaillerie || [])).forEach(function (x) {
      if (x.unite === 'ML') {
        lignes.push({ article: x.ref, longueur: Math.round(x.qte * 1000), quantite: 1, formule: 'Fixed Length', emplacement: 'Free' });
      } else {
        lignes.push({ article: x.ref, longueur: 0, quantite: x.qte, formule: 'Fixed Length', emplacement: 'Free' });
      }
    });
    return lignes;
  }

  /* ---------- XML ---------- */
  function xmlEsc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function cellule(ref, valeur, style) {
    if (valeur === undefined || valeur === null || valeur === '') return '';
    if (typeof valeur === 'number') return '<c r="' + ref + '" s="' + style + '"><v>' + valeur + '</v></c>';
    return '<c r="' + ref + '" s="' + style + '" t="inlineStr"><is><t>' + xmlEsc(valeur) + '</t></is></c>';
  }

  function feuille1(lignes) {
    var xml = lignes.map(function (l, i) {
      var n = i + 2;
      return '<row r="' + n + '" spans="1:16" ht="18.75" customHeight="1">' +
        CHAMPS.map(function (champ, c) {
          return cellule(COLONNES[c] + n, l[champ], COLONNES[c] === 'M' ? 3 : 2);
        }).join('') + '</row>';
    }).join('');
    return MODELE['xl/worksheets/sheet1.xml']
      .replace('{{LIGNES}}', xml)
      .replace('{{DIMENSION}}', 'A1:P' + Math.max(1, lignes.length + 1));
  }

  function proprietes(date) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
      'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
      'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
      '<dc:creator>Configurateur repliable Forster</dc:creator>' +
      '<dcterms:created xsi:type="dcterms:W3CDTF">' + date + '</dcterms:created>' +
      '<dcterms:modified xsi:type="dcterms:W3CDTF">' + date + '</dcterms:modified></cp:coreProperties>';
  }

  /* ---------- ZIP (méthode « stockée », sans compression) ---------- */
  var TABLE_CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(octets) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < octets.length; i++) c = TABLE_CRC[(c ^ octets[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function utf8(s) { return new TextEncoder().encode(s); }

  function zip(fichiers) { // [{ nom, octets }]
    var morceaux = [], central = [], decalage = 0;
    var d = new Date();
    var heure = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var jour = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    fichiers.forEach(function (f) {
      var nom = utf8(f.nom), crc = crc32(f.octets), taille = f.octets.length;
      var local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
      local.setUint16(8, 0, true); local.setUint16(10, heure, true); local.setUint16(12, jour, true);
      local.setUint32(14, crc, true); local.setUint32(18, taille, true); local.setUint32(22, taille, true);
      local.setUint16(26, nom.length, true); local.setUint16(28, 0, true);
      morceaux.push(new Uint8Array(local.buffer), nom, f.octets);
      var cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true);
      cd.setUint16(10, 0, true); cd.setUint16(12, heure, true); cd.setUint16(14, jour, true);
      cd.setUint32(16, crc, true); cd.setUint32(20, taille, true); cd.setUint32(24, taille, true);
      cd.setUint16(28, nom.length, true); cd.setUint32(42, decalage, true);
      central.push(new Uint8Array(cd.buffer), nom);
      decalage += 30 + nom.length + taille;
    });
    var tailleCentral = central.reduce(function (s, x) { return s + x.length; }, 0);
    var fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, fichiers.length, true); fin.setUint16(10, fichiers.length, true);
    fin.setUint32(12, tailleCentral, true); fin.setUint32(16, decalage, true);
    var tout = morceaux.concat(central, [new Uint8Array(fin.buffer)]);
    var total = tout.reduce(function (s, x) { return s + x.length; }, 0);
    var res = new Uint8Array(total), pos = 0;
    tout.forEach(function (x) { res.set(x, pos); pos += x.length; });
    return res;
  }

  /* Fichier .xlsx complet (Uint8Array) */
  function classeur(r) {
    var lignes = lignesImport(r);
    var date = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    var parties = Object.keys(MODELE).map(function (nom) {
      var contenu = nom === 'xl/worksheets/sheet1.xml' ? feuille1(lignes) : MODELE[nom];
      return { nom: nom, octets: utf8(contenu) };
    });
    parties.splice(3, 0, { nom: 'docProps/core.xml', octets: utf8(proprietes(date)) });
    return zip(parties);
  }

  var api = { lignesImport: lignesImport, classeur: classeur, angles: angles };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else racine.ExportExcel = api;
})(typeof window !== 'undefined' ? window : this);
