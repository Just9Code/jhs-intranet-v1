import { db } from '@/db';
import { stockMateriels } from '@/db/schema';

async function main() {
    const sampleMateriels = [
        {
            name: 'Pelleteuse hydraulique 5T',
            quantity: 2,
            status: 'disponible',
            createdAt: '2024-01-05T00:00:00.000Z',
            updatedAt: '2024-01-05T00:00:00.000Z',
        },
        {
            name: 'Bétonneuse électrique 250L',
            quantity: 3,
            status: 'disponible',
            createdAt: '2024-01-08T00:00:00.000Z',
            updatedAt: '2024-01-08T00:00:00.000Z',
        },
        {
            name: 'Échafaudage aluminium',
            quantity: 5,
            status: 'emprunte',
            createdAt: '2024-01-12T00:00:00.000Z',
            updatedAt: '2024-01-28T00:00:00.000Z',
        },
        {
            name: 'Perceuse sans fil 18V',
            quantity: 8,
            status: 'disponible',
            createdAt: '2024-01-15T00:00:00.000Z',
            updatedAt: '2024-01-15T00:00:00.000Z',
        },
        {
            name: 'Meuleuse d\'angle 125mm',
            quantity: 6,
            status: 'disponible',
            createdAt: '2024-01-18T00:00:00.000Z',
            updatedAt: '2024-01-18T00:00:00.000Z',
        },
        {
            name: 'Scie circulaire portative',
            quantity: 4,
            status: 'emprunte',
            createdAt: '2024-01-22T00:00:00.000Z',
            updatedAt: '2024-02-05T00:00:00.000Z',
        },
        {
            name: 'Compresseur 50L',
            quantity: 2,
            status: 'maintenance',
            createdAt: '2024-01-25T00:00:00.000Z',
            updatedAt: '2024-02-08T00:00:00.000Z',
        },
        {
            name: 'Niveau laser rotatif',
            quantity: 3,
            status: 'disponible',
            createdAt: '2024-01-28T00:00:00.000Z',
            updatedAt: '2024-01-28T00:00:00.000Z',
        },
        {
            name: 'Bétonnière thermique 180L',
            quantity: 2,
            status: 'disponible',
            createdAt: '2024-02-01T00:00:00.000Z',
            updatedAt: '2024-02-01T00:00:00.000Z',
        },
        {
            name: 'Échelle télescopique 6m',
            quantity: 10,
            status: 'disponible',
            createdAt: '2024-02-05T00:00:00.000Z',
            updatedAt: '2024-02-05T00:00:00.000Z',
        },
        {
            name: 'Marteau piqueur électrique',
            quantity: 4,
            status: 'disponible',
            createdAt: '2024-02-10T00:00:00.000Z',
            updatedAt: '2024-02-10T00:00:00.000Z',
        },
        {
            name: 'Ponceuse orbitale',
            quantity: 7,
            status: 'disponible',
            createdAt: '2024-02-14T00:00:00.000Z',
            updatedAt: '2024-02-14T00:00:00.000Z',
        },
        {
            name: 'Visseuse à chocs 24V',
            quantity: 9,
            status: 'emprunte',
            createdAt: '2024-02-18T00:00:00.000Z',
            updatedAt: '2024-03-01T00:00:00.000Z',
        },
        {
            name: 'Scie sabre électrique',
            quantity: 5,
            status: 'disponible',
            createdAt: '2024-02-22T00:00:00.000Z',
            updatedAt: '2024-02-22T00:00:00.000Z',
        },
        {
            name: 'Truelle mécanique',
            quantity: 2,
            status: 'disponible',
            createdAt: '2024-02-26T00:00:00.000Z',
            updatedAt: '2024-02-26T00:00:00.000Z',
        },
        {
            name: 'Chalumeau de toiture',
            quantity: 3,
            status: 'maintenance',
            createdAt: '2024-03-02T00:00:00.000Z',
            updatedAt: '2024-03-10T00:00:00.000Z',
        },
        {
            name: 'Groupe électrogène 5kW',
            quantity: 2,
            status: 'disponible',
            createdAt: '2024-03-06T00:00:00.000Z',
            updatedAt: '2024-03-06T00:00:00.000Z',
        },
        {
            name: 'Carrelette électrique',
            quantity: 3,
            status: 'disponible',
            createdAt: '2024-03-10T00:00:00.000Z',
            updatedAt: '2024-03-10T00:00:00.000Z',
        },
        {
            name: 'Décapeuse thermique',
            quantity: 6,
            status: 'disponible',
            createdAt: '2024-03-14T00:00:00.000Z',
            updatedAt: '2024-03-14T00:00:00.000Z',
        },
        {
            name: 'Mini-pelle 1.5T',
            quantity: 1,
            status: 'emprunte',
            createdAt: '2024-03-18T00:00:00.000Z',
            updatedAt: '2024-03-20T00:00:00.000Z',
        },
    ];

    await db.insert(stockMateriels).values(sampleMateriels);
    
    console.log('✅ Stock Materiels seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});