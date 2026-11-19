# Cahier des charges – Configurateur repliable

*Référence fonctionnelle. Version 1 du 10/11/2026. Ce document fait foi en cas de doute sur une règle.*

## 1. Objectif

Sortir la liste matière d'une porte repliable Forster : articles, quantités, longueurs de débit, coupes,
nombre de barres, accessoires et remplissages.

## 2. Sources

- Liste de débit Forster « PRESTO repliables » (objet KDI-PRR), version corrigée du 10/11/2026.
- Règles données par Xavier Guiraud le 10/11/2026.
- Unico : dossier de fabrication Forster Pro « FFR Unico Repliable » du 19/11/2026 (22 positions) et tableau Forster unico 6.7.3 « Vitrage à sec » (V1.0 02-26).

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

## 5 ter. Corps 20 et mixte « corps 20, profil serrure en 50 »

Source : liste de débit Forster corps 20 / mixte du 13/11/2026 (6 positions) et règles Forster du même jour.
Articles corps 20 : dormant 32818 (L 44 BT50), T 32807, Z 32808 (T/Z 65), traverse basse 05535 (NORM H 60).
Parcloses et joints : même tableau que le corps 50 (§5 bis).

| Élément | Corps 20 |
|---|---|
| Largeur ouvrant Lv | (L + 30 × (n − 2)) ÷ n — **ouvrants égaux** (cotes d'axe d'extrémité = Lv, courantes = Lv − 30) |
| Hauteur ouvrant Hv | H − 25 |
| Traverse basse, parcloses horizontales | Lv − 90 |
| Parcloses verticales | Hv − 125 |
| Verre | (Lv − 106) × (Hv − 101) |
| Joint vitrage | Σ 2 × ((Lv − 90) + (Hv − 85)) |
| Joint de battue | n × (2 Lv + 4 Hv − 80) (même formule que le corps 50, confirmée ici à 4 hauteurs) |
| Dormant | 1 × L + 2 × H (comme le corps 50) |

**Mixte** : un seul montant en profil 50 (T 32803 ou Z 32805, selon la règle T/Z), de longueur H. Le vantail qui le porte
a une largeur réduite de 25 mm (traverses, parcloses horizontales, verre, joint vitrage) ; le joint de battue reste calculé
sur la largeur nominale. Position : 1 seul vantail d'un côté → montant de ce vantail côté rencontre ; sinon dernier vantail
du groupe gauche côté rencontre ; tout d'un côté → montant du dernier vantail côté dormant opposé.

Remarques sur la liste de référence : en intérieur, VG / VD sont lus depuis l'intérieur ; A 3+1 et A 3+2 y ont gardé la
répartition du corps 50 (Forster a retenu les ouvrants égaux).

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
- 1 vantail à droite : rencontre Z|T ; 2 vantaux ou plus : rencontre T|Z si le groupe gauche est impair, Z|T s'il est pair
  (4+3 = TT ZZ TT ZZ TT ZZ TT, Forster 13/11/2026), puis T|Z, Z|T… depuis la rencontre ;
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

## 13. Gamme Unico (dossier Forster Pro du 19/11/2026)

Répartition T / Z, Din et position du profil serrure : **mêmes règles que Presto** (§6). Correspondance :
533.752 / 533.732 = T, 533.753 / 533.733 = Z. Vérifié sur les 21 positions exploitables du dossier
(la position « Int 50mm 04 », libellée 3+2, est une copie de la 3+1 : écartée).

### 13.1 Profils et cotes

| | Unico 50 | Unico 30 |
|---|---|---|
| Dormant (haut L, montants H, coupes 135° / 90°) | 533751 | 533731 |
| Ouvrants T / Z | 533752 / 533753 | 533732 / 533733 |
| Traverse basse | 531755 | 531755 |
| Largeur vantail Lv | (L − 110) / n + 20 | (L − 70) / n + 20 |
| Hauteur vantail Hv (montants, coupe 135° haut / 90° bas) | H − 56,5 | H − 36,5 |
| Traverse haute (coupe 135° / 135°) | Lv | Lv |
| Traverse basse, parcloses horizontales | Lv − 130 | Lv − 90 |
| Parcloses verticales | Hv − 175 | Hv − 155 |
| Verre (arrondi inférieur, comme Forster Pro) | (Lv − 146) × (Hv − 150,5) | (Lv − 106) × (Hv − 130,5) |

Traverse haute : Z en ouverture intérieure, T en extérieure. Cotes d'axe du schéma (calculées) : extrémités Lv + 35 (50) ou
Lv + 15 (30), vantaux courants Lv − 20 ; leur somme vaut L.

**50+30** = Unico 30 avec le montant serrure en 50 (533752 / 533753), à la place du profil serrure (§5 ter) :
montant Hv − 6 coupé 121° / 90° ; traverse haute Lv + 10 coupée 135° / 149° ; traverse basse, parcloses horizontales
et verre réduits de 20 mm ; même largeur de vantail.

### 13.2 Parclosage (tableau 6.7.3, vitrage à sec seulement)

