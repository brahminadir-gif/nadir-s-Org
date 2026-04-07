/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Toaster } from './components/ui/sonner';
import { seedDatabase } from './lib/db';
import { useAuth } from './hooks/useAuth';
import { registerToken, setupForegroundNotifications } from './lib/notificationService';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OTList from './pages/OTList';
import ATList from './pages/ATList';
import EquipmentList from './pages/EquipmentList';
import PersonnelList from './pages/PersonnelList';
import MaintenanceReports from './pages/MaintenanceReports';
import ConsignationPage from './pages/Consignation';
import Layout from './components/Layout';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    seedDatabase().then(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (user?.id) {
      registerToken(user.id.toString());
      setupForegroundNotifications();
    }
  }, [user]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-primary">
        <div className="animate-pulse text-2xl font-bold">Chargement TMS...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ot" element={<OTList />} />
          <Route path="/at" element={<ATList />} />
          <Route path="/at/:atId/consignation" element={<ConsignationPage />} />
          <Route path="/equipment" element={<EquipmentList />} />
          <Route path="/personnel" element={<PersonnelList />} />
          <Route path="/reports" element={<MaintenanceReports />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-right" theme="dark" />
    </Router>
  );
}

