import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  ClipboardList, 
  FileCheck, 
  Settings, 
  LogOut, 
  Menu,
  HardHat,
  Factory,
  Users,
  FileText
} from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Tableau de bord', path: '/', icon: LayoutDashboard },
    { name: 'Ordres de Travail', path: '/ot', icon: ClipboardList },
    { name: 'Autorisations', path: '/at', icon: FileCheck },
    { name: 'Équipements', path: '/equipment', icon: Factory },
    { name: 'Personnel', path: '/personnel', icon: Users },
    { name: 'Rapports', path: '/reports', icon: FileText },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-card border-r border-border p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 flex items-center justify-center">
            <img 
              src="https://storage.googleapis.com/static.mira.bot/agent-attachments/93806282-358b-4974-9b57-61614214247e/sonelgaz_logo.png" 
              alt="Sonelgaz Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">TMS</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Tabelbala Diesel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
                location.pathname === item.path
                  ? "bg-primary text-background shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-border">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-background">
              {user?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.title}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img 
            src="https://storage.googleapis.com/static.mira.bot/agent-attachments/93806282-358b-4974-9b57-61614214247e/sonelgaz_logo.png" 
            alt="Sonelgaz Logo" 
            className="w-8 h-8 object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-lg">TMS Tabelbala</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </Button>
      </header>

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-3/4 bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
             <nav className="space-y-4 mt-10">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium",
                    location.pathname === item.path
                      ? "bg-primary text-background"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive mt-10"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Déconnexion
              </Button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
