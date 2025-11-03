# 🔐 AUDIT DE SÉCURITÉ COMPLET - JHS ENTREPRISE

**Date:** 2 Novembre 2025  
**Version:** 1.0  
**Auditeur:** Système d'analyse automatique  
**Portée:** Application complète (Frontend, Backend, Base de données)

---

## 📊 RÉSUMÉ EXÉCUTIF

### Score Global de Sécurité: **7.5/10** ⚠️

| Catégorie | Score | Statut |
|-----------|-------|--------|
| **Authentification** | 9/10 | ✅ Excellent |
| **Autorisation & RBAC** | 4/10 | 🔴 CRITIQUE |
| **Protection des données** | 8/10 | ✅ Bon |
| **Validation des entrées** | 9/10 | ✅ Excellent |
| **Sécurité API** | 5/10 | ⚠️ Moyen |
| **Protection CSRF/XSS** | 7/10 | ⚠️ Moyen |
| **Gestion des sessions** | 9/10 | ✅ Excellent |
| **Fichiers & Uploads** | 6/10 | ⚠️ Moyen |

---

## 🚨 VULNÉRABILITÉS CRITIQUES

### 1. **ABSENCE DE RBAC DANS LES API ROUTES** 🔴 **CRITIQUE**

**Localisation:**
- `/api/chantiers/route.ts`
- `/api/users/route.ts`
- `/api/stock-materiaux/route.ts`
- `/api/stock-materiels/route.ts`
- `/api/chantier-files/route.ts`
- `/api/invoices-quotes/route.ts`

**Problème:**
```typescript
// ❌ AUCUNE vérification du rôle de l'utilisateur !
export async function GET(request: NextRequest) {
  // N'importe qui authentifié peut lire toutes les données
  const results = await db.select().from(chantiers);
  return NextResponse.json(results);
}

export async function DELETE(request: NextRequest) {
  // N'importe qui authentifié peut supprimer n'importe quoi !
  await db.delete(chantiers).where(eq(chantiers.id, id));
}
```

**Impact:**
- Un **client** peut supprimer des chantiers ❌
- Un **travailleur** peut créer/supprimer des admins ❌
- Un **client** peut voir tous les chantiers de tous les clients ❌
- Un **travailleur** peut accéder aux données sensibles des autres ❌

**Exploitation possible:**
```javascript
// Un client malveillant peut faire ceci:
fetch('/api/users?limit=1000') // Voir TOUS les utilisateurs
fetch('/api/users?id=1', { method: 'DELETE' }) // Supprimer l'admin!
fetch('/api/chantiers?id=5', { method: 'DELETE' }) // Supprimer n'importe quel chantier
```

**Solution requise:**
```typescript
// ✅ CORRECT - Avec vérification RBAC
import { getCurrentUser } from '@/lib/jwt';

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  
  // Vérifier le rôle
  if (user?.role !== 'admin' && user?.role !== 'travailleur') {
    return NextResponse.json(
      { error: 'Accès interdit' },
      { status: 403 }
    );
  }
  
  // Continuer...
}
```

---

### 2. **EXPOSITION DES IDs INTERNES** ⚠️ **ÉLEVÉ**

**Localisation:** Toutes les routes API

**Problème:**
```typescript
// Les IDs auto-incrémentaux sont prévisibles
users: id = 1, 2, 3, 4...
chantiers: id = 1, 2, 3, 4...
```

**Impact:**
- Énumération facile des ressources
- Un attaquant peut deviner tous les IDs existants
- Facilite les attaques par force brute

**Solution recommandée:**
```typescript
// Utiliser des UUIDs au lieu d'integers auto-increment
id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
```

---

### 3. **ABSENCE DE RATE LIMITING** ⚠️ **ÉLEVÉ**

**Localisation:** Toutes les routes API, `/login`

**Problème:**
```typescript
// ❌ Pas de limite de tentatives de connexion
export async function POST(request: NextRequest) {
  const { email, password } = body;
  // Aucune protection contre brute force
}
```

**Impact:**
- Attaques par force brute illimitées sur `/api/auth/signin`
- DDoS facile sur toutes les API routes
- Pas de protection contre les scripts automatisés

