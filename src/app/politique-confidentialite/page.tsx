'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Cookie, Database, Lock, Mail } from 'lucide-react';

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header avec navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-zinc-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Contenu */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Politique de confidentialité
            </h1>
          </div>
          <p className="text-zinc-400 text-lg">
            Dernière mise à jour : 2 novembre 2025
          </p>
        </div>

        {/* Contenu principal */}
        <div className="space-y-8 text-zinc-300">
          {/* Introduction */}
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <p className="leading-relaxed">
              JHS ENTREPRISE s'engage à protéger la vie privée de ses utilisateurs. 
              Cette politique de confidentialité explique comment nous collectons, utilisons, 
              stockons et protégeons vos données personnelles lorsque vous utilisez notre intranet.
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Database className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  1. Données collectées
                </h2>
                <div className="space-y-4 text-zinc-300">
                  <p>Nous collectons les types de données suivants :</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong className="text-white">Données d'identification :</strong> nom, prénom, adresse e-mail, numéro de téléphone
                    </li>
                    <li>
                      <strong className="text-white">Données de connexion :</strong> identifiants, mots de passe chiffrés, adresse IP, date et heure de connexion
                    </li>
                    <li>
                      <strong className="text-white">Données professionnelles :</strong> rôle, permissions d'accès, chantiers associés
                    </li>
                    <li>
                      <strong className="text-white">Données de navigation :</strong> pages consultées, actions effectuées sur la plateforme
                    </li>
                    <li>
                      <strong className="text-white">Documents professionnels :</strong> factures, devis, photos et vidéos de chantiers
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  2. Utilisation des données
                </h2>
                <div className="space-y-4 text-zinc-300">
                  <p>Vos données sont utilisées pour :</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Gérer votre compte utilisateur et votre authentification</li>
                    <li>Assurer le fonctionnement de l'intranet (gestion des chantiers, stock, documents)</li>
                    <li>Contrôler les accès selon votre rôle (Admin, Travailleur, Client)</li>
                    <li>Améliorer la sécurité et prévenir les accès non autorisés</li>
                    <li>Analyser l'utilisation de la plateforme pour l'améliorer</li>
                    <li>Communiquer avec vous concernant votre utilisation du service</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  3. Cookies et technologies similaires
                </h2>
                <div className="space-y-4 text-zinc-300">
                  <p>Nous utilisons différents types de cookies :</p>
                  
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">🔒 Cookies nécessaires (obligatoires)</h3>
                    <p className="text-sm">
                      Essentiels au fonctionnement : authentification, sécurité, sessions utilisateur
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">⚙️ Cookies fonctionnels (optionnels)</h3>
                    <p className="text-sm">
                      Mémorisation de vos préférences (langue, affichage, paramètres personnalisés)
                    </p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <h3 className="font-semibold text-white mb-2">📊 Cookies analytiques (optionnels)</h3>
                    <p className="text-sm">
                      Statistiques d'utilisation anonymes pour améliorer la plateforme
                    </p>
                  </div>

                  <p className="text-sm italic">
                    Vous pouvez gérer vos préférences de cookies à tout moment via le bandeau de consentement.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              4. Partage et transfert des données
            </h2>
            <div className="space-y-4 text-zinc-300">
              <p>
                Vos données personnelles ne sont <strong className="text-white">jamais vendues</strong> à des tiers.
              </p>
              <p>
                Nous pouvons partager vos données uniquement dans les cas suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Avec les membres de votre entreprise selon les permissions d'accès</li>
                <li>Avec nos prestataires techniques (hébergement, base de données) sous contrat de confidentialité</li>
                <li>Si requis par la loi ou par une autorité judiciaire</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Conservation des données
            </h2>
            <div className="space-y-4 text-zinc-300">
              <p>
                Nous conservons vos données aussi longtemps que nécessaire pour :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Le fonctionnement de votre compte et de vos accès</li>
                <li>Respecter nos obligations légales (factures, documents comptables)</li>
                <li>Résoudre d'éventuels litiges</li>
              </ul>
              <p className="text-sm">
                En cas de suppression de compte, vos données personnelles sont effacées sous 30 jours, 
                sauf si une obligation légale impose leur conservation.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Sécurité
            </h2>
            <div className="space-y-4 text-zinc-300">
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chiffrement des mots de passe avec algorithmes sécurisés</li>
                <li>Connexions HTTPS sécurisées</li>
                <li>Contrôle d'accès strict par rôle</li>
                <li>Sauvegardes régulières</li>
                <li>Surveillance des accès suspects</li>
              </ul>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              7. Vos droits (RGPD)
            </h2>
            <div className="space-y-4 text-zinc-300">
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Droit d'accès :</strong> obtenir une copie de vos données</li>
                <li><strong className="text-white">Droit de rectification :</strong> corriger vos données inexactes</li>
                <li><strong className="text-white">Droit à l'effacement :</strong> demander la suppression de vos données</li>
                <li><strong className="text-white">Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong className="text-white">Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong className="text-white">Droit à la limitation :</strong> demander la limitation du traitement</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  8. Contact
                </h2>
                <div className="space-y-4 text-zinc-300">
                  <p>
                    Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits, 
                    vous pouvez nous contacter :
                  </p>
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <p className="font-semibold text-white mb-2">JHS ENTREPRISE</p>
                    <p className="text-sm space-y-1">
                      <span className="block">📧 Email : contact@jhsentreprise.fr</span>
                      <span className="block">📞 Téléphone : 04 91 63 13 13</span>
                      <span className="block">📍 Adresse : 3 Avenue Claude Monet, 13014 Marseille</span>
                    </p>
                  </div>
                  <p className="text-sm italic">
                    Nous nous engageons à répondre à vos demandes dans un délai maximum de 30 jours.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              9. Modifications
            </h2>
            <div className="space-y-4 text-zinc-300">
              <p>
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                Les modifications seront publiées sur cette page avec une nouvelle date de mise à jour. 
                Nous vous encourageons à consulter régulièrement cette page.
              </p>
            </div>
          </section>
        </div>

        {/* Footer avec bouton retour */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Link href="/">
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}