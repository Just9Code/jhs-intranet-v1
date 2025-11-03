# 🔒 Système de Comptes Inactifs/Désactivés - JHS ENTREPRISE

## ✅ Implémentation Complète

Le système de gestion des comptes inactifs a été entièrement implémenté pour empêcher les utilisateurs désactivés d'accéder à l'intranet.

---

## 🎯 Fonctionnalités

### 1. **Blocage à la Connexion**
- ❌ Les comptes avec `status = 'inactive'` ne peuvent pas se connecter
- 📨 Message d'erreur clair : *"Votre compte a été désactivé. Veuillez contacter un administrateur."*
- 🔴 Erreur HTTP 403 (Forbidden) avec code `ACCOUNT_DISABLED`

### 2. **Blocage au Niveau du Middleware**
- 🛡️ Vérification en temps réel du statut à chaque requête
- 🚫 Déconnexion automatique si le compte devient inactif pendant la session
- 🔄 Redirection vers la page de login avec paramètre `?error=account_disabled`

### 3. **Interface Utilisateur Améliorée**
- ⚠️ Message d'alerte visuel avec icône pour les comptes désactivés
- 🎨 Couleur orange pour différencier des erreurs classiques (rouge)
- 📱 Toast notification persistante (6 secondes) pour plus de visibilité
- 🧹 Nettoyage automatique du localStorage pour éviter les tentatives répétées

### 4. **Gestion Administrative**
- 👑 Les admins peuvent activer/désactiver les comptes depuis `/users`
- 🔧 Les travailleurs peuvent voir leur propre statut mais pas le modifier
- 📊 Badge visuel "Inactif" (rouge) vs "Actif" (vert) dans le tableau

---

## 📂 Fichiers Modifiés

### 1. **API de Connexion** - `src/app/api/auth/signin/route.ts`
```typescript
// ✅ Vérification du statut avant authentification
if (user.status === 'inactive') {
  return NextResponse.json(
    { 
      error: 'Votre compte a été désactivé. Veuillez contacter un administrateur.',
      code: 'ACCOUNT_DISABLED'
    },
    { status: 403 }
  );
}

// ✅ Mise à jour du dernier login
await db
  .update(users)
  .set({ lastLogin: new Date().toISOString() })
  .where(eq(users.id, user.id));
```

### 2. **Middleware de Protection** - `middleware.ts`
```typescript
// ✅ Vérification du statut en base de données
const [user] = await db
  .select({ id: users.id, status: users.status })
  .from(users)
  .where(eq(users.id, payload.userId))
  .limit(1);

if (!user || user.status === 'inactive') {
  // Déconnexion forcée + redirection avec message
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('error', 'account_disabled');
  
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('jhs_auth_token');
  
  return response;
}
```

### 3. **Page de Login** - `src/app/login/page.tsx`
```typescript
// ✅ Détection du paramètre d'erreur
useEffect(() => {
  const errorParam = searchParams.get('error');
  if (errorParam === 'account_disabled') {
    setError('Votre compte a été désactivé. Veuillez contacter un administrateur.');
    toast.error('Compte désactivé', {
      description: 'Votre compte a été désactivé. Contactez un administrateur.',
      duration: 6000,
    });
    localStorage.removeItem('bearer_token');
  }
}, [searchParams]);

// ✅ Message d'erreur stylisé avec icône
{error && (
  <div className={`${
    error.includes('désactivé') || error.includes('disabled')
      ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
      : 'bg-red-500/10 border-red-500/30 text-red-400'
  } ...`}>
    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="font-semibold mb-1">
        {error.includes('désactivé') || error.includes('disabled') 
          ? 'Compte désactivé' 
          : 'Erreur de connexion'}
      </p>
      <p className="text-xs opacity-90">{error}</p>
    </div>
  </div>
)}
```

---

## 🧪 Tests de Validation

### Test 1 : Connexion avec compte actif ✅
```bash
# Requête
POST /api/auth/signin
{ "email": "jean.martin@jhs.fr", "password": "jean123" }

# Réponse : 200 OK
{
  "success": true,
  "user": { "status": "active", ... },
  "token": "eyJhbGciOi..."
}
```

### Test 2 : Désactivation du compte ✅
```bash
# Requête (admin uniquement)
PUT /api/users?id=2
{ "status": "inactive" }

# Réponse : 200 OK
{
  "id": 2,
  "status": "inactive",
  ...
}
```

### Test 3 : Tentative de connexion avec compte inactif ❌
```bash
# Requête
POST /api/auth/signin
{ "email": "jean.martin@jhs.fr", "password": "jean123" }

# Réponse : 403 Forbidden
{
  "error": "Votre compte a été désactivé. Veuillez contacter un administrateur.",
  "code": "ACCOUNT_DISABLED"
}
```

### Test 4 : Accès avec token existant mais compte désactivé ❌
```bash
# Le middleware détecte automatiquement le statut "inactive"
# Redirection vers : /login?error=account_disabled
# Cookie JWT supprimé
```

---

## 🔐 Flux de Sécurité

