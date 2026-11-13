# Cahier des charges – Configurateur repliable

*Référence fonctionnelle. Version 1 du 10/11/2026. Ce document fait foi en cas de doute sur une règle.*

## 1. Objectif

Sortir la liste matière d'une porte repliable Forster : articles, quantités, longueurs de débit, coupes,
nombre de barres, accessoires et remplissages.

## 2. Sources

- Liste de débit Forster « PRESTO repliables » (objet KDI-PRR), version corrigée du 10/11/2026.
- Règles données par Xavier Guiraud le 10/11/2026.

## 3. Saisies

Gamme · sens d'ouverture (extérieur / intérieur) · vantaux repliés à gauche / à droite · largeur et hauteur
de baie · épaisseur des profils · remplissage · traverses · quincaillerie.
V1 : voir le tableau du README (options non documentées affichées « à venir »).

## 4. Règles générales

1. Seuls comptent les repères présents dans la liste matière ; un numéro du schéma absent de la liste est ignoré.
2. Le plat de soudage 917017 est ignoré.
3. Barres : longueur utile **5900 mm**. Une pièce plus longue est coupée en morceaux.
4. Serrurerie : voir §8 ter (consignes du 13/11/2026 ; remplace « pas de serrure » du 10/11/2026).
5. À chaque jonction entre deux vantaux : **jamais un T face à un T, jamais un Z face à un Z**.
6. Pièces intercalaires : **2 × 916320 + 2 × 916322 par vantail**, quel que soit le Din
   (les 985631 / 985632 sont remplacées par les 916320 / 916322).

## 5. Formules Presto corps 50

L = largeur baie, H = hauteur baie, n = nombre de vantaux.

| Élément | Article | Pièces | Longueur | Coupe |
|---|---|---|---|---|
| Dormant haut | 32800 | 1 (coupé si > 5900) | L | 45° / 45° |
| Dormant gauche et droit | 32800 | 2 | H | 45° haut / 90° bas |
| Largeur ouvrant Lv | – | – | (L − 110) / n + 30 | – |
| Hauteur ouvrant Hv | – | – | H − 50 | – |
| Axes (cotes du schéma) | – | – | extrêmes Lv + 25, courants Lv − 30 | – |
| Traverse haute | 32803 T (ext.) / 32805 Z (int.) | 1 / vantail | Lv | 45° / 45° |
| Montants | 32803 T ou 32805 Z | 2 / vantail | Hv | 45° haut / 90° bas |
| Traverse basse | 32855 | 1 / vantail | Lv − 140 | 90° / 90° |
| Parclose horizontale | selon le parclosage (§5 bis) | 2 / vantail | Lv − 140 | droite |
| Parclose verticale | idem | 2 / vantail | Hv − 180 | droite |
| Verre | – | 1 / vantail | (Lv − 156) × (Hv − 156) | – |
| Joint vitrage ext. / int. | selon le parclosage (§5 bis) | – | n × 2 × ((Lv − 140) + (Hv − 140)) | – |
| Joint de battue | 905306 | – | n × (2 Lv + 4 Hv − 80) — validée par Forster le 13/11/2026 | – |
| Bouton de parclose | 906579 | arrondi(ml de parclose ÷ 0,20) | – | – |

Arrondis : Lv au dixième ; verres au millimètre.

## 5 bis. Parclosage (épaisseur de remplissage libre)

Source : Forster Presto, Verarbeitung VP 3.8.22 / 3.8.23, « Variantes de vitrages – vitrage à sec (EPDM), 1 parclose »
(acier, 01/21). Tableau théorique pour parcloses affleurées ; pas autorisé pour coupe-feu.
Saisie : épaisseur y de 4 à 27 mm (entier). Les 80 combinaisons du tableau sont dans `data/presto.json` (`parclosage.tableau`)
et vérifient y + a1 + a2 + b = 47.

