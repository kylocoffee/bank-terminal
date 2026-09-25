/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BankingProvider, useBanking } from './context/BankingContext';
import { TerminalHeader } from './components/TerminalHeader';
import { FunctionKeysBar } from './components/FunctionKeysBar';
import { CliView } from './components/views/CliView';
import { S2SView } from './components/views/S2SView';
import { IP2IPView } from './components/views/IP2IPView';
import { NostroVostroView } from './components/views/NostroVostroView';
import { GpiTrackerView } from './components/views/GpiTrackerView';
import { MessageDecoderView } from './components/views/MessageDecoderView';
import { HsmSecurityView } from './components/views/HsmSecurityView';
import { AuditComplianceView } from './components/views/AuditComplianceView';
import { AcademyView } from './components/views/AcademyView';
import { LoginView } from './components/views/LoginView';
import { AdminView } from './components/views/AdminView';
import { LiveSimulationModal } from './components/modals/LiveSimulationModal';
import { TransactionDetailModal } from './components/modals/TransactionDetailModal';

const TerminalScreen: React.FC = () => {
  const { viewMode, currentUser } = useBanking();

  // If user is not logged in, enforce Login screen
  if (!currentUser || viewMode === 'LOGIN') {
    return (
      <div className="flex flex-col h-screen w-screen bg-black text-[#00ff00] font-mono overflow-hidden select-none">
        <TerminalHeader />
        <main className="flex-1 flex flex-col overflow-hidden bg-black">
          <LoginView />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-[#00ff00] font-mono overflow-hidden">
      <TerminalHeader />

      <main className="flex-1 flex flex-col overflow-hidden bg-black">
        {viewMode === 'CLI' && <CliView />}
        {viewMode === 'S2S_FORM' && <S2SView />}
        {viewMode === 'IP2IP_FORM' && <IP2IPView />}
        {viewMode === 'NOSTRO_VOSTRO' && <NostroVostroView />}
        {viewMode === 'GPI_TRACKER' && <GpiTrackerView />}
        {viewMode === 'MESSAGE_DECODER' && <MessageDecoderView />}
        {viewMode === 'HSM_SECURITY' && <HsmSecurityView />}
        {viewMode === 'AUDIT_LOGS' && <AuditComplianceView />}
        {viewMode === 'STANDARDS_DOCS' && <AcademyView />}
        {viewMode === 'ADMIN_SETTINGS' && <AdminView />}
      </main>

      <FunctionKeysBar />

      {/* Global Modals */}
      <LiveSimulationModal />
      <TransactionDetailModal />
    </div>
  );
};

export default function App() {
  return (
    <BankingProvider>
      <TerminalScreen />
    </BankingProvider>
  );
}
