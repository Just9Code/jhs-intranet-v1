# 🏗️ JHS ENTREPRISE - Intranet BTP Sécurisé

Intranet complet et sécurisé pour la gestion de chantiers, stock et équipes d'une entreprise BTP.

![JHS ENTREPRISE](https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&h=300&fit=crop)

## ✨ Fonctionnalités

### 🔐 Authentification & Sécurité
- **Login animé** avec thème construction (briques qui se construisent, pelleteuse animée)
- **Gestion des rôles** : Admin, Travailleur, Client
- **Contrôle d'accès** basé sur les rôles avec routes protégées
- **Session persistante** avec Zustand

### 📊 Dashboard
- **Statistiques en temps réel** : chantiers, stock, fichiers, utilisateurs, mouvements
- **Actions rapides** : accès direct aux fonctionnalités principales
- **Animations BTP** : icônes animées (casque, truelle, brouette)
- **Interface adaptative** selon le rôle utilisateur

### 🏗️ Gestion des Chantiers
- **CRUD complet** : créer, lire, modifier, supprimer
- **Recherche avancée** : par nom, adresse, client, responsable
- **Filtres multiples** : statut (en cours, terminé, en attente, annulé)
- **Détails chantier** :
  - Informations client et responsable
  - Dates de début/fin
  - Description et notes internes
  - Fichiers associés (factures, devis, PDF, photos, vidéos)
- **Albums photos/vidéos** par chantier
- **Vue restreinte** pour les clients (uniquement leurs chantiers)

### 📦 Gestion de Stock
- **Deux catégories** : Matériaux et Matériels
- **Inventaire complet** :
  - Matériaux : nom, quantité, unité (kg, m³, sac...), statut
  - Matériels : nom, quantité, statut (disponible, emprunté, maintenance)
- **Mouvements de stock** :
  - Actions : retrait, retour, ajout, suppression
  - Historique complet avec date, utilisateur, quantité, notes
  - Icônes visuelles (flèches) pour type de mouvement
- **Recherche et filtres** par nom et statut
- **Mise à jour automatique** des quantités lors des mouvements

### 👥 Gestion des Utilisateurs (Admin uniquement)
- **CRUD utilisateurs** : créer, modifier, supprimer
- **Informations complètes** :
  - Nom, email, mot de passe (hashé avec bcrypt)
  - Rôle avec emojis (👑 Admin, 🔧 Travailleur, 👤 Client)
  - Statut (actif/inactif)
  - Téléphone, adresse
  - Date d'inscription, dernière connexion
- **Recherche et filtres** par nom, email, rôle, statut
- **Avatars** avec initiales automatiques
- **Édition profil** pour les travailleurs (leurs propres infos)

