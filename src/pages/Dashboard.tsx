import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  ClipboardList, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const ots = useLiveQuery(() => db.ots.toArray()) || [];
  const ats = useLiveQuery(() => db.ats.toArray()) || [];
  const equipment = useLiveQuery(() => db.equipment.toArray()) || [];

  const stats = [
    { 
      label: 'OT Ouverts', 
      value: ots.filter(o => o.status === 'OUVERT' || o.status === 'EN_COURS').length, 
      icon: ClipboardList, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: 'AT en attente', 
      value: ats.filter(a => a.status.startsWith('ATTENTE')).length, 
      icon: Clock, 
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    { 
      label: 'AT Autorisées', 
      value: ats.filter(a => a.status === 'AUTORISE').length, 
      icon: CheckCircle2, 
      color: 'text-success',
      bg: 'bg-success/10'
    },
    { 
      label: 'Équipements', 
      value: equipment.length, 
      icon: Activity, 
      color: 'text-secondary',
      bg: 'bg-secondary/10'
    },
  ];

  // Data for OT Bar Chart
  const otData = [
    { name: 'Ouverts', count: ots.filter(o => o.status === 'OUVERT').length, color: '#0ea5e9' },
    { name: 'En Cours', count: ots.filter(o => o.status === 'EN_COURS').length, color: '#f59e0b' },
    { name: 'Terminés', count: ots.filter(o => o.status === 'TERMINE').length, color: '#10b981' },
    { name: 'Annulés', count: ots.filter(o => o.status === 'ANNULE').length, color: '#ef4444' },
  ];

  // Data for AT Pie Chart
  const atStatusCounts = ats.reduce((acc: any, at) => {
    const status = at.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const atData = [
    { name: 'Brouillon', value: atStatusCounts['BROUILLON'] || 0, color: '#94a3b8' },
    { name: 'Attente Maintenance', value: atStatusCounts['ATTENTE_MAINTENANCE'] || 0, color: '#f59e0b' },
    { name: 'Attente HSE', value: atStatusCounts['ATTENTE_HSE'] || 0, color: '#f59e0b' },
    { name: 'Attente SUPER', value: atStatusCounts['ATTENTE_SUPER'] || 0, color: '#f59e0b' },
    { name: 'Autorisé', value: atStatusCounts['AUTORISE'] || 0, color: '#10b981' },
    { name: 'Terminé', value: atStatusCounts['TERMINE'] || 0, color: '#0ea5e9' },
    { name: 'Rejeté', value: atStatusCounts['REJETE'] || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenue, <span className="text-primary font-bold">{user?.name}</span>. Voici l'état actuel de la centrale.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* OT Status Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Statut des Ordres de Travail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={otData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {otData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AT Status Chart */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-secondary" />
              Répartition des Autorisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={atData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {atData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent OTs */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              OT Récents
            </CardTitle>
            <Badge variant="outline" className="font-bold">{ots.length} Total</Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {ots.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground italic">Aucun ordre de travail</div>
              ) : (
                <div className="space-y-4">
                  {ots.slice().reverse().map((ot) => (
                    <div key={ot.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div>
                        <p className="font-bold text-sm">{ot.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(ot.createdAt, 'PPp', { locale: fr })}
                        </p>
                      </div>
                      <Badge className={
                        ot.status === 'OUVERT' ? 'bg-primary/20 text-primary border-primary/30' :
                        ot.status === 'EN_COURS' ? 'bg-warning/20 text-warning border-warning/30' :
                        'bg-success/20 text-success border-success/30'
                      }>
                        {ot.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent ATs */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-secondary" />
              AT en cours
            </CardTitle>
            <Badge variant="outline" className="font-bold">{ats.length} Total</Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {ats.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground italic">Aucune autorisation de travail</div>
              ) : (
                <div className="space-y-4">
                  {ats.slice().reverse().map((at) => (
                    <div key={at.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div>
                        <p className="font-bold text-sm">AT #{at.id} (OT #{at.otId})</p>
                        <p className="text-xs text-muted-foreground">
                          {format(at.createdAt, 'PPp', { locale: fr })}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-gold/50 text-gold bg-gold/5">
                        {at.status.replace('ATTENTE_', 'Attente ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