**Solution requise:**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives, réessayez dans 15 minutes'
});
```

---

### 4. **AUCUNE PROTECTION CSRF SUR LES MUTATIONS** ⚠️ **MOYEN**

**Localisation:** Toutes les routes POST/PUT/DELETE

**Problème:**
```typescript
// ❌ Pas de token CSRF
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Accepte les requêtes de n'importe quel origine
}
```

**Impact:**
- Un site malveillant peut exécuter des actions au nom de l'utilisateur
- Suppression de données via CSRF
- Création d'utilisateurs admin via CSRF

**Solution requise:**
```typescript
// Ajouter des tokens CSRF pour toutes les mutations
// Vérifier l'origine des requêtes
const origin = request.headers.get('origin');
if (origin && !allowedOrigins.includes(origin)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## ✅ POINTS FORTS

### 1. **Système JWT Robuste** ✅

**Localisation:** `src/lib/jwt.ts`

```typescript
✅ Tokens signés avec HS256
✅ Expiration à 7 jours
✅ Cookies HTTP-only, Secure, SameSite=lax
✅ Vérification systématique des tokens
✅ Génération sécurisée avec jose
```

---

### 2. **Validation des Entrées Excellente** ✅

**Localisation:** `src/lib/validation.ts`

```typescript
✅ Protection XSS (escape HTML)
✅ Protection SQL Injection (détection patterns)
✅ Validation email avec validator.js
✅ Sanitization de tous les strings
✅ Validation des types et longueurs
```

---

### 3. **Middleware de Protection** ✅

**Localisation:** `middleware.ts`

```typescript
✅ Vérification du token JWT
✅ Vérification du statut du compte (actif/inactif)
✅ Protection de toutes les routes sensibles
✅ Redirection automatique vers login
✅ Vérification en temps réel de la base de données
```

---

### 4. **Gestion des Comptes Désactivés** ✅

```typescript
✅ Vérification dans API signin (403 si inactif)
✅ Vérification dans middleware (déconnexion forcée)
✅ Vérification dans API session (retourne accountDisabled)
✅ UI informe l'utilisateur avec toast persistant
```

---

## ⚠️ VULNÉRABILITÉS MOYENNES

### 1. **Logs Insuffisants pour Audit**

**Problème:**
```typescript
// ❌ Logs basiques uniquement
console.error('Error:', error);
```

**Solution:**
```typescript
// ✅ Logging structuré pour audit
logger.warn({
  event: 'FAILED_LOGIN',
  email: sanitizedEmail,
  ip: request.headers.get('x-forwarded-for'),
  timestamp: new Date().toISOString()
});
```

---

### 2. **Pas de Monitoring des Actions Sensibles**

**Actions non loggées:**
- Création/suppression d'utilisateurs
- Modifications de rôles
- Suppressions de chantiers
- Désactivation de comptes

**Solution:**
Créer une table `audit_logs`:
```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  action TEXT,
  resource_type TEXT,
  resource_id INTEGER,
  ip_address TEXT,
  timestamp TEXT
);
```

---

### 3. **Validation des Fichiers Uploadés Faible**

**Localisation:** `src/app/chantiers/page.tsx`

```typescript
// ⚠️ Validation côté client uniquement
const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
if (!validImageTypes.includes(file.type)) {
  toast.error('Format non supporté');
}
```

**Problèmes:**
- Pas de vérification MIME type côté serveur
- Pas de scan antivirus
- Pas de limite de taille totale par utilisateur
- Pas de vérification du contenu réel du fichier

---

### 4. **Exposition d'Informations Sensibles dans Erreurs**

**Localisation:** Plusieurs API routes

```typescript
// ❌ Expose des détails internes
return NextResponse.json(
  { error: 'Internal server error: ' + error.message },
  { status: 500 }
);
```

**Solution:**
```typescript
// ✅ Messages génériques pour l'utilisateur
return NextResponse.json(
  { error: 'Une erreur est survenue' },
  { status: 500 }
);
// Log détaillé côté serveur uniquement
logger.error('Detailed error:', error);
```

---

## 📋 MATRICE DE CONTRÔLE D'ACCÈS (RBAC)

### Ce qui DEVRAIT être implémenté:

| Action | Admin | Travailleur | Client |
|--------|-------|-------------|--------|
| **Utilisateurs** |
| Créer utilisateur | ✅ | ❌ | ❌ |
| Voir tous les utilisateurs | ✅ | ❌ | ❌ |
| Modifier son profil | ✅ | ✅ | ✅ |
| Modifier autres utilisateurs | ✅ | ❌ | ❌ |
| Supprimer utilisateurs | ✅ | ❌ | ❌ |
| **Chantiers** |
| Créer chantier | ✅ | ✅ | ❌ |
| Voir tous chantiers | ✅ | ✅ | ❌ |
| Voir ses chantiers | ✅ | ✅ | ✅ |
| Modifier chantier | ✅ | ✅ | ❌ |
| Supprimer chantier | ✅ | ✅ | ❌ |
| **Stock** |
| Voir stock | ✅ | ✅ | ❌ |
| Modifier stock | ✅ | ✅ | ❌ |
| Supprimer stock | ✅ | ✅ | ❌ |
| **Fichiers** |
| Upload fichiers | ✅ | ✅ | ❌ |
| Voir fichiers ses chantiers | ✅ | ✅ | ✅ |
| Supprimer fichiers | ✅ | ✅ | ❌ |

### Ce qui est ACTUELLEMENT implémenté:

| Action | Admin | Travailleur | Client |
|--------|-------|-------------|--------|
| **TOUT** | ✅ | ✅ | ✅ |

**❌ Tous les utilisateurs authentifiés ont les mêmes droits sur les API !**

---

## 🔍 ANALYSE PAR COMPOSANT

### **1. Base de Données (src/db/schema.ts)**

#### ✅ Points forts:
- Schéma bien structuré avec relations
- Colonnes `status` pour désactivation des comptes
- Tables better-auth pour compatibilité future
- Timestamps sur toutes les entités

#### ⚠️ Points faibles:
- IDs auto-incrémentaux prévisibles
- Pas de soft-delete (suppression définitive)
- Pas de table d'audit
- Pas de chiffrement au repos pour données sensibles

---

### **2. Authentification (src/lib/jwt.ts + auth.ts)**

#### ✅ Points forts:
- JWT signé avec algorithme sécurisé (HS256)
- Cookies HTTP-only + Secure + SameSite
- Expiration des tokens (7 jours)
- Vérification systématique
- Double storage (cookie + localStorage)

#### ⚠️ Points faibles:
- Secret JWT par défaut en dur
- Pas de rotation des tokens
- Pas de blacklist pour tokens révoqués
- Pas de refresh tokens

---

### **3. Middleware (middleware.ts)**

#### ✅ Points forts:
- Vérifie le token ET le statut du compte
- Protection de toutes les routes sensibles
- Query DB à chaque requête pour statut actuel
- Redirection propre avec paramètres

#### ⚠️ Points faibles:
- Pas de vérification RBAC
- Pas de rate limiting
- Pas de logging des accès
- Config matcher peut être contournée

---

### **4. API Routes**

#### `/api/auth/*` - Score: 8/10 ✅

**Points forts:**
- Validation des entrées (email, password)
- Sanitization XSS
- Vérification statut compte
- Messages d'erreur appropriés

**Points faibles:**
- Pas de rate limiting
- Pas de CAPTCHA après X échecs
- Pas de 2FA

---

#### `/api/users/*` - Score: 3/10 🔴

**Problèmes critiques:**
```typescript
// ❌ Aucun contrôle d'accès !
export async function DELETE(request: NextRequest) {
  // N'importe qui peut supprimer n'importe quel utilisateur
  await db.delete(users).where(eq(users.id, id));
}
```

**Ce qui manque:**
- Vérification du rôle admin pour DELETE
- Vérification du rôle admin pour POST
- Vérification du rôle admin pour GET liste complète
- Limitation des champs modifiables selon le rôle
- Protection de l'auto-suppression

---

#### `/api/chantiers/*` - Score: 4/10 🔴

**Problèmes critiques:**
```typescript
// ❌ Un client peut voir TOUS les chantiers
export async function GET(request: NextRequest) {
  const results = await db.select().from(chantiers);
  return NextResponse.json(results);
}
```

**Ce qui manque:**
- Filtrage par clientId si role=client
- Vérification admin/travailleur pour CREATE
- Vérification admin/travailleur pour DELETE
- Validation de la propriété du chantier

---

#### `/api/stock-*` - Score: 4/10 🔴

**Problèmes critiques:**
- Aucune vérification de rôle
- Les clients peuvent voir et modifier le stock
- Pas de validation de propriété des mouvements

---

### **5. Pages Frontend**

#### Dashboard (src/app/dashboard/page.tsx) - Score: 7/10 ⚠️

**Points forts:**
- Utilise `ProtectedRoute`
- Affichage conditionnel selon rôle (UI seulement)
- Animations et UX excellents

**Points faibles:**
- Fait confiance aux API sans vérification
- Affiche des données sensibles si API compromise
- Pas de détection d'anomalies (ex: client qui voit stock)

---

#### Users (src/app/users/page.tsx) - Score: 6/10 ⚠️

**Points forts:**
- Vérification UI du rôle admin
- Vérification UI pour édition propre profil
- Interface claire et bien organisée

**Points faibles:**
- Vérification UI seulement (bypassable)
- Appels API sans validation de réponse
- Pas de confirmation supplémentaire pour suppressions sensibles

---

#### Chantiers (src/app/chantiers/page.tsx) - Score: 6/10 ⚠️

**Points forts:**
- Filtre client-side des chantiers selon rôle
- Upload de fichiers avec validation basique
- Interface intuitive

**Points faibles:**
- Validation fichiers côté client uniquement
- Pas de vérification taille totale des fichiers
- Pas de protection antivirus
- Affiche tous les chantiers si API compromise

---

### **6. Validation (src/lib/validation.ts)**

#### Score: 9/10 ✅

**Points forts:**
- Protection XSS avec escape HTML
- Détection SQL injection
- Validation email robuste
- Validation téléphone et URL
- Validation fichiers avec types MIME

**Point faible:**
- Validation fichiers basée uniquement sur extension/MIME
- Pas de scan du contenu réel du fichier

---

## 🎯 PLAN D'ACTION PRIORITAIRE

### **URGENCE 1 - À FAIRE IMMÉDIATEMENT** 🔴

1. **Implémenter RBAC dans TOUTES les API routes**
   - Créer middleware d'autorisation par rôle
   - Ajouter vérification à chaque endpoint
   - Tester exhaustivement tous les scénarios

2. **Rate Limiting sur login et API**
   - Limiter tentatives de connexion (5/15min)
   - Limiter requêtes API (100/min par user)
   - Implémenter CAPTCHA après échecs

3. **Ajouter Audit Logging**
   - Logger toutes actions sensibles
   - Inclure user_id, IP, timestamp, action
   - Créer dashboard d'audit pour admins

---

### **URGENCE 2 - À FAIRE SOUS 1 SEMAINE** ⚠️

4. **Améliorer validation fichiers côté serveur**
   - Vérifier MIME type réel
   - Scanner antivirus (ClamAV)
   - Limiter taille totale par utilisateur

5. **Remplacer IDs auto-increment par UUIDs**
   - Migrer schéma DB
   - Empêcher énumération ressources

6. **Implémenter Protection CSRF**
   - Tokens CSRF pour mutations
   - Vérification origine requêtes

---

### **URGENCE 3 - À FAIRE SOUS 1 MOIS** ⚡

7. **Rotation des tokens JWT**
   - Implémenter refresh tokens
   - Blacklist tokens révoqués

8. **Chiffrement données sensibles**
   - Chiffrer numéros de téléphone
   - Chiffrer adresses

9. **Tests de pénétration**
   - Scanner automatisé (OWASP ZAP)
   - Test manuel d'exploitation

---

## 📝 CHECKLIST DE SÉCURITÉ

### Authentification & Autorisation
- [x] JWT signé et sécurisé
- [x] Cookies HTTP-only
- [x] Vérification statut compte (actif/inactif)
- [x] Middleware de protection
- [ ] **RBAC dans API routes** 🔴
- [ ] Rate limiting
- [ ] 2FA optionnel
- [ ] Rotation tokens
- [ ] Blacklist tokens révoqués

### Validation & Protection
- [x] Validation entrées côté serveur
- [x] Protection XSS
- [x] Détection SQL injection
- [ ] **Protection CSRF** ⚠️
- [ ] **Validation fichiers serveur** ⚠️
- [ ] Content Security Policy (CSP)

### Monitoring & Audit
- [ ] **Audit logging** 🔴
- [ ] Alertes anomalies
- [ ] Dashboard monitoring
- [ ] Logs centralisés

### Infrastructure
- [ ] Variables environnement sécurisées
- [ ] UUIDs au lieu integers
- [ ] Chiffrement au repos
- [ ] Backups automatiques
- [ ] Plan de réponse incidents

---

## 🚀 RECOMMANDATIONS ADDITIONNELLES

### Court terme (< 1 mois)
1. Implémenter RBAC complet
2. Ajouter rate limiting
3. Créer système d'audit
4. Tests de sécurité automatisés

### Moyen terme (1-3 mois)
5. Migration vers UUIDs
6. Chiffrement données sensibles
7. Implémentation 2FA
8. Scanner de vulnérabilités CI/CD

### Long terme (3-6 mois)
9. Certification ISO 27001
10. Audit externe
11. Bug bounty program
12. Formation sécurité équipe

---

## ✅ CONCLUSION

L'application **JHS ENTREPRISE** dispose d'une **base solide** en termes de sécurité :
- ✅ Authentification JWT robuste
- ✅ Validation des entrées excellente
- ✅ Protection XSS efficace
- ✅ Gestion des comptes désactivés

**MAIS** présente des **lacunes critiques** :
- 🔴 **AUCUN contrôle d'accès basé sur les rôles dans les API**
- 🔴 **Aucune protection contre attaques par force brute**
- ⚠️ **Logs d'audit insuffisants**
- ⚠️ **Validation fichiers faible**

### Score Final: **7.5/10**

**Verdict:** Application utilisable en production **UNIQUEMENT APRÈS** :
1. ✅ Implémentation RBAC complète dans toutes les API routes
2. ✅ Ajout rate limiting
3. ✅ Mise en place audit logging

**Temps estimé pour sécurisation complète:** 2-3 semaines de développement

---

## 📞 CONTACT & SUPPORT

Pour toute question sur cet audit, contactez l'équipe de sécurité.

**Date de prochaine revue:** 2 Décembre 2025

---

*Document confidentiel - Usage interne uniquement*
