import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { terminalSound } from '../../utils/soundEffects';

export const LoginView: React.FC = () => {
  const { login, users } = useBanking();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [stationId, setStationId] = useState('WS-BRI-NODE-SUDIRMAN-01');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('ERROR: USERNAME IS MANDATORY');
      terminalSound.warning();
      return;
    }

    const success = login(username.trim(), password);
    if (!success) {
      setErrorMsg('AUTHENTICATION FAILED: INVALID OPERATOR CREDENTIALS');
      terminalSound.warning();
    }
  };

  const handleQuickSelect = (user: typeof users[0]) => {
    setUsername(user.username);
    setPassword('admin123');
    setStationId(user.stationId);
    terminalSound.keyPress();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black text-[#00ff00]">
      <div className="w-full max-w-2xl border-2 border-[#00ff00] p-6 bg-black">
        {/* Header ASCII Frame */}
        <div className="text-center border-b border-[#00ff00] pb-4 mb-6">
          <pre className="text-[10px] leading-tight text-[#00ff00] font-bold">
{`======================================================================
         PT BANK RAKYAT INDONESIA (PERSERO) TBK
     INTERNATIONAL TREASURY & INTERBANK CLEARING SYSTEM
         (BRI-ITS / SAA CORE PROTOCOL DAEMON v8.4.2)
======================================================================`}
          </pre>
          <div className="mt-2 text-xs font-bold bg-[#00ff00] text-black py-1">
            BANK BRI SECURE ACCESS AUTHORIZATION REQUIRED - RESTRICTED TERMINAL
          </div>
        </div>

        {errorMsg && (
          <div className="border border-red-500 bg-black text-red-500 p-2 text-xs font-bold mb-4">
            [!] {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">
              &gt; WORKSTATION IDENTIFIER (STATION_ID):
            </label>
            <input
              type="text"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-2 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              &gt; OPERATOR / USERNAME:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin, treasury, compliance"
              className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-2 text-xs focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">
              &gt; CRYPTOGRAPHIC PASSPHRASE / TOKEN:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter security passphrase"
              className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-2 text-xs focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full border-2 border-[#00ff00] bg-[#00ff00] text-black font-bold py-2 text-xs hover:bg-black hover:text-[#00ff00] cursor-pointer"
            >
              [ INITIALIZE SECURE OPERATOR SESSION ]
            </button>
          </div>
        </form>

        {/* Quick Operator Selection */}
        <div className="mt-8 border-t border-[#00ff00] pt-4">
          <div className="text-[11px] font-bold mb-2">
            SELECT OPERATOR PROFILE:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickSelect(u)}
                className={`border border-[#00ff00] p-2 text-left text-xs cursor-pointer ${
                  username === u.username
                    ? 'bg-[#00ff00] text-black font-bold'
                    : 'bg-black text-[#00ff00] hover:bg-[#00ff00] hover:text-black'
                }`}
              >
                <div className="font-bold">{u.username.toUpperCase()}</div>
                <div className="text-[10px] opacity-80">{u.operatorCode}</div>
                <div className="text-[9px] opacity-70 truncate">{u.role}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-[10px] text-center opacity-75">
          UNAUTHORIZED ACCESS TO THIS CLEARING TERMINAL IS STRICTLY PROHIBITED AND MONITORED UNDER APPLICABLE FINANCIAL REGULATIONS.
        </div>
      </div>
    </div>
  );
};
