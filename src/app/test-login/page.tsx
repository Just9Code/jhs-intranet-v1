'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async (email: string, password: string) => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Test de connexion direct avec:', { email, password });
      
      const response = await fetch('/api/auth/custom-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe: false }),
      });

      console.log('🧪 Status:', response.status);
      
      const data = await response.json();
      console.log('🧪 Data:', data);

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        localStorage_before: localStorage.getItem('jhs_session'),
      });

      // Test storage
      if (data.data?.token) {
        localStorage.setItem('jhs_session', JSON.stringify(data.data));
        console.log('🧪 Session stockée dans localStorage');
        
        const stored = localStorage.getItem('jhs_session');
        console.log('🧪 Lecture depuis localStorage:', stored);
      }

    } catch (error: any) {
      console.error('🧪 Erreur:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Page de Test de Connexion</h1>
        
        <div className="space-y-4 mb-8">
          <Button
            onClick={() => testLogin('admin@jhs.fr', 'admin123')}
            disabled={loading}
            className="w-full"
          >
            Tester Admin
          </Button>
          
          <Button
            onClick={() => testLogin('jean.martin@jhs.fr', 'jean123')}
            disabled={loading}
            className="w-full"
          >
            Tester Travailleur
          </Button>
          
          <Button
            onClick={() => testLogin('pierre.bernard@gmail.com', 'client123')}
            disabled={loading}
            className="w-full"
          >
            Tester Client
          </Button>
        </div>

        {result && (
          <div className="bg-zinc-900 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Résultat:</h2>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-zinc-900 rounded-lg">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Cliquez sur un des boutons ci-dessus</li>
            <li>Ouvrez la console du navigateur (F12)</li>
            <li>Regardez les logs qui commencent par 🧪</li>
            <li>Vérifiez le résultat affiché ci-dessous</li>
          </ol>
        </div>

        <div className="mt-8">
          <Button
            onClick={() => {
              localStorage.clear();
              setResult(null);
              console.log('🧹 localStorage vidé');
            }}
            variant="destructive"
          >
            Vider le localStorage
          </Button>
        </div>
      </div>
    </div>
  );
}
