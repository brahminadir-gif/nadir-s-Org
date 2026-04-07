import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Plus, 
  ClipboardList, 
  Search, 
  Filter,
  MoreVertical,
  FileText
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { notifyRole } from '../lib/notificationService';
import type { OT, OTStatus } from '../types';

export default function OTList() {
  const { user } = useAuth();
  const ots = useLiveQuery(() => db.ots.toArray()) || [];
  const equipment = useLiveQuery(() => db.equipment.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOT, setNewOT] = useState<Partial<OT>>({
    title: '',
    description: '',
    equipmentId: undefined,
    status: 'OUVERT'
  });

  const handleCreateOT = async () => {
    if (!newOT.title || !newOT.equipmentId || !user?.id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await db.ots.add({
        title: newOT.title,
        description: newOT.description || '',
        equipmentId: newOT.equipmentId,
        createdById: user.id,
        status: 'OUVERT',
        createdAt: new Date(),
        updatedAt: new Date()
      } as OT);
      
      // Notify SUPER and CHEF_EQUIPE
      await notifyRole('SUPER', 'Nouvel OT', `Un nouvel OT a été créé: ${newOT.title}`, 'OT_CREATED');
      await notifyRole('CHEF_EQUIPE', 'Nouvel OT', `Un nouvel OT a été créé: ${newOT.title}`, 'OT_CREATED');

      toast.success('Ordre de Travail créé avec succès');
      setIsCreateOpen(false);
      setNewOT({ title: '', description: '', equipmentId: undefined, status: 'OUVERT' });
    } catch (error) {
      toast.error('Erreur lors de la création de l\'OT');
    }
  };

  const createAT = async (ot: OT) => {
    try {
      const existingAT = await db.ats.where('otId').equals(ot.id!).first();
      if (existingAT) {
        toast.info('Une AT existe déjà pour cet OT');
        return;
      }

      await db.ats.add({
        otId: ot.id!,
        createdById: user!.id!,
        status: 'BROUILLON',
        risks: [],
        measures: [],
        isConsigned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      toast.success('Brouillon d\'AT créé');
    } catch (error) {
      toast.error('Erreur lors de la création de l\'AT');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordres de Travail</h1>
          <p className="text-muted-foreground mt-1">Gérez les interventions de maintenance.</p>
        </div>
        
        {(user?.role === 'SUPER' || user?.role === 'CHEF_EQUIPE') && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-background hover:bg-primary/90 font-bold">
                <Plus className="w-5 h-5 mr-2" />
                Nouvel OT
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>Créer un Ordre de Travail</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre de l'intervention</Label>
                  <Input 
                    id="title" 
                    placeholder="ex: Révision 500h G1" 
                    value={newOT.title}
                    onChange={e => setNewOT({...newOT, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment">Équipement</Label>
                  <Select onValueChange={v => setNewOT({...newOT, equipmentId: parseInt(v as string, 10)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un équipement" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map(e => (
                        <SelectItem key={e.id} value={e.id!.toString()}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Input 
                    id="desc" 
                    placeholder="Détails de l'intervention..." 
                    value={newOT.description}
                    onChange={e => setNewOT({...newOT, description: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                <Button onClick={handleCreateOT}>Créer l'OT</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Équipement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    Aucun ordre de travail trouvé
                  </TableCell>
                </TableRow>
              ) : (
                ots.slice().reverse().map((ot) => (
                  <TableRow key={ot.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">#{ot.id}</TableCell>
                    <TableCell className="font-bold">{ot.title}</TableCell>
                    <TableCell className="text-sm">
                      {equipment.find(e => e.id === ot.equipmentId)?.name || 'Inconnu'}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        ot.status === 'OUVERT' ? 'bg-primary/20 text-primary border-primary/30' :
                        ot.status === 'EN_COURS' ? 'bg-warning/20 text-warning border-warning/30' :
                        'bg-success/20 text-success border-success/30'
                      }>
                        {ot.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(ot.createdAt, 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-secondary hover:text-secondary hover:bg-secondary/10"
                        onClick={() => createAT(ot)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Créer AT
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
