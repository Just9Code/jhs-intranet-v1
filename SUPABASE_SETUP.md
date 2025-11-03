# 🔧 Configuration Supabase pour JHS ENTREPRISE

## 📋 Étapes pour configurer votre compte Supabase

### 1. Créer un compte Supabase (si vous n'en avez pas)

1. Allez sur **https://supabase.com**
2. Cliquez sur **"Start your project"** ou **"Sign Up"**
3. Créez un compte avec votre email

### 2. Créer un nouveau projet

1. Une fois connecté, cliquez sur **"New Project"**
2. Remplissez les informations :
   - **Name** : `jhs-entreprise` (ou le nom de votre choix)
   - **Database Password** : Choisissez un mot de passe fort (notez-le !)
   - **Region** : Choisissez la région la plus proche de vous
   - **Pricing Plan** : Free (gratuit pour commencer)
3. Cliquez sur **"Create new project"**
4. Attendez 1-2 minutes que le projet soit créé

### 3. Créer un bucket de stockage

1. Dans le menu de gauche, cliquez sur **"Storage"**
2. Cliquez sur **"Create a new bucket"**
3. Nom du bucket : `document-uploads`
4. Cochez **"Public bucket"** (pour que les fichiers soient accessibles publiquement)
5. Cliquez sur **"Create bucket"**

### 4. Récupérer vos clés API

1. Dans le menu de gauche, cliquez sur **"Settings"** (⚙️ en bas)
2. Cliquez sur **"API"**
3. Vous verrez :
   - **Project URL** : Quelque chose comme `https://xxxxxxxxxxxxx.supabase.co`
   - **API Key (anon/public)** : Une longue clé qui commence par `eyJ...`

**📝 Copiez ces deux valeurs, vous en aurez besoin !**

### 5. Configuration des politiques de sécurité (optionnel mais recommandé)

Pour permettre l'upload de fichiers :

1. Dans **Storage** → **Policies**
2. Pour le bucket `document-uploads`, ajoutez ces politiques :

**Policy pour INSERT (upload)** :
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'document-uploads');
```

**Policy pour SELECT (lecture)** :
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'document-uploads');
```

**Policy pour DELETE (suppression)** :
```sql
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'document-uploads');
```

## 🔑 Variables d'environnement nécessaires

Après avoir récupéré vos clés, vous devrez fournir :

- **NEXT_PUBLIC_SUPABASE_URL** : Votre Project URL (ex: `https://xxxxxxxxxxxxx.supabase.co`)
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** : Votre clé API publique (la longue clé qui commence par `eyJ...`)

## ✅ Une fois configuré

Votre application pourra :
- ✅ Uploader des fichiers (PDF, images, vidéos)
- ✅ Stocker les documents par chantier
- ✅ Gérer les albums photos
- ✅ Supprimer des fichiers
- ✅ Accéder aux fichiers publiquement

## 📊 Limites du plan gratuit

- **Storage** : 1 GB
- **Bandwidth** : 2 GB / mois
- **API Requests** : 500,000 / mois

C'est largement suffisant pour commencer ! 🚀

## 🆘 Besoin d'aide ?

Si vous avez des questions lors de la configuration, n'hésitez pas à demander !
