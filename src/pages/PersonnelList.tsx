import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  Search, 
  UserCircle,
  Shield,
  Wrench,
  HardHat,
  User
} from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { UserRole } from '../types';

const roleConfig: Record<UserRole, { label: string, color: string, icon: any }> = {
  'SUPER': { label: 'Direction / Super', color: 'bg-primary/20 text-primary border-primary/30', icon: Shield },
  'HSE': { label: 'HSE', color: 'bg-success/20 text-success border-success/30', icon: Shield },
  'CHEF_EQUIPE': { label: 'Chef d\'Équipe', color: 'bg-warning/20 text-warning border-warning/30', icon: HardHat },
  'AGENT_QUART': { label: 'Agent de Quart', color: 'bg-gold/20 text-gold border-gold/30', icon: UserCircle },
  'TECHNICIEN': { label: 'Technicien', color: 'bg-secondary/20 text-secondary border-secondary/30', icon: Wrench },
  'AGENT_POLYVALENT': { label: 'Agent Polyvalent', color: 'bg-muted/50 text-muted-foreground border-border', icon: User },
};

export default function PersonnelList() {
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.title.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="text-primary w-8 h-8" />
            Personnel de la Centrale
          </h1>
          <p className="text-muted-foreground mt-1">
            Organigramme complet de la Centrale Diesel de Tabelbala.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un agent..." 
            className="pl-10 bg-card border-border/50 focus:border-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground italic">
            Aucun agent ne correspond à votre recherche.
          </div>
        ) : (
          filteredUsers.map((u) => {
            const config = roleConfig[u.role];
            const Icon = config.icon;
            
            return (
              <Card key={u.id} className="border-border/50 hover:border-primary/30 transition-all group overflow-hidden">
                <div className={cn("h-1 w-full", config.color.split(' ')[0])} />
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors", config.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden">
                    <CardTitle className="text-lg truncate">{u.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium truncate">{u.title}</p>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-widest font-bold", config.color)}>
                      {config.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {u.id}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