```
┌─────────────────────────────────────────────────────────────┐
│  1. Utilisateur tente de se connecter                       │
│     POST /api/auth/signin                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ Email/Password valide?│
         └───────┬───────────────┘
                 │ NON
                 ├──────► 401 Unauthorized
                 │
                 │ OUI
                 ▼
         ┌───────────────────────┐
         │ Status = 'active'?    │
         └───────┬───────────────┘
                 │ NON
                 ├──────► 403 Forbidden + "ACCOUNT_DISABLED"
                 │
                 │ OUI
                 ▼
         ┌───────────────────────┐
         │ Générer JWT Token     │
         │ + Mettre à jour login │
         └───────┬───────────────┘
                 │
                 ▼
         ┌───────────────────────┐
         │ 200 OK + Connexion    │
         └───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  2. Utilisateur accède à une route protégée                 │
│     Middleware vérifie à chaque requête                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │ JWT Token valide?     │
         └───────┬───────────────┘
                 │ NON
                 ├──────► Redirect /login
                 │
                 │ OUI
                 ▼
         ┌───────────────────────┐
         │ Vérifier status en DB │
         └───────┬───────────────┘
                 │
                 ▼
         ┌───────────────────────┐
         │ Status = 'active'?    │
         └───────┬───────────────┘
                 │ NON
                 ├──────► Déconnexion forcée
                 │        + Redirect /login?error=account_disabled
                 │
                 │ OUI
                 ▼
         ┌───────────────────────┐
         │ Autoriser l'accès     │
         └───────────────────────┘
```

---

## 📊 Schéma de Base de Données

```sql
-- Table users (src/db/schema.ts)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',  -- ✅ Colonne clé
  phone TEXT,
  address TEXT,
  photo_url TEXT,
  auth_user_id TEXT,
  created_at TEXT NOT NULL,
  last_login TEXT
);

-- Valeurs possibles pour status
-- 'active'   : Compte actif (valeur par défaut)
-- 'inactive' : Compte désactivé par un admin
```

---

## 👨‍💼 Guide d'Utilisation (Administrateur)

### Désactiver un compte
1. Aller sur `/users`
2. Cliquer sur **Modifier** pour l'utilisateur concerné
3. Dans le champ **Statut**, sélectionner **Inactif**
4. Cliquer sur **Enregistrer**
5. ✅ L'utilisateur sera immédiatement déconnecté et ne pourra plus se reconnecter

### Réactiver un compte
1. Aller sur `/users`
2. Trouver l'utilisateur avec badge **Inactif** (rouge)
3. Cliquer sur **Modifier**
4. Dans le champ **Statut**, sélectionner **Actif**
5. Cliquer sur **Enregistrer**
6. ✅ L'utilisateur peut à nouveau se connecter

### Filtrer les comptes inactifs
- Utiliser le filtre **Statut** → **Inactif** dans la page `/users`
- Badge rouge = compte désactivé
- Badge vert = compte actif

---

## 🚨 Messages d'Erreur

### À la connexion
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Compte désactivé                                     │
│                                                          │
│ Votre compte a été désactivé. Veuillez contacter        │
│ un administrateur.                                       │
└─────────────────────────────────────────────────────────┘
```

### Pendant une session active (middleware)
```
# Redirection automatique vers /login avec :
?error=account_disabled

# Toast notification affichée :
"Compte désactivé - Votre compte a été désactivé. 
Contactez un administrateur."
```

---

## 🔄 Cas d'Usage Réels

### Scénario 1 : Employé quitte l'entreprise
1. Admin désactive le compte depuis `/users`
2. Si l'employé est connecté, il est déconnecté au prochain clic
3. Il ne peut plus accéder à l'intranet
4. Les données restent en base mais inaccessibles

### Scénario 2 : Suspension temporaire
1. Admin désactive le compte temporairement
2. Client ne peut plus voir ses chantiers
3. Admin réactive le compte plus tard
4. Client retrouve tous ses accès

### Scénario 3 : Compte compromis
1. Admin détecte une activité suspecte
2. Désactivation immédiate du compte
3. Investigation + changement de mot de passe
4. Réactivation après vérification

---

## ✅ Checklist de Sécurité

- [x] Blocage à la connexion (API signin)
- [x] Blocage en temps réel (Middleware)
- [x] Message d'erreur clair pour l'utilisateur
- [x] Déconnexion automatique si désactivé pendant session
- [x] Interface admin pour gérer les statuts
- [x] Badge visuel (actif/inactif)
- [x] Filtres pour trouver les comptes inactifs
- [x] Nettoyage du localStorage après erreur
- [x] Tests de validation réussis
- [x] Documentation complète

---

## 📝 Notes Techniques

### Statuts Disponibles
- `active` : Compte fonctionnel (par défaut)
- `inactive` : Compte désactivé

### Codes d'Erreur HTTP
- `403 Forbidden` : Compte désactivé lors de la connexion
- `401 Unauthorized` : Credentials invalides

### Codes Personnalisés
- `ACCOUNT_DISABLED` : Identifie spécifiquement une désactivation de compte

---

## 🎉 Résultat Final

Le système de comptes inactifs est maintenant **100% opérationnel** avec :
- ✅ Sécurité renforcée (double vérification)
- ✅ UX optimale (messages clairs + design cohérent)
- ✅ Gestion administrative simple
- ✅ Tests validés avec succès

**Les administrateurs peuvent désormais désactiver n'importe quel compte utilisateur en 2 clics, avec effet immédiat !** 🔒✨
