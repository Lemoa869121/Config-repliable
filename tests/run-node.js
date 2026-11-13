#!/usr/bin/env node
/* Lance les tests en ligne de commande : node tests/run-node.js */
'use strict';
var path = require('path');
var fs = require('fs');
var racine = path.join(__dirname, '..');
var Calcul = require(path.join(racine, 'js', 'calcul.js'));
var verifier = require(path.join(__dirname, 'verifier.js'));
var data = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'presto.json'), 'utf8'));
var jeu = JSON.parse(fs.readFileSync(path.join(__dirname, 'cas-pdf.json'), 'utf8'));

var res = verifier(Calcul, data, jeu);
res.resultats.forEach(function (r) {
  var ko = r.controles.filter(function (c) { return !c.ok; });
  console.log((ko.length ? '✗ ' : '✓ ') + r.position + (ko.length ? '' : '  (' + r.controles.length + ' contrôles)'));
  ko.forEach(function (c) { console.log('    ✗ ' + c.nom + ' : ' + c.detail); });
});
res.aTrancher.forEach(function (pos) { console.log('⚠ ' + pos + ' : répartition T / Z à trancher (voir cas-pdf.json)'); });
// Limite de largeur par vantail (data/presto.json)
var lim = data.limites;
[[lim.largeurParVantailMax * 3, true], [lim.largeurParVantailMax * 3 + 1, false], [lim.largeurParVantailMin * 3, true], [lim.largeurParVantailMin * 3 - 1, false]].forEach(function (t) {
  var ok = Calcul.calculer({ corps: '50', sens: 'ext', gauche: 2, droite: 1, largeur: t[0], hauteur: 2165, remplissage: '9' }, data).ok;
  if (ok !== t[1]) { res.echecs++; console.log('✗ limite par vantail : ' + t[0] + ' mm en 3 vantaux ' + (ok ? 'accepté' : 'refusé')); }
});
console.log('Largeur par vantail : ' + lim.largeurParVantailMin + ' à ' + lim.largeurParVantailMax + ' mm');
console.log('\n' + (res.total - res.echecs) + ' / ' + res.total + ' contrôles réussis');

// Export Excel (format « Import – Zusatzartikel ») : structure du fichier et lignes
var ExportExcel = require(path.join(racine, 'js', 'export-excel.js'));
var echecsExport = 0;
jeu.cas.forEach(function (cas) {
  var r = Calcul.calculer({ corps: '50', sens: cas.sens, gauche: cas.gauche, droite: cas.droite,
    largeur: cas.largeur, hauteur: cas.hauteur, remplissage: cas.remplissage }, data);
  var lignes = ExportExcel.lignesImport(r);
  var octets = ExportExcel.classeur(r);
  var piecesExport = lignes.filter(function (l) { return l.anglePrimaire1; }).reduce(function (s, l) { return s + l.quantite; }, 0);
  var ok = octets[0] === 0x50 && octets[1] === 0x4B && piecesExport === r.pieces.length &&
    lignes.every(function (l) { return l.article && l.formule === 'Fixed Length' && l.emplacement; });
  if (!ok) { echecsExport++; console.log('✗ export Excel ' + cas.position); }
});
console.log('Export Excel : ' + (jeu.cas.length - echecsExport) + ' / ' + jeu.cas.length + ' fichiers conformes');