| Parclose | b | Épaisseurs |
|---|---|---|
| 901247 | 35 | 4 à 7 |
| 901246 | 30 | 4 à 12 |
| 901228 | 25 | 9 à 17 |
| 901227 | 20 | 14 à 22 |
| 901226 | 15 | 19 à 27 |

Joints extérieurs : 905312 (a1 = 2) ou 905314 (a1 = 5). Joints intérieurs : 905315 (a2 3–5), 905316 (a2 4–6), 905317 (a2 6–8).

Plusieurs combinaisons conviennent souvent : le configurateur les liste et propose par défaut la première selon
l'ordre de préférence **joint extérieur 905312 puis 905314 ; joint intérieur 905316, puis 905315, puis 905317 ;
à égalité, parclose la plus large**. L'utilisateur peut en choisir une autre. Ex. 9 mm → 901246 + 905312 + 905316 ;
24 mm → 901226 + 905312 + 905316 (identiques à la liste de débit de référence).

Les longueurs de parcloses, les dimensions de verre et les métrages de joints ne changent pas (profondeur de parclose 20 mm partout).

## 6. Répartition des vantaux

k = vantaux repliés à gauche, m = à droite. « 3 » seul = 3 à gauche, 0 à droite.

**Din (extérieur)** : alternance L, R, L… depuis la gauche ; s'il y a au moins un vantail à droite, le dernier est toujours R
(A 3+2 = L R L R R, confirmé le 10/11/2026) ; tout à droite : miroir.
**Din (intérieur)** : groupe gauche depuis le mur L, R, L… ; groupe droit depuis le mur R, L, R… ; puis tout inversé (I 3+2 = R L R R L).

**T / Z** – règle générale : jamais T face à T ni Z face à Z. L'intérieur n'est **pas** le simple inverse de
l'extérieur (confirmé par Forster le 10/11/2026 : A 3+2 = TT ZZ TT ZT ZT, I 3+2 = ZZ TT ZZ TT ZZ).

*Extérieur* (par jonctions ; « T|Z » = montant droit du vantail de gauche en T, montant gauche du suivant en Z) :
- montants contre le dormant : T ;
- groupe gauche depuis le mur : T|Z, Z|T, T|Z… ;
- 1 vantail à droite : rencontre Z|T ; 2 vantaux ou plus : rencontre T|Z, puis T|Z, Z|T… depuis la rencontre ;
- tout à droite : miroir de « tout à gauche ».
Ex. 3+1 = TT ZZ TZ TT · 3+2 = TT ZZ TT ZT ZT · 3+3 = TT ZZ TT ZT ZZ TT.

*Intérieur* (par groupes) :
- chaque groupe alterne ZZ, TT, ZZ… en partant de son mur (montants contre le dormant en Z) ; traverse haute en Z ;
- en cas de conflit à la rencontre, un seul vantail mixte (dernier du groupe gauche si un seul vantail à droite,
  sinon premier du groupe droit).
Ex. 3+2 = ZZ TT ZZ TT ZZ · 3+1 = ZZ TT ZT ZZ · 3+3 = ZZ TT ZZ TZ TT ZZ · 5+1 = ZZ TT ZZ TT ZT ZZ (confirmés le 10/11/2026).

Répartitions vérifiées sur un exemple Forster : extérieur 2+1, 3, 3+1, 3+2, 3+3, 4+1, 5, 5+1, 6+1, 7, 7+1 ; intérieur 2+1, 3, 3+1, 3+2, 3+3, 4+1, 5, 5+1.
Les autres affichent une alerte « non vérifiée ».

## 7. Coupe du dormant haut

Si L > 5900 : coupe sur un axe de vantail, nombre minimal de morceaux, morceaux les plus équilibrés possible.
Coupe droite à la jonction, 45° aux angles.

## 8. Quincaillerie FMF 150 (Mantion OPENTEC)

