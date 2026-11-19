# Configurateur repliable – Forster

Application web qui sort la **liste matière d'une porte repliable** : débit des profilés et des parcloses
(quantités, longueurs, coupes), nombre de barres, accessoires et remplissages.

> Calcul non contractuel : toutes les données sont à vérifier avant fabrication.

## Périmètre de la V1

| Saisie | Disponible | À venir |
|---|---|---|
| Gamme | Presto, Unico | – |
| Sens d'ouverture | Extérieur, intérieur | – |
| Vantaux | Repliés à gauche / à droite (2 à 13 au total ; 500 à 1100 mm par vantail : baie ÷ n en Presto, largeur réelle du vantail en Unico) | – |
| Dimensions | Largeur et hauteur de baie | Limites de hauteur |
| Profils | Presto : corps de 50, corps de 20, corps de 20 avec profil serrure en 50. Unico : 50, 30, 30 avec profil serrure en 50 (50+30) | – |
| Remplissage | Presto : 4 à 27 mm, tableau Forster Presto. Unico : 20 à 47 mm, tableau Forster Unico « vitrage à sec », parclose acier, inox ou aluminium. Choix parmi les combinaisons possibles | – |
| Traverses | – | Quantité et épaisseur (50 / 20 / 10) |
| Serrurerie | Presto : serrure 1 ou 3 points, crémone à levier ou à cylindre (si impair des deux côtés), pièces de paumelle. Unico : ferrure du dossier Forster Pro, imposée par l'épaisseur | – |
| Quincaillerie | Presto : FMF 150, FMF 100 (murale ou plafond). Unico : FMF 150 selon le dossier Forster Pro (rail, bandeau, profil bas, joint et seuil à la longueur réelle). Sans quincaillerie | FMF 100 en Unico |

Aucun prix n'est stocké dans le dépôt (dépôt public).

## Utilisation

- En ligne : `https://lemoa869121.github.io/Config-repliable/` (après activation de GitHub Pages).
- En local :

```bash
git clone https://github.com/Lemoa869121/Config-repliable.git
cd Config-repliable
python3 -m http.server
# puis ouvrir http://localhost:8000
```

Un double-clic sur `index.html` ne fonctionne pas : le navigateur bloque la lecture de `data/presto.json`.

## Organisation du code

| Fichier | Rôle |
|---|---|
| `index.html` | Application |
| `css/style.css` | Charte graphique Forster (Faktum, couleurs, logo) |
| `js/calcul.js` | Moteur de calcul (fonctions pures, aussi utilisable sous Node) |
| `js/app.js` | Formulaire, schéma, tableaux, impression, copie, export CSV |
| `js/export-excel.js` | Bouton « Excel Forster Pro » : fichier `export_excel_FP_….xlsx` au format d'import « Import – Zusatzartikel » |
| `js/modele-import-excel.js` | Modèle de ce fichier (généré, ne pas modifier à la main) |
| `data/presto.json` | Articles, cotes de déduction, règles Presto, limites |
| `data/fmf150.json` | Articles et paramètres de la quincaillerie FMF 150 |
| `data/fermeture-presto.json` | Serrures, crémones et pièces de paumelle Presto (codes F19) |
| `data/fmf100.json` | Articles, paramètres et limites de la quincaillerie FMF 100 |
| `data/unico.json` | Articles, cotes, joints, parclosage et limites Unico (établi à partir du dossier Forster Pro et du tableau 6.7.3) |
| `data/fmf-unico.json` | Quincaillerie FMF 150 en Unico (dossier Forster Pro) |
| `data/fermeture-unico.json` | Ferrure Unico 50 / 30 (dossier Forster Pro) |
| `tests/cas-pdf.json` | Positions de la liste de débit Forster utilisées comme référence |
| `tests/cas-fmf150.json` | 40 devis Slidsoft FMF 150 (quantités dépendant du nombre de vantaux) |
| `tests/cas-corps20.json` | 6 positions Forster en corps 20 et mixte 20/50 |
| `tests/cas-fmf100.json` | 80 devis Slidsoft FMF 100 (intérieur / extérieur × murale / plafond) |
| `tests/cas-unico.json` | 22 positions du dossier Forster Pro « FFR Unico Repliable » (la « Int 50mm 04 » est une copie de la 3+1 : ignorée) |
| `tests/verifier.js` | Comparaison calcul / référence |
| `tests/tests.html`, `tests/run-node.js` | Lancement des tests (navigateur / ligne de commande) |
| `CAHIER_DES_CHARGES.md` | Règles métier (fait foi) |

**Principe :** les articles et les cotes vivent dans `data/`, la logique dans `js/`.

## Tests

```bash
node tests/run-node.js
```

ou ouvrir `tests/tests.html` via le serveur local. Les 21 positions de la liste de débit
« PRESTO repliables » sont recalculées et comparées (débits, T / Z, Din, verres, joints, boutons).
La ligne de commande contrôle aussi les devis FMF, la serrurerie, le parclosage, le corps 20 et les
21 positions Unico du dossier Forster Pro (ouvrants, dormant, parcloses, verres, joints, ferrure, quincaillerie).

## Schéma

Même style pour toutes les gammes (plans Forster Pro Unico) : vue de l'extérieur, vitrage bleu clair,
vantaux 1.1, 1.2… de gauche à droite, lignes d'ouverture en V (pointe côté paumelles), flèche de repli,
« S » sur le vantail semi-fixe (celui qui reçoit le vantail principal), poignée sur le profil serrure,
cotes d'axe, largeur, hauteur et hauteur + rail (67 mm) quand une quincaillerie est choisie.
