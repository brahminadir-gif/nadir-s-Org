import Dexie, { type Table } from 'dexie';
import type { User, Equipment, OT, AT, Consignation } from '../types';

export class TMSDatabase extends Dexie {
  users!: Table<User>;
  equipment!: Table<Equipment>;
  ots!: Table<OT>;
  ats!: Table<AT>;
  consignations!: Table<Consignation>;

  constructor() {
    super('TMSDatabase');
    this.version(1).stores({
      users: '++id, name, role',
      equipment: '++id, name',
      ots: '++id, equipmentId, createdById, status',
      ats: '++id, otId, status',
      consignations: '++id, atId'
    });
  }
}

export const db = new TMSDatabase();

export async function seedDatabase() {
  const userCount = await db.users.count();
  if (userCount === 0) {
    await db.users.bulkAdd([
      // SUPER
      { name: 'BRAHMI Nadir', role: 'SUPER', title: 'Chef de Centrale', password: 'nadir' },
      { name: 'OULED BENSAID Boudjemaa', role: 'SUPER', title: "Chef d'Exploitation", password: 'boudjemaa' },
      { name: 'FEDLAOUI Mhamed', role: 'SUPER', title: 'Chef de Maintenance', password: 'mhamed' },
      // HSE
      { name: 'BOUDOUAYA Belkacem', role: 'HSE', title: 'HSE', password: 'belkacem' },
      { name: 'YAHIAOUI Mebrouk', role: 'HSE', title: 'HSE', password: 'mebrouk' },
      { name: 'YAHIAOUI Mohamed', role: 'HSE', title: 'HSE', password: 'mohamed' },
      // Chefs d'Équipe
      { name: 'ZEKRAOUI Ahmed', role: 'CHEF_EQUIPE', title: "Chef d'Équipe A", password: 'ahmed' },
      { name: 'NESSIRI Elaid', role: 'CHEF_EQUIPE', title: "Chef d'Équipe B", password: 'elaid' },
      { name: 'FEDLAOUI Abderrahmane', role: 'CHEF_EQUIPE', title: "Chef d'Équipe C", password: 'abderrahmane' },
      // Agents de Quart
      { name: 'YAHIAOUI Djamel Eddine', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'djamel' },
      { name: 'MOUSSAOUI Chemsedine', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'chems' },
      { name: 'KHAMBLOUCHI Ahmed', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'ahmed' },
      { name: 'BELKHEIR Brahim', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'brahim' },
      { name: 'BRAHMI Nouredine', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'nouredine' },
      { name: 'YAHIAOUI Madani', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'madani' },
      { name: 'MEKHLOUFI Abdelnour', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'abdelnour' },
      { name: 'ZEKRAOUI Zoubir', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'zoubir' },
      { name: 'NESSIRI Hachim', role: 'AGENT_QUART', title: 'Agent de Quart', password: 'hachim' },
      // Techniciens
      { name: 'MERZAK Brahim', role: 'TECHNICIEN', title: 'Technicien', password: 'brahim' },
      { name: 'CHIKHAOUI Mohamed', role: 'TECHNICIEN', title: 'Technicien', password: 'mohamed' },
      { name: 'HAMIDI Zakaria', role: 'TECHNICIEN', title: 'Technicien', password: 'zakaria' },
      // Agents Polyvalents
      { name: 'TOUHAMI Mejdoub', role: 'AGENT_POLYVALENT', title: 'Agent Polyvalent', password: 'mejdoub' },
      { name: 'OULED BENSAID Slimane', role: 'AGENT_POLYVALENT', title: 'Agent Polyvalent', password: 'slimane' },
      { name: 'REZOUGUI Mustapha', role: 'AGENT_POLYVALENT', title: 'Agent Polyvalent', password: 'mustapha' },
      { name: 'REZOUGUI Brahim', role: 'AGENT_POLYVALENT', title: 'Agent Polyvalent', password: 'brahim' },
      { name: 'BOUAMEUR Mounir', role: 'AGENT_POLYVALENT', title: 'Agent Polyvalent', password: 'mounir' },
      { name: 'MAACHE Hemza', role: 'AGENT_POLYVALENT', title: 'Agent Polyvalent', password: 'hemza' },
      { name: 'SAIDI Abdeslam', role: 'AGENT_POLYVALENT', title: 'Agent Polyvalent', password: 'abdeslam' },
      { name: 'BAGGA Abdelgak', role: 'AGENT_POLYVALENT', title: 'Agent Polyvalent', password: 'abdelgak' },
    ]);
  }

  const equipCount = await db.equipment.count();
  if (equipCount === 0) {
    await db.equipment.bulkAdd([
      { name: 'Groupe Caterpillar C18 STH N°01', description: 'Groupe électrogène de secours' },
      { name: 'Groupe Caterpillar C18 STH N°02', description: 'Groupe électrogène de secours' },
      { name: 'Groupe Caterpillar C18 STH N°03', description: 'Groupe électrogène de secours' },
      { name: 'Groupe Caterpillar C18 STH N°04', description: 'Groupe électrogène de secours' },
      { name: 'Groupe Caterpillar 3512B N°05', description: 'Groupe électrogène principal' },
      { name: 'Groupe Caterpillar 3512B N°06', description: 'Groupe électrogène principal' },
      { name: 'Transformateur de Puissance T1', description: 'Transformateur principal 30kV/400V' },
      { name: 'Armoire TGBT', description: 'Tableau Général Basse Tension' },
      { name: 'Pompe à Gasoil P1', description: 'Pompe de transfert combustible' },
      { name: 'Cuve de Stockage C1', description: 'Cuve gasoil 50000L' },
      { name: 'Système de Refroidissement Centralisé', description: 'Aéro-réfrigérants' },
    ]);
  }
}