y + a1 + a2 + b = 67, y de 20 à 47 mm. Joint extérieur 905812 (a1 = 2) ou 985302 (a1 = 5) ; joint intérieur
905884 (a2 3–4), 905385 (5–6), 905386 (7–8), 905387 (9–10). Parclose au choix : acier 901247 / 901246 / 901228 /
901227 / 901226, inox 901547 / 901546 / 901528 / 901527 / 901526, aluminium 901336 / 901335 / 901328 / 901327 / 901326
(b = 35 / 30 / 25 / 20 / 15). Par défaut : 985302 d'abord, puis la parclose la plus étroite (24 mm → 901246 + 985302
+ 905386, comme le dossier). Ponts de feuillure : 4 par vantail, 986701 jusqu'à 27 mm, 986702 au-delà.

### 13.3 Joints et boutons (en mm, déduits du dossier)

Pv = périmètre de chaque vantail 2 (Lv + Hv) ; Pg = périmètre de chaque verre.

| Article | Unico 50 | Unico 30 / 50+30 |
|---|---|---|
| Joints de vitrage ext. et int. | Σ Pg + 128 n | Σ Pg + 131 n |
| 985305 | Σ Pg + 293 n | Σ Pg + 296 n |
| 985304 ouvrants | Σ Pv + 111 n | Σ Pv + 152 n (− 20 en 50+30) |
| 985304 dormant | L + 2 H + 33 n + 322 | L + 2 H + 33 n + 358 |
| 985301 | Σ Pv + 245 n + 2 Hv + 185 | Σ Pv + 245 n + 2 Hv + 182 (+ 20 en 50+30) |
| Boutons 906579 | 30 par vantail | 30 par vantail |

À recontrôler : tous les vantaux du dossier font 1090 à 1100 × 3000 mm, la part largeur / hauteur ne peut pas être séparée.

### 13.4 Ferrure (P = floor(n / 2))

- Unico 50 et 50+30 : FFR018FND × 1, 907350 × 2, 907353 × 2 ; 987010, 987011, 987454, 987702 × P ; 987072 × 3P ; 987081 × 2P.
- Unico 30 : 987499 × 1, 907327 × 2, 907337 × 2, 987009 × 1 ; 987071 × (4 + 2P) (à confirmer : n + 3 donne les mêmes valeurs
  sur le dossier) ; XA00001, XA00003, XA00004 × P ; XA00002, XA00005 × 2P (références provisoires du dossier).
- Pas de choix serrure / crémone ni de pièces de paumelle FFR.065F à 069F en Unico.

### 13.5 Quincaillerie FMF 150 en Unico

Rail 10500A/600 et bandeau GJ10530P : L ; profil bas GH10430R, joint GH10430DC, seuil GHPG16 : L − 100 (50) ou L − 60 (30, 50+30),
en morceaux égaux de 6000 mm maximum. Supports GJ10530B et GJ10530BP : ceil((L − 50) / 500) + 1 chacun (le dossier n'est
compatible qu'avec un retrait entre 10 et 90 mm) ; embouts GJ10530EN : 2 ; montures et paumelles : règles du §8.
Pas d'aimants, pênes bas, gabarit, emballage ni notice (absents du dossier). FMF 100 non prévu en Unico.

## 9. Limites

Largeur par vantail (largeur de baie ÷ nombre de vantaux) : 500 à 1100 mm (maximum porté de 1000 à 1100 mm le 13/11/2026), bloquant. 2 à 13 vantaux.
Unico : la même plage est contrôlée sur la largeur réelle du vantail Lv (le dossier Forster Pro a des vantaux de 1100 mm pour 1116,7 mm de baie par vantail).

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
| Primary Angles 1 / 2 | angle de coupe à chaque bout (Presto 45 / 90 ; Unico 135 / 90, 121 et 149 comme Forster Pro) | vide | vide |
| Secondary Angles 1 / 2 | 90 / 90 | vide | vide |
| Per Meter, Extension, Colour, Price, Formula 2, Length 2, Assembly Name | vides | vides | vides |

La quincaillerie est exportée comme les accessoires à la pièce (Lenght = 0). En Unico, les profilés Mantion (rail, bandeau, profil bas, joint, seuil) sont exportés comme des profilés (longueur réelle, 90 / 90, Free).

Les remplissages (pas de référence article) ne sont pas exportés.

## 11. Écarts connus avec la liste de débit de référence

- A 8+1 (Din, T/Z), I 6+1 (Din) : non conformes aux règles retenues.
- I 3+1, I 3+3, I 5+1, I 6+1 : T face à T ou Z face à Z dans le PDF → erreurs du PDF (corrigées par la règle intérieure, confirmée).
- Dormant haut > 5900 : coupé par le configurateur (le PDF ne coupe pas toujours).

## 12. Questions ouvertes

limites de hauteur ·
bas de porte · autres remplissages · traverses · Unico : joints sur une autre taille de vantail, 987071, références XA00001 à XA00005, quantité des supports GJ10530B / BP (sets de 4 ?), aimants / pênes / notice absents du dossier, FMF 100.