Source : 40 devis Slidsoft (20 configurations × repli intérieur / extérieur) relevés le 10/11/2026 et règles Forster
du même jour. Les cotes Slidsoft ne sont qu'indicatives : seules comptent les quantités liées au nombre de vantaux.
Le « repli intérieur » Slidsoft correspond à l'ouverture intérieure du configurateur.
k = vantaux à gauche, m = à droite, n = k + m, L = largeur de baie.

| Article | Règle |
|---|---|
| GJ10530HOL / HOR (sets de 3 paumelles) | Par groupe de g vantaux : floor(g/2) + 1 sets. Groupe gauche : 1 HOL + le reste en HOR ; groupe droit : le reste en HOL + 1 HOR (intérieur). Extérieur : HOL ↔ HOR |
| GJ10530IH / EHL / EHR (montures) | Total floor((n − 1)/2). Une EH remplace une IH si k ≥ 1 et m ≥ 1 sont de parités différentes : intérieur EHL si le côté pair est à gauche, sinon EHR ; extérieur inversé |
| GHLK-02 (aimants) | floor(n/2) + 1 |
| GJ10530FO (pênes bas) | floor(n/2) |
| 10500A/600, GH10430R, GH10430DC, GHPG16 | barres de 6000 mm : arrondi supérieur de L / 6000 |
| GJ10530B (sets de 4 supports) | 1 support à chaque bout + 1 tous les 500 mm = ceil(L / 500) + 1 supports → arrondi supérieur ÷ 4 |
| GJ10530GS-6, GH10430LSB, NM_FMF15_001 | 1 chacun |

Vérification : les quantités dépendant du nombre de vantaux redonnent les 40 devis Slidsoft.

## 8 bis. Quincaillerie FMF 100 (Mantion OPENTEC)

Source : 80 devis Slidsoft (20 configurations × repli intérieur / extérieur × fixation murale / plafond) relevés le
10/11/2026. Mêmes principes que le FMF 150 : cotes Slidsoft indicatives, barres de 6000 mm, équerres tous les 500 mm.
Saisie supplémentaire : **fixation du rail** (murale ou plafond). Aucun article gauche / droite : intérieur = extérieur.

| Article | Règle |
|---|---|
| GJ10430IH / GJ10430EH (montures) | Total floor((n − 1)/2) ; une EH remplace une IH si k ≥ 1 et m ≥ 1 sont de parités différentes |
| 1512SOM12 (charnières M12) | = nombre de montures |
| 1512SOG (charnières à graisseur) | 2 × n + 2 × nombre de côtés équipés + nombre de EH |
| GHLK-01 (aimants 26 mm) | = nombre de montures |
| GHLK-02 (aimants 60 mm) | nombre de côtés ayant un nombre impair de vantaux ≥ 3 |
| 10400A/600, GH10430R, GH10430DC, GHPG16 | arrondi supérieur de L / 6000 |
| GH10430P (bandeau) | murale : arrondi supérieur de L / 6000 ; plafond : aucun |
| GH10430B (sets de 4 équerres) | murale : (ceil(L / 500) + 1) supports ÷ 4, arrondi supérieur ; plafond : aucun |
| GH10430BP (sets de supports de bandeau) | murale : arrondi supérieur de L / 2500 (relevé Slidsoft, à confirmer) ; plafond : aucun |
| GH10430EN (embouts de bandeau) | murale : 1 ; plafond : aucun |
| GH10430L / GH10430LSB (emballage) | 1 seulement si les deux côtés ont des vantaux (L en murale, LSB en plafond) – à confirmer |
| GJ10430GS-4, NM_FMF10_001 | 1 chacun |

Limites propres au FMF 100 (fiche Slidsoft), bloquantes : 3 à 8 vantaux, largeur ≤ 6000 mm, hauteur ≤ 2400 mm,
pas de nombre pair de vantaux des deux côtés (4+2, 2+2, 6+0…).