### 🎨 Design & UX
- **Thème BTP** : anthracite (#252525) + orange chantier (#E87722) + blanc
- **Animations personnalisées** :
  - Briques qui se construisent
  - Pelleteuse qui creuse
  - Béton qui coule
  - Marteau qui frappe
  - Truelle de validation
- **Responsive parfait** : mobile, tablette, desktop
- **Navigation sticky** avec logout accessible partout
- **Transitions fluides** et micro-interactions
- **Mode clair/sombre** supporté

## 🚀 Technologies

- **Framework** : Next.js 15 (App Router)
- **TypeScript** : typage strict
- **Database** : Turso (SQLite) avec Drizzle ORM
- **UI** : Shadcn/UI + Tailwind CSS v4
- **State** : Zustand (authentification)
- **Animations** : Framer Motion + CSS personnalisé
- **Sécurité** : bcrypt pour le hashage des mots de passe

## 📦 Installation

```bash
# Cloner le projet
git clone <repository-url>
cd jhs-entreprise

# Installer les dépendances
npm install
# ou
bun install

# Lancer le serveur de développement
npm run dev
# ou
bun dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## 🔑 Comptes de Test

### Admin (Accès complet)
- **Email** : admin@jhs.fr
- **Mot de passe** : admin123
- **Permissions** : Tout (chantiers, stock, utilisateurs)

### Travailleur (Accès étendu)
- **Email** : jean.martin@jhs.fr
- **Mot de passe** : jean123
- **Permissions** : Chantiers, stock, son profil (pas de gestion utilisateurs)

### Client (Accès restreint)
- **Email** : pierre.bernard@gmail.com
- **Mot de passe** : client123
- **Permissions** : Uniquement ses chantiers et leurs fichiers

## 📁 Structure du Projet

```
src/
├── app/
│   ├── login/page.tsx          # Page de connexion animée
│   ├── dashboard/page.tsx      # Tableau de bord
│   ├── chantiers/page.tsx      # Gestion des chantiers
│   ├── stock/page.tsx          # Gestion de stock
│   ├── users/page.tsx          # Gestion des utilisateurs
│   ├── page.tsx                # Redirection automatique
│   ├── layout.tsx              # Layout principal
│   ├── globals.css             # Styles globaux + animations BTP
│   └── api/                    # API Routes
│       ├── users/route.ts
│       ├── chantiers/route.ts
│       ├── chantier-files/route.ts
│       ├── stock-materiaux/route.ts
│       ├── stock-materiels/route.ts
│       └── stock-movements/route.ts
├── components/
│   ├── Navigation.tsx          # Barre de navigation
│   ├── ProtectedRoute.tsx      # HOC pour routes protégées
│   └── ui/                     # Composants Shadcn/UI
├── lib/
│   └── auth.ts                 # Gestion authentification (Zustand)
└── db/
    ├── index.ts                # Configuration DB
    ├── schema.ts               # Schéma Drizzle
    └── seeds/                  # Données de test
```

## 🎯 Fonctionnalités Avancées

### Contrôle d'Accès par Rôle

| Fonctionnalité | Admin | Travailleur | Client |
|----------------|-------|-------------|--------|
| Dashboard | ✅ | ✅ | ✅ (limité) |
| Voir chantiers | ✅ Tous | ✅ Tous | ✅ Siens uniquement |
| Créer/Modifier chantier | ✅ | ✅ | ❌ |
| Supprimer chantier | ✅ | ✅ | ❌ |
| Gérer stock | ✅ | ✅ | ❌ |
| Mouvements stock | ✅ | ✅ | ❌ |
| Voir utilisateurs | ✅ | ❌ | ❌ |
| Créer/Supprimer utilisateurs | ✅ | ❌ | ❌ |
| Modifier profil | ✅ Tous | ✅ Soi-même | ❌ |

### Animations Personnalisées

```css
/* Exemples d'animations disponibles */
.animate-brick-build      /* Briques qui se construisent */
.animate-excavator-dig    /* Pelleteuse qui creuse */
.animate-concrete-flow    /* Béton qui coule */
.animate-hammer-strike    /* Marteau qui frappe */
.animate-trowel-check     /* Truelle de validation */
```

## 🗄️ Base de Données

### Schéma Principal

**users**
- Informations utilisateur
- Rôles et permissions
- Authentification (bcrypt)

**chantiers**
- Projets de construction
- Relations : client, responsable
- Statuts et dates

**chantier_files**
- Documents liés aux chantiers
- Types : factures, devis, PDF, photos, vidéos

**stock_materiaux**
- Matériaux de construction
- Quantités et unités

**stock_materiels**
- Équipements et matériels
- Statuts de disponibilité

**stock_movements**
- Historique complet des mouvements
- Actions et traçabilité

## 🎨 Palette de Couleurs

```css
/* Thème BTP */
--primary: oklch(0.58 0.18 45)      /* Orange chantier */
--secondary: oklch(0.25 0 0)        /* Anthracite */
--background: oklch(0.98 0 0)       /* Blanc cassé */
--muted: oklch(0.95 0 0)            /* Gris clair */
--border: oklch(0.9 0 0)            /* Bordures */
```

## 📱 Responsive Design

- **Mobile** : Navigation hamburger, cartes empilées
- **Tablette** : Grille 2 colonnes, navigation complète
- **Desktop** : Grille 3 colonnes, toutes les fonctionnalités

## 🔒 Sécurité

- ✅ Mots de passe hashés (bcrypt, 10 rounds)
- ✅ Routes protégées par authentification
- ✅ Contrôle d'accès basé sur les rôles
- ✅ Session sécurisée avec Zustand persist
- ✅ Validation des données côté client et serveur
- ✅ Protection contre les injections SQL (Drizzle ORM)
- ✅ Gestion des erreurs complète

## 🚧 Données Seed

L'application inclut des données de démonstration :
- **5 utilisateurs** (1 admin, 2 travailleurs, 2 clients)
- **6 chantiers** avec différents statuts
- **12 matériaux** en stock (ciment, sable, briques...)
- **10 matériels** (pelleteuse, bétonneuse, échafaudage...)
- **15 mouvements** de stock avec historique
- **8 fichiers** attachés aux chantiers

## 🎯 Points Clés

✨ **Interface intuitive** avec animations thématiques BTP
🔐 **Sécurité robuste** avec gestion de rôles
📊 **Dashboard informatif** avec statistiques temps réel
🏗️ **Gestion complète** des chantiers et fichiers
📦 **Stock optimisé** avec historique détaillé
👥 **Administration** utilisateurs flexible
📱 **100% responsive** sur tous les appareils
🎨 **Design moderne** anthracite + orange
⚡ **Performance** optimale avec Next.js 15

## 📄 License

Ce projet est développé pour JHS ENTREPRISE - Tous droits réservés.

---

**Développé avec ❤️ et 🏗️ pour JHS ENTREPRISE**

*Intranet BTP professionnel, sécurisé et élégant*
