import { db } from '../index';
import { users } from '../schema';
import bcrypt from 'bcryptjs';

async function main() {
    const sampleUsers = [
        {
            email: 'admin@jhs.fr',
            passwordHash: await bcrypt.hash('admin123', 10),
            name: 'Admin JHS',
            role: 'admin',
            status: 'active',
            phone: '0601020304',
            address: '15 Rue de la Construction, 75001 Paris',
            photoUrl: null,
            createdAt: '2024-01-15T00:00:00.000Z',
            lastLogin: '2024-12-17T10:30:00.000Z',
        },
        {
            email: 'jean.martin@jhs.fr',
            passwordHash: await bcrypt.hash('jean123', 10),
            name: 'Jean Martin',
            role: 'travailleur',
            status: 'active',
            phone: '0612345678',
            address: '23 Avenue des Artisans, 69002 Lyon',
            photoUrl: null,
            createdAt: '2024-01-20T00:00:00.000Z',
            lastLogin: '2024-12-16T14:20:00.000Z',
        },
        {
            email: 'marie.dubois@jhs.fr',
            passwordHash: await bcrypt.hash('marie123', 10),
            name: 'Marie Dubois',
            role: 'travailleur',
            status: 'active',
            phone: '0623456789',
            address: '8 Rue du Travail, 33000 Bordeaux',
            photoUrl: null,
            createdAt: '2024-01-25T00:00:00.000Z',
            lastLogin: '2024-12-15T09:45:00.000Z',
        },
        {
            email: 'pierre.bernard@gmail.com',
            passwordHash: await bcrypt.hash('client123', 10),
            name: 'Pierre Bernard',
            role: 'client',
            status: 'active',
            phone: '0634567890',
            address: '45 Boulevard Haussmann, 31000 Toulouse',
            photoUrl: null,
            createdAt: '2024-02-01T00:00:00.000Z',
            lastLogin: '2024-12-14T16:10:00.000Z',
        },
        {
            email: 'sophie.laurent@hotmail.fr',
            passwordHash: await bcrypt.hash('client456', 10),
            name: 'Sophie Laurent',
            role: 'client',
            status: 'active',
            phone: '0645678901',
            address: '12 Place de la Mairie, 13001 Marseille',
            photoUrl: null,
            createdAt: '2024-02-05T00:00:00.000Z',
            lastLogin: '2024-12-13T11:30:00.000Z',
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});