Vérification : 80 / 80 devis Slidsoft retrouvés (hors barres de 3 m que Slidsoft utilise jusqu'à 3000 mm).

## 8 ter. Serrurerie (Presto standard)

Source : application Serrure STD (Presto, protection Standard) et consignes Forster du 13/11/2026.
Référence article = **code F19** (export Forster Pro). Fichier : `data/fermeture-presto.json`.

| Élément | Quand | Articles |
|---|---|---|
| Serrure 1 point | toujours (choix 1 point) | F19.3969.41 (FFR042FND) + F19.3973.41 (FFR046FND) |
| Serrure 3 points | toujours (choix 3 points) | F19.3974.41 (FFR047FND) + F19.3973.41 + F19.3976.41 (FFR049FND) + F19.3977.41 (FFR050FND) + F19.3913.41 (FFR019FND kit n°1) |
| Crémone à levier / à cylindre | seulement si k et m sont tous les deux impairs (3+1, 5+1, 7+1, 3+3, 5+3…) | F19.3972.41 (FFR.045F.ND.A) ou F19.3975.41 (FFR.048F.ND.A) + F19.3976.41 + F19.3977.41 |
| Pièces de paumelle | toujours, × nombre de paires de vantaux repliés = floor(k/2) + floor(m/2) (3+1 → 1 ; 4+1, 5+1, 3+2, 3+3 → 2 ; 6+1, 7+1, 4+2, 4+3, 5+2, 5+3 → 3 ; 8+1, 4+4, 5+4 → 4), quelle que soit la quincaillerie (consigne du 13/11/2026) | F19.3985.41 ×1, F19.3986.41 ×2, F19.3987.41 ×1, F19.3983.41 ×2, F19.3989.41 ×1 (FFR.065F à FFR.069F) |

Les articles communs (F19.3976.41, F19.3977.41 en serrure 3 points + crémone) sont additionnés.

## 9. Limites

Largeur par vantail (largeur de baie ÷ nombre de vantaux) : 500 à 1100 mm (maximum porté de 1000 à 1100 mm le 13/11/2026), bloquant. 2 à 13 vantaux.

## 10. Export Excel (fichier d'import)

Bouton « Excel Forster Pro », fichier `export_excel_FP_<chantier>_<sens>_<k>+<m>_<L>x<H>.xlsx`. Format du fichier « export_excel_FP.xlsx » / « 2020 - Import - EN - Zusatzartikel.xlsx » fourni par Forster (feuille Tabelle1, listes de choix
de la feuille Tabelle2 conservées). Une ligne par pièce identique (article, longueur, coupes, emplacement).

| Colonne | Profilés et parcloses | Joints (au mètre) | Accessoires à la pièce |
|---|---|---|---|
| Article Number | référence | référence | référence |
| Lenght [mm] | longueur de débit | longueur totale en mm | 0 |
| Quantity | nombre de pièces | 1 | nombre de pièces |
| Formula | Fixed Length | Fixed Length | Fixed Length |
| Location | Top (dormant haut), Left (dormant gauche), Right (dormant droit), Free (le reste) | Free | Free |
| Primary Angles 1 / 2 | angle de coupe à chaque bout (45 ou 90) | vide | vide |
| Secondary Angles 1 / 2 | 90 / 90 | vide | vide |
| Per Meter, Extension, Colour, Price, Formula 2, Length 2, Assembly Name | vides | vides | vides |

La quincaillerie est exportée comme les accessoires à la pièce (Lenght = 0).

Les remplissages (pas de référence article) ne sont pas exportés.

## 11. Écarts connus avec la liste de débit de référence

- A 8+1 (Din, T/Z), I 6+1 (Din) : non conformes aux règles retenues.
- I 3+1, I 3+3, I 5+1, I 6+1 : T face à T ou Z face à Z dans le PDF → erreurs du PDF (corrigées par la règle intérieure, confirmée).
- Dormant haut > 5900 : coupé par le configurateur (le PDF ne coupe pas toujours).

## 12. Questions ouvertes

limites de hauteur ·
bas de porte · corps 20 et mixte · autres remplissages · traverses · FMF 100 · Unico.
