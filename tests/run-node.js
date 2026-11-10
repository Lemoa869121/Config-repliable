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
process.exit(res.echecs ? 1 : 0);
