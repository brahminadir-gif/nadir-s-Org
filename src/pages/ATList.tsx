import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  FileText,
  Download,
  Lock,
  Unlock,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  DialogFooter
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { notifyRole } from '../lib/notificationService';
import type { AT, ATStatus } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ATList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ats = useLiveQuery(() => db.ats.toArray()) || [];
  const ots = useLiveQuery(() => db.ots.toArray()) || [];
  const equipment = useLiveQuery(() => db.equipment.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];

  const [selectedAT, setSelectedAT] = useState<AT | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const updateATStatus = async (at: AT, newStatus: ATStatus) => {
    try {
      const updateData: any = { status: newStatus, updatedAt: new Date() };
      
      if (newStatus === 'ATTENTE_HSE') updateData.maintenanceValidatorId = user?.id;
      if (newStatus === 'ATTENTE_SUPER') updateData.hseValidatorId = user?.id;
      if (newStatus === 'AUTORISE') updateData.superValidatorId = user?.id;

      await db.ats.update(at.id!, updateData);
      
      // Notify based on status
      if (newStatus === 'ATTENTE_MAINTENANCE') {
        await notifyRole('CHEF_EQUIPE', 'AT à valider (Maintenance)', `L'AT (#${at.id}) attend la validation maintenance`, 'AT_VALIDATION_REQUIRED');
      } else if (newStatus === 'ATTENTE_HSE') {
        await notifyRole('HSE', 'AT à valider (HSE)', `L'AT (#${at.id}) attend la validation HSE`, 'AT_VALIDATION_REQUIRED');
      } else if (newStatus === 'ATTENTE_SUPER') {
        await notifyRole('SUPER', 'AT à valider (SUPER)', `L'AT (#${at.id}) attend l'autorisation finale`, 'AT_VALIDATION_REQUIRED');
      } else if (newStatus === 'AUTORISE') {
        const creator = users.find(u => u.id === at.createdById);
        if (creator?.id) {
          await notifyRole('CHEF_EQUIPE', 'AT Autorisée', `L'AT (#${at.id}) a été autorisée.`, 'AT_AUTHORIZED');
        }
      } else if (newStatus === 'REJETE') {
        await notifyRole('CHEF_EQUIPE', 'AT Rejetée', `L'AT (#${at.id}) a été rejetée.`, 'AT_REJECTED');
      }

      toast.success(`AT mise à jour: ${newStatus}`);
      setIsDetailsOpen(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const generatePDF = (at: AT) => {
    const ot = ots.find(o => o.id === at.otId);
    const equip = equipment.find(e => e.id === ot?.equipmentId);
    const creator = users.find(u => u.id === at.createdById);

    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(10, 22, 40);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('AUTORISATION DE TRAVAIL', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Centrale Diesel de Tabelbala (SONELGAZ/SPE)', 105, 30, { align: 'center' });

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`AT N°: ${at.id}`, 20, 50);
    doc.text(`Date: ${format(at.createdAt, 'dd/MM/yyyy')}`, 150, 50);
    
    doc.line(20, 55, 190, 55);

    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DE L\'INTERVENTION', 20, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(`OT Associé: #${ot?.id} - ${ot?.title}`, 20, 75);
    doc.text(`Équipement: ${equip?.name}`, 20, 85);
    doc.text(`Demandeur: ${creator?.name} (${creator?.title})`, 20, 95);

    doc.setFont('helvetica', 'bold');
    doc.text('SÉCURITÉ ET RISQUES', 20, 110);
    doc.setFont('helvetica', 'normal');
    doc.text('Risques identifiés: Électrique, Mécanique, Incendie', 20, 120);
    doc.text('Mesures de prévention: Consignation, EPI, Extincteur', 20, 130);

    doc.setFont('helvetica', 'bold');
    doc.text('VALIDATIONS', 20, 150);
    doc.setFontSize(10);
    doc.text(`Maintenance: ${at.maintenanceValidatorId ? 'VALIDÉ' : 'EN ATTENTE'}`, 20, 160);
    doc.text(`HSE: ${at.hseValidatorId ? 'VALIDÉ' : 'EN ATTENTE'}`, 20, 170);
    doc.text(`Autorisation Finale: ${at.superValidatorId ? 'VALIDÉ' : 'EN ATTENTE'}`, 20, 180);

    // Footer
    doc.setFontSize(8);
    doc.text('Document généré par TMS Tabelbala - Système de Gestion de Sécurité', 105, 285, { align: 'center' });

    doc.save(`AT_${at.id}_Tabelbala.pdf`);
    toast.success('PDF généré avec succès');
  };

  const toggleConsignation = async (at: AT) => {
    try {
      await db.ats.update(at.id!, { isConsigned: !at.isConsigned, updatedAt: new Date() });
      toast.success(at.isConsigned ? 'Déconsignation effectuée' : 'Consignation effectuée');
    } catch (error) {
      toast.error('Erreur lors de la consignation');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Autorisations de Travail</h1>
        <p className="text-muted-foreground mt-1">Validation HSE et Maintenance pour les interventions à risque.</p>
      </header>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-[100px]">AT ID</TableHead>
                <TableHead>OT Associé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Consignation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                    Aucune autorisation en cours
                  </TableCell>
                </TableRow>
              ) : (
                ats.slice().reverse().map((at) => (
                  <TableRow key={at.id} className="border-border/50 hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">AT #{at.id}</TableCell>
                    <TableCell className="font-bold">
                      {ots.find(o => o.id === at.otId)?.title || 'Inconnu'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "border-gold/50 text-gold bg-gold/5",
                        at.status === 'AUTORISE' && "border-success/50 text-success bg-success/5",
                        at.status === 'REJETE' && "border-destructive/50 text-destructive bg-destructive/5",
                        at.status === 'BROUILLON' && "border-muted-foreground/50 text-muted-foreground bg-muted/5"
                      )}>
                        {at.status.replace('ATTENTE_', 'Attente ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {at.isConsigned ? (
                        <Badge className="bg-success/20 text-success border-success/30">
                          <Lock className="w-3 h-3 mr-1" /> Consigné
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Unlock className="w-3 h-3 mr-1" /> Non Consigné
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedAT(at);
                          setIsDetailsOpen(true);
                        }}
                      >
                        Détails
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-warning hover:text-warning hover:bg-warning/10"
                        onClick={() => navigate(`/at/${at.id}/consignation`)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Consignation
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-primary"
                        onClick={() => generatePDF(at)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="text-primary" />
              Détails de l'Autorisation AT #{selectedAT?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAT && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Équipement</p>
                  <p className="font-bold">{equipment.find(e => e.id === ots.find(o => o.id === selectedAT.otId)?.equipmentId)?.name}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Statut Actuel</p>
                  <p className="font-bold text-gold">{selectedAT.status}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-warning" />
                  Circuit de Validation Séquentiel
                </h3>
                <div className="space-y-2">
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded bg-background border",
                    selectedAT.status === 'ATTENTE_MAINTENANCE' ? "border-primary shadow-sm" : "border-border/50"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">1. Validation Maintenance</span>
                      {selectedAT.status === 'ATTENTE_MAINTENANCE' && <Badge className="text-[8px] h-4">En cours</Badge>}
                    </div>
                    {selectedAT.maintenanceValidatorId ? <CheckCircle2 className="text-success w-5 h-5" /> : <Clock className="text-muted-foreground w-5 h-5" />}
                  </div>
                  
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded bg-background border",
                    selectedAT.status === 'ATTENTE_HSE' ? "border-primary shadow-sm" : "border-border/50"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">2. Validation HSE</span>
                      {selectedAT.status === 'ATTENTE_HSE' && <Badge className="text-[8px] h-4">En cours</Badge>}
                    </div>
                    {selectedAT.hseValidatorId ? <CheckCircle2 className="text-success w-5 h-5" /> : <Clock className="text-muted-foreground w-5 h-5" />}
                  </div>
                  
                  <div className={cn(
                    "flex items-center justify-between p-2 rounded bg-background border",
                    selectedAT.status === 'ATTENTE_SUPER' ? "border-primary shadow-sm" : "border-border/50"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">3. Autorisation Finale (SUPER)</span>
                      {selectedAT.status === 'ATTENTE_SUPER' && <Badge className="text-[8px] h-4">En cours</Badge>}
                    </div>
                    {selectedAT.superValidatorId ? <CheckCircle2 className="text-success w-5 h-5" /> : <Clock className="text-muted-foreground w-5 h-5" />}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {/* Rejection button for any validator */}
                {(
                  (user?.role === 'CHEF_EQUIPE' && selectedAT.status === 'ATTENTE_MAINTENANCE') ||
                  (user?.role === 'HSE' && selectedAT.status === 'ATTENTE_HSE') ||
                  (user?.role === 'SUPER' && ['ATTENTE_MAINTENANCE', 'ATTENTE_HSE', 'ATTENTE_SUPER'].includes(selectedAT.status))
                ) && (
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => updateATStatus(selectedAT, 'REJETE')}>
                    <XCircle className="w-4 h-4 mr-2" /> Rejeter
                  </Button>
                )}

                {/* Sequential Approval buttons */}
                {user?.role === 'SUPER' && selectedAT.status === 'ATTENTE_SUPER' && (
                  <Button className="bg-success text-white hover:bg-success/90" onClick={() => updateATStatus(selectedAT, 'AUTORISE')}>
                    Donner l'Autorisation Finale
                  </Button>
                )}
                
                {(user?.role === 'HSE' || user?.role === 'SUPER') && selectedAT.status === 'ATTENTE_HSE' && (
                  <Button className="bg-primary text-background" onClick={() => updateATStatus(selectedAT, 'ATTENTE_SUPER')}>
                    Valider Côté HSE
                  </Button>
                )}

                {(user?.role === 'CHEF_EQUIPE' || user?.role === 'SUPER') && selectedAT.status === 'ATTENTE_MAINTENANCE' && (
                  <Button className="bg-primary text-background" onClick={() => updateATStatus(selectedAT, 'ATTENTE_HSE')}>
                    Valider Maintenance
                  </Button>
                )}

                {selectedAT.status === 'BROUILLON' && (
                  <Button className="bg-primary text-background" onClick={() => updateATStatus(selectedAT, 'ATTENTE_MAINTENANCE')}>
                    Envoyer pour Validation
                  </Button>
                )}

                {(user?.role === 'AGENT_QUART' || user?.role === 'CHEF_EQUIPE' || user?.role === 'SUPER') && selectedAT.status === 'AUTORISE' && (
                  <Button variant="outline" className="border-warning text-warning hover:bg-warning/10" onClick={() => toggleConsignation(selectedAT)}>
                    {selectedAT.isConsigned ? 'Déconsigner' : 'Consigner l\'équipement'}
                  </Button>
                )}
                
                <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>Fermer</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
