import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Factory, Info } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';

export default function EquipmentList() {
  const equipment = useLiveQuery(() => db.equipment.toArray()) || [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Parc Équipements</h1>
        <p className="text-muted-foreground mt-1">Liste des actifs de la centrale Diesel de Tabelbala.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {equipment.map((e) => (
          <Card key={e.id} className="border-border/50 hover:border-primary/30 transition-colors group">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Factory className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{e.name}</CardTitle>
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest mt-1">ID: {e.id}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                {e.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
