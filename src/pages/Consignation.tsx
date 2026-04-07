import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { notifyRole } from '../lib/notificationService';
import type { Consignation, ConsignationStep } from '../types';

export default function ConsignationPage() {
  const { atId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  const at = useLiveQuery(() => db.ats.get(parseInt(atId!)), [atId]);
  const ot = useLiveQuery(() => at ? db.ots.get(at.otId) : undefined, [at]);
  const equip = useLiveQuery(() => ot ? db.equipment.get(ot.equipmentId) : undefined, [ot]);
  const consignation = useLiveQuery(() => db.consignations.where('atId').equals(parseInt(atId!)).first(), [atId]);

  const defaultSteps: ConsignationStep[] = [
    { id: '1', description: 'Arrêt du groupe et mise au repos', isDone: false },
    { id: '2', description: 'Ouverture du disjoncteur principal', isDone: false },
    { id: '3', description: 'Cadenassage du disjoncteur (LOTO)', isDone: false },
    { id: '4', description: 'Fermeture des vannes d\'arrivée gasoil', isDone: false },
    { id: '5', description: 'Vérification de l\'absence de tension (VAT)', isDone: false },
    { id: '6', description: 'Mise à la terre et en court-circuit', isDone: false },
  ];

  const initConsignation = async () => {
    if (!atId || !user?.id) return;
    
    if (at?.status !== 'AUTORISE') {
      toast.error('L\'AT doit être autorisée par le SUPER avant d\'initier la consignation');
      return;
    }

    try {
      await db.consignations.add({
        atId: parseInt(atId),
        steps: defaultSteps,
        initiatedById: user.id,
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Notify AGENT_QUART
      await notifyRole('AGENT_QUART', 'Consignation Initiée', `Une consignation a été initiée pour l'AT #${atId}. Validation requise.`, 'CONSIGNATION_INITIATED');

      toast.success('Consignation initiée');
    } catch (error) {
      toast.error('Erreur lors de l\'initiation');
    }
  };

  const toggleStep = async (stepId: string) => {
    if (!consignation || !user?.id) return;
    
    if (at?.status !== 'AUTORISE') {
      toast.error('L\'AT n\'est plus dans un état valide pour la consignation');
      return;
    }

    // Permission check: Agent de Quart, Chef d'Equipe or SUPER
    if (!['AGENT_QUART', 'CHEF_EQUIPE', 'SUPER'].includes(user.role)) {
      toast.error('Vous n\'avez pas les droits pour valider les étapes');
      return;
    }

    const newSteps = consignation.steps.map(s => {
      if (s.id === stepId) {
        return { 
          ...s, 
          isDone: !s.isDone, 
          doneById: !s.isDone ? user.id : undefined,
          doneAt: !s.isDone ? new Date() : undefined
        };
      }
      return s;
    });

    const isCompleted = newSteps.every(s => s.isDone);

    try {
      await db.consignations.update(consignation.id!, { 
        steps: newSteps, 
        isCompleted,
        validatedById: isCompleted ? user.id : undefined,
        updatedAt: new Date() 
      });
      
      if (isCompleted) {
        await db.ats.update(parseInt(atId!), { isConsigned: true });
        
        // Notify SUPER and CHEF_EQUIPE
        await notifyRole('SUPER', 'Consignation Terminée', `L'équipement pour l'AT #${atId} est maintenant consigné.`, 'CONSIGNATION_COMPLETED');
        await notifyRole('CHEF_EQUIPE', 'Consignation Terminée', `L'équipement pour l'AT #${atId} est maintenant consigné.`, 'CONSIGNATION_COMPLETED');

        toast.success('Consignation terminée et validée');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (!at) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/at')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour aux AT
      </Button>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Lock className="text-warning w-8 h-8" />
            Gestion de Consignation
          </h1>
          <p className="text-muted-foreground mt-1">
            AT #{at.id} - {equip?.name}
          </p>
        </div>
        {consignation?.isCompleted && (
          <Badge className="bg-success text-white py-2 px-4 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 mr-2" /> CONSIGNÉ
          </Badge>
        )}
      </header>

      {!consignation ? (
        <Card className="border-dashed border-2 border-border/50 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Aucune consignation active</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                L'équipement doit être consigné avant le début des travaux. 
                L'initiation doit être faite par un Agent de Quart ou un Responsable.
              </p>
            </div>
            <Button onClick={initConsignation} className="bg-warning text-black hover:bg-warning/90 font-bold">
              Initier la Consignation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Étapes de Consignation</CardTitle>
                <CardDescription>Cochez chaque étape après exécution physique sur le terrain.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {consignation.steps.map((step) => (
                  <div 
                    key={step.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border transition-all",
                      step.isDone ? "bg-success/5 border-success/30" : "bg-muted/20 border-border/50"
                    )}
                  >
                    <Checkbox 
                      id={step.id} 
                      checked={step.isDone} 
                      onCheckedChange={() => toggleStep(step.id)}
                      className="mt-1 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-background"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={step.id} 
                        className={cn(
                          "font-bold cursor-pointer block",
                          step.isDone ? "text-success line-through opacity-70" : "text-foreground"
                        )}
                      >
                        {step.description}
                      </label>
                      {step.isDone && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Validé par {users.find(u => u.id === step.doneById)?.name} le {format(step.doneAt!, 'PPp', { locale: fr })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Infos Sécurité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                  <ShieldCheck className="text-primary w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold">EPI Obligatoires</p>
                    <p className="text-[10px] text-muted-foreground">Casque, Gants diélectriques, Chaussures sécu</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/50">
                  <Lock className="text-warning w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold">Cadenassage</p>
                    <p className="text-[10px] text-muted-foreground">Utiliser les cadenas personnels (LOTO)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Historique</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p><span className="text-muted-foreground">Initié le:</span> {format(consignation.createdAt, 'PPp', { locale: fr })}</p>
                <p><span className="text-muted-foreground">Dernière MAJ:</span> {format(consignation.updatedAt, 'PPp', { locale: fr })}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}


