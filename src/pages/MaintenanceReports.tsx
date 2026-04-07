import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileText, 
  Download, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  User
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

export default function MaintenanceReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  const ots = useLiveQuery(() => db.ots.toArray()) || [];
  const ats = useLiveQuery(() => db.ats.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const equipment = useLiveQuery(() => db.equipment.toArray()) || [];

  // Filter OTs for the selected month that are COMPLETED
  const monthlyOTs = ots.filter(ot => {
    const otDate = new Date(ot.createdAt);
    return isSameMonth(otDate, selectedMonth) && ot.status === 'TERMINE';
  });

  const generateMonthlyReport = () => {
    if (monthlyOTs.length === 0) {
      toast.error('Aucun travail terminé pour ce mois.');
      return;
    }

    const doc = new jsPDF();
    const monthName = format(selectedMonth, 'MMMM yyyy', { locale: fr });

    // Header
    doc.setFillColor(10, 22, 40);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('RAPPORT MENSUEL DE MAINTENANCE', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Centrale Diesel de Tabelbala - ${monthName.toUpperCase()}`, 105, 30, { align: 'center' });

    // Summary Table Data
    const tableData = monthlyOTs.map(ot => {
      const equip = equipment.find(e => e.id === ot.equipmentId);
      const chef = users.find(u => u.id === ot.createdById);
      const at = ats.find(a => a.otId === ot.id);
      
      return [
        `OT #${ot.id}`,
        format(ot.createdAt, 'dd/MM/yyyy'),
        ot.title,
        equip?.name || 'N/A',
        chef?.name || 'N/A',
        at?.status === 'AUTORISE' ? 'OUI' : 'NON'
      ];
    });

    (doc as any).autoTable({
      startY: 50,
      head: [['ID', 'Date', 'Travaux Effectués', 'Équipement', 'Chef de Travaux', 'AT Validée']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: [10, 22, 40], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        4: { cellWidth: 40 }
      }
    });

    // Statistics
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ STATISTIQUE', 20, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total des interventions terminées : ${monthlyOTs.length}`, 20, finalY + 10);
    doc.text(`Date de génération : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, finalY + 20);

    // Signatures
    doc.text('Visa Chef de Maintenance', 40, finalY + 50);
    doc.text('Visa Chef de Centrale', 140, finalY + 50);
    doc.line(30, finalY + 70, 80, finalY + 70);
    doc.line(130, finalY + 70, 180, finalY + 70);

    doc.save(`Rapport_Maintenance_${format(selectedMonth, 'yyyy_MM')}.pdf`);
    toast.success('Rapport généré avec succès');
  };

  const changeMonth = (offset: number) => {
    setSelectedMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + offset);
      return d;
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="text-primary w-8 h-8" />
            Rapports de Maintenance
          </h1>
          <p className="text-muted-foreground mt-1">
            Génération automatique des rapports mensuels d'activité.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border/50 p-1 rounded-lg">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 font-bold flex items-center gap-2 min-w-[150px] justify-center">
            <Calendar className="w-4 h-4 text-primary" />
            {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Travaux du mois</CardTitle>
              <CardDescription>Liste des interventions terminées en {format(selectedMonth, 'MMMM', { locale: fr })}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              {monthlyOTs.length} OT(s)
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead>OT</TableHead>
                  <TableHead>Équipement</TableHead>
                  <TableHead>Chef de Travaux</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyOTs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                      Aucun travail terminé pour cette période.
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyOTs.map((ot) => (
                    <TableRow key={ot.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{ot.title}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">#{ot.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {equipment.find(e => e.id === ot.equipmentId)?.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-[10px] font-bold text-secondary">
                            {users.find(u => u.id === ot.createdById)?.name.charAt(0)}
                          </div>
                          <span className="text-xs">{users.find(u => u.id === ot.createdById)?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {format(ot.createdAt, 'dd/MM/yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Exporter le Rapport
              </CardTitle>
              <CardDescription>Générer un document PDF officiel pour archivage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background border border-border/50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Période:</span>
                  <span className="font-bold">{format(selectedMonth, 'MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interventions:</span>
                  <span className="font-bold">{monthlyOTs.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge className="bg-success/20 text-success border-success/30 h-5 text-[10px]">PRÊT</Badge>
                </div>
              </div>
              <Button 
                className="w-full bg-primary text-background font-bold h-12" 
                onClick={generateMonthlyReport}
                disabled={monthlyOTs.length === 0}
              >
                Générer PDF Mensuel
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-secondary" />
                Aide au Rapport
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• Seuls les Ordres de Travail (OT) avec le statut <span className="text-success font-bold">TERMINE</span> sont inclus.</p>
              <p>• Le rapport liste automatiquement l'équipement concerné et le Chef de Travaux responsable.</p>
              <p>• Ce document sert de base pour les réunions de coordination mensuelles.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
