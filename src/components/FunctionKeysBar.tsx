import React, { useEffect } from 'react';
import { useBanking } from '../context/BankingContext';
import { TerminalViewMode } from '../types/banking';
import { terminalSound } from '../utils/soundEffects';

export const FunctionKeysBar: React.FC = () => {
  const { viewMode, setViewMode, currentUser } = useBanking();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Map F1 - F10
      const keyMap: Record<string, TerminalViewMode> = {
        F1: 'CLI',
        F2: 'S2S_FORM',
        F3: 'IP2IP_FORM',
        F4: 'NOSTRO_VOSTRO',
        F5: 'GPI_TRACKER',
        F6: 'MESSAGE_DECODER',
        F7: 'HSM_SECURITY',
        F8: 'AUDIT_LOGS',
        F9: 'STANDARDS_DOCS',
        F10: 'ADMIN_SETTINGS'
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        terminalSound.keyPress();
        setViewMode(keyMap[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setViewMode]);

  const fKeys = [
    { key: 'F1', label: 'CLI', mode: 'CLI' as TerminalViewMode },
    { key: 'F2', label: 'S2S-STP', mode: 'S2S_FORM' as TerminalViewMode },
    { key: 'F3', label: 'IP2IP', mode: 'IP2IP_FORM' as TerminalViewMode },
    { key: 'F4', label: 'NOSTRO', mode: 'NOSTRO_VOSTRO' as TerminalViewMode },
    { key: 'F5', label: 'GPI-TRK', mode: 'GPI_TRACKER' as TerminalViewMode },
    { key: 'F6', label: 'DECODE', mode: 'MESSAGE_DECODER' as TerminalViewMode },
    { key: 'F7', label: 'HSM-KEY', mode: 'HSM_SECURITY' as TerminalViewMode },
    { key: 'F8', label: 'AUDIT', mode: 'AUDIT_LOGS' as TerminalViewMode },
    { key: 'F9', label: 'SPECS', mode: 'STANDARDS_DOCS' as TerminalViewMode },
    { key: 'F10', label: 'ADMIN', mode: 'ADMIN_SETTINGS' as TerminalViewMode },
  ];

  if (!currentUser) return null;

  return (
    <footer className="bg-black border-t-2 border-[#00ff00] text-[#00ff00] py-1 px-2 text-xs select-none">
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 text-center">
        {fKeys.map((f) => {
          const isActive = viewMode === f.mode;
          return (
            <button
              key={f.key}
              onClick={() => {
                terminalSound.keyPress();
                setViewMode(f.mode);
              }}
              className={`border py-0.5 text-[11px] truncate cursor-pointer transition-none ${
                isActive
                  ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                  : 'bg-black text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
              }`}
            >
              <span className="font-bold">{f.key}:</span> {f.label}
            </button>
          );
        })}
      </div>
    </footer>
  );
};
