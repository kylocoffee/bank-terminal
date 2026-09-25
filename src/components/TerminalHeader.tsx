import React, { useState, useEffect } from 'react';
import { useBanking } from '../context/BankingContext';
import { TerminalViewMode } from '../types/banking';
import { terminalSound } from '../utils/soundEffects';

export const TerminalHeader: React.FC = () => {
  const { 
    currentUser, 
    logout, 
    viewMode, 
    setViewMode, 
    audioEnabled, 
    setAudioEnabled,
    hsmStatus,
    systemConfig
  } = useBanking();

  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: TerminalViewMode; label: string; key: string }[] = [
    { id: 'CLI', label: 'COMMAND PROMPT', key: 'F1' },
    { id: 'S2S_FORM', label: 'S2S STRAIGHT-THROUGH', key: 'F2' },
    { id: 'IP2IP_FORM', label: 'IP2IP SOCKET TUNNEL', key: 'F3' },
    { id: 'NOSTRO_VOSTRO', label: 'NOSTRO-VOSTRO LEDGER', key: 'F4' },
    { id: 'GPI_TRACKER', label: 'SWIFT GPI TRACKER', key: 'F5' },
    { id: 'MESSAGE_DECODER', label: 'FIN/ISO DECODER', key: 'F6' },
    { id: 'HSM_SECURITY', label: 'HSM CRYPTOGRAPHY', key: 'F7' },
    { id: 'AUDIT_LOGS', label: 'AUDIT & AML QUEUE', key: 'F8' },
    { id: 'STANDARDS_DOCS', label: 'SPECIFICATIONS', key: 'F9' },
    { id: 'ADMIN_SETTINGS', label: 'SYSTEM ADMIN', key: 'F10' }
  ];

  return (
    <header className="bg-black border-b-2 border-[#00ff00] text-[#00ff00] text-xs select-none">
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 border-b border-[#00ff00] gap-2">
        <div className="flex items-center space-x-3">
          <span className="font-bold tracking-wider bg-[#00ff00] text-black px-1.5 py-0.5">
            [ BANK BRI - SAA CORE WORKSTATION ]
          </span>
          <span className="hidden sm:inline">NODE: {systemConfig.gatewayNodeName}</span>
          <span className="hidden md:inline">BIC: BBBAIDJAXXX</span>
          <span className="hidden lg:inline">HOST: {systemConfig.coreBankingIp}:{systemConfig.swiftAlliancePort}</span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="bg-black border border-[#00ff00] px-1.5 py-0.5">
            HSM: {hsmStatus.status === 'ONLINE_ACTIVE' ? 'ONLINE (ACTIVE)' : hsmStatus.status}
          </span>
          <span className="font-mono">{timeStr}</span>
          
          <button
            onClick={() => {
              const next = !audioEnabled;
              setAudioEnabled(next);
              if (next) terminalSound.keyPress();
            }}
            className="border border-[#00ff00] px-1.5 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
            title="Toggle Audio Feedback"
          >
            AUDIO: {audioEnabled ? 'ON' : 'OFF'}
          </button>

          {currentUser ? (
            <div className="flex items-center space-x-2">
              <span className="bg-[#00ff00] text-black px-1.5 py-0.5 font-bold">
                {currentUser.operatorCode} [{currentUser.role}]
              </span>
              <button
                onClick={() => {
                  terminalSound.warning();
                  logout();
                }}
                className="border border-[#00ff00] px-1.5 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
              >
                [EXIT / LOCK]
              </button>
            </div>
          ) : (
            <button
              onClick={() => setViewMode('LOGIN')}
              className="border border-[#00ff00] bg-[#00ff00] text-black font-bold px-2 py-0.5 cursor-pointer"
            >
              [LOGIN]
            </button>
          )}
        </div>
      </div>

      {/* Navigation Function Bar */}
      {currentUser && (
        <div className="flex flex-wrap items-center gap-1 p-1 bg-black overflow-x-auto">
          {navItems.map((item) => {
            const isActive = viewMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  terminalSound.keyPress();
                  setViewMode(item.id);
                }}
                className={`px-2 py-1 text-[11px] whitespace-nowrap cursor-pointer transition-none border ${
                  isActive
                    ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                    : 'bg-black text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
                }`}
              >
                [{item.key}] {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
