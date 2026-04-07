import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import type { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Input } from '../components/ui/input';
import { LogIn, ArrowLeft, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  useEffect(() => {
    db.users.toArray().then(setUsers);
  }, []);

  const handleLogin = () => {
    if (selectedUser && selectedUser.password === password) {
      login(selectedUser);
      window.location.href = '/';
    } else {
      toast.error('Mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/20 shadow-2xl shadow-primary/5">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-32 h-32 flex items-center justify-center mb-2">
            <img 
              src="https://storage.googleapis.com/static.mira.bot/agent-attachments/93806282-358b-4974-9b57-61614214247e/sonelgaz_logo.png" 
              alt="Sonelgaz Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">TMS Tabelbala</CardTitle>
          <CardDescription className="text-muted-foreground">
            Centrale Diesel (SONELGAZ/SPE) - Gestion Maintenance & Sécurité
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedUser ? (
            <>
              <div className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">
                Sélectionnez votre profil
              </div>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {users.map((u) => (
                    <Button
                      key={u.id}
                      variant="outline"
                      className="h-auto py-4 px-4 justify-start text-left hover:bg-primary/10 hover:border-primary/50 transition-all group"
                      onClick={() => setSelectedUser(u)}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {u.name}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary/40" />
                          {u.title}
                        </span>
                      </div>
                      <LogIn className="ml-auto w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-2" 
                onClick={() => {
                  setSelectedUser(null);
                  setPassword('');
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour à la liste
              </Button>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-lg">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.title}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mot de passe</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="Entrez votre mot de passe" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    autoFocus
                  />
                </div>
              </div>

              <Button className="w-full bg-primary text-background font-bold h-12" onClick={handleLogin}>
                Se connecter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