// Quincaillerie FMF 150 : quantités dépendant du nombre de vantaux (40 devis Slidsoft)
var fmf = JSON.parse(fs.readFileSync(path.join(__dirname, 'cas-fmf150.json'), 'utf8'));
var q = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'fmf150.json'), 'utf8'));
var echecsFmf = 0;
fmf.cas.forEach(function (cas) {
  var lignes = Calcul.quincaillerieFMF150(cas.gauche, cas.droite, cas.sens, cas.largeurSlidsoft, q);
  var ecarts = Object.keys(cas.attendu).filter(function (ref) {
    var l = lignes.filter(function (x) { return x.ref === ref; })[0];
    return (l ? l.qte : 0) !== cas.attendu[ref];
  });
  if (ecarts.length) { echecsFmf++; console.log('✗ FMF150 ' + cas.configuration + ' : ' + ecarts.join(', ')); }
});
// Règles Forster : barres de 6000 mm, supports tous les 500 mm (sets de 4)
[[3000, 1, 2], [4500, 1, 3], [6000, 1, 4], [7000, 2, 4], [9000, 2, 5]].forEach(function (t) {
  var l = Calcul.quincaillerieFMF150(3, 2, 'int', t[0], q);
  var rail = l.filter(function (x) { return x.ref === '10500A/600'; })[0].qte;
  var sup = l.filter(function (x) { return x.ref === 'GJ10530B'; })[0].qte;
  if (rail !== t[1] || sup !== t[2]) { echecsFmf++; console.log('✗ FMF150 barres/supports à ' + t[0] + ' mm : ' + rail + ' / ' + sup); }
});
console.log('Quincaillerie FMF150 : ' + (echecsFmf ? echecsFmf + ' écart(s)' : fmf.cas.length + ' / ' + fmf.cas.length + ' devis Slidsoft retrouvés + règles barres / supports OK'));

// Quincaillerie FMF 100 : 80 devis Slidsoft (intérieur / extérieur × murale / plafond)
var fmf100 = JSON.parse(fs.readFileSync(path.join(__dirname, 'cas-fmf100.json'), 'utf8'));
var q100 = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'fmf100.json'), 'utf8'));
var echecs100 = 0;
fmf100.cas.forEach(function (cas) {
  var lignes = Calcul.quincaillerieFMF100(cas.gauche, cas.droite, cas.largeurSlidsoft, cas.fixation, q100);
  var ecarts = Object.keys(cas.attendu).filter(function (ref) {
    var l = lignes.filter(function (x) { return x.ref === ref; })[0];
    return (l ? l.qte : 0) !== cas.attendu[ref];
  });
  var enTrop = lignes.filter(function (x) { return !(x.ref in cas.attendu) && !(cas.largeurSlidsoft <= 3000); });
  if (ecarts.length || enTrop.length) {
    echecs100++; console.log('✗ FMF100 ' + cas.configuration + ' : ' + ecarts.concat(enTrop.map(function (x) { return x.ref; })).join(', '));
  }
});
// Contrôles de saisie propres au FMF 100
var base100 = { corps: '50', sens: 'int', largeur: 4500, hauteur: 2400, remplissage: '9', quincaillerie: 'fmf100', fixation: 'murale' };
data.quincailleries = { fmf100: q100 };
[[4, 2, false], [3, 0, true], [6, 0, false], [5, 4, false], [4, 3, true]].forEach(function (t) {
  var c = Object.assign({}, base100, { gauche: t[0], droite: t[1] });
  c.largeur = Math.min(6000, 900 * (c.gauche + c.droite));
  var ok = Calcul.calculer(c, data).ok;
  if (ok !== t[2]) { echecs100++; console.log('✗ FMF100 contrôle ' + t[0] + '+' + t[1] + ' : ' + (ok ? 'accepté' : 'refusé')); }
});
console.log('Quincaillerie FMF100 : ' + (echecs100 ? echecs100 + ' écart(s)' : fmf100.cas.length + ' / ' + fmf100.cas.length + ' devis Slidsoft retrouvés + contrôles de saisie OK'));

