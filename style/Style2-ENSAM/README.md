# Style 2 - ENSAM Platform

Ce dossier contient le style ENSAM Platform basé sur Tailwind CSS.

## Fichiers
- `index.css` - Styles globaux avec directives Tailwind et variables ENSAM
- `tailwind.config.js` - Configuration Tailwind avec couleurs ENSAM
- `postcss.config.js` - Configuration PostCSS

## Couleurs principales ENSAM
- Primary: #2C3E50 (Bleu foncé)
- Secondary: #3498DB (Bleu clair - actions)
- Accent: #E74C3C (Rouge - alertes)
- Success: #2ECC71 (Vert)
- Warning: #F39C12 (Orange)

## Couleurs institutionnelles
- ENSAM Blue: #0056B3
- UH2C Blue: #003366
- UH2C Gold: #FFD700

## Pour appliquer ce style
1. Copiez les fichiers dans le dossier racine et src/ :
```bash
copy style\Style2-ENSAM\index.css src\index.css
copy style\Style2-ENSAM\tailwind.config.js tailwind.config.js
copy style\Style2-ENSAM\postcss.config.js postcss.config.js
```

2. Installez les dépendances Tailwind :
```bash
npm install -D tailwindcss postcss autoprefixer
```

## Date de création
4 Janvier 2026

## Référence
Basé sur le STYLE_GUIDE.md de ENSAM Platform
