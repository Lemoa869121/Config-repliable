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
process.exit(res.echecs || echecsExport ? 1 : 0);