// Serrurerie : serrure toujours, crémone si impair des deux côtés, pièces de paumelle par paumelle Mantion
var ferm = JSON.parse(fs.readFileSync(path.join(racine, 'data', 'fermeture-presto.json'), 'utf8'));
data.quincailleries = { fmf150: q, fmf100: q100 };
data.fermeture = ferm;
var echecsFerm = 0;
function qte(r, ref) { var l = r.fermeture.lignes.filter(function (x) { return x.ref === ref; })[0]; return l ? l.qte : 0; }
[
  // [gauche, droite, quincaillerie, serrure, crémone attendue ?, paumelles Mantion attendues, F19.3976.41 attendu]
  [3, 1, 'fmf150', '1pt', true, 3, 1],
  [2, 1, 'fmf150', '1pt', false, 3, 0],
  [3, 2, 'fmf150', '3pts', false, 4, 1],
  [3, 3, 'fmf150', '3pts', true, 4, 2],
  [5, 3, 'fmf100', '1pt', true, 20, 1],
  [3, 1, 'aucune', '1pt', true, 0, 1],
  [3, 0, 'fmf150', '1pt', false, 2, 0]
].forEach(function (t) {
  var c = { corps: '50', sens: 'int', gauche: t[0], droite: t[1], largeur: Math.min(6000, 900 * (t[0] + t[1])), hauteur: 2200,
    remplissage: '9', quincaillerie: t[2], fixation: 'murale', serrure: t[3], cremone: 'levier' };
  var r = Calcul.calculer(c, data);
  var ok = r.ok && (!!r.fermeture.cremone === t[4]) && r.fermeture.paumellesMantion === t[5] &&
    qte(r, 'F19.3985.41') === t[5] && qte(r, 'F19.3986.41') === 2 * t[5] && qte(r, 'F19.3983.41') === 2 * t[5] &&
    qte(r, 'F19.3976.41') === t[6] && qte(r, t[3] === '1pt' ? 'F19.3969.41' : 'F19.3974.41') === 1;
  if (!ok) { echecsFerm++; console.log('✗ serrurerie ' + t[0] + '+' + t[1] + ' ' + t[2] + ' ' + t[3] + ' : ' + JSON.stringify(r.fermeture || r.erreurs)); }
});
console.log('Serrurerie : ' + (echecsFerm ? echecsFerm + ' écart(s)' : '7 / 7 cas conformes (serrure, crémone, pièces de paumelle)'));

// Parclosage : tableau Forster Presto (y + a1 + a2 + b = 47), choix par défaut, épaisseurs hors tableau
var pcl = data.parclosage, echecsPcl = 0;
pcl.tableau.forEach(function (l) {
  if (l[0] + pcl.jointsExterieurs[l[2]].a1 + l[4] + pcl.parcloses[l[1]].b !== 47) { echecsPcl++; console.log('✗ parclosage ligne ' + l.join(' ')); }
});
for (var y = pcl.epaisseurMin; y <= pcl.epaisseurMax; y++) {
  if (!Calcul.combinaisonsParclosage(y, pcl).length) { echecsPcl++; console.log('✗ parclosage : rien pour ' + y + ' mm'); }
}
[[9, '901246|905312|905316'], [24, '901226|905312|905316'], [4, '901247|905312|905316'], [27, '901226|905312|905315']].forEach(function (t) {
  var d0 = Calcul.combinaisonsParclosage(t[0], pcl)[0].cle;
  if (d0 !== t[1]) { echecsPcl++; console.log('✗ parclosage par défaut ' + t[0] + ' mm : ' + d0); }
});
[[3, false], [28, false], [9.5, false], [17, true]].forEach(function (t) {
  var ok = Calcul.calculer({ corps: '50', sens: 'ext', gauche: 2, droite: 1, largeur: 2700, hauteur: 2165, remplissage: t[0] }, data).ok;
  if (ok !== t[1]) { echecsPcl++; console.log('✗ parclosage contrôle ' + t[0] + ' mm : ' + (ok ? 'accepté' : 'refusé')); }
});
var rChoix = Calcul.calculer({ corps: '50', sens: 'ext', gauche: 2, droite: 1, largeur: 2700, hauteur: 2165, remplissage: 9, parclosage: '901228|905314|905317' }, data);
if (rChoix.pieces.filter(function (p) { return p.famille === 'parclose'; })[0].ref !== '901228' ||
    !rChoix.accessoires.some(function (a) { return a.ref === '905314'; }) || !rChoix.accessoires.some(function (a) { return a.ref === '905317'; })) {
  echecsPcl++; console.log('✗ parclosage : choix utilisateur non appliqué');
}
console.log('Parclosage : ' + (echecsPcl ? echecsPcl + ' écart(s)' : pcl.tableau.length + ' lignes du tableau OK, 4 à 27 mm couverts, choix par défaut et choix utilisateur OK'));
process.exit(res.echecs || echecsExport || echecsFmf || echecs100 || echecsFerm || echecsPcl ? 1 : 0);
