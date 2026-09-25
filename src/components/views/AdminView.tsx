import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { BankParticipant, NostroAccount, TransferProtocol, UserRole } from '../../types/banking';
import { terminalSound } from '../../utils/soundEffects';

export const AdminView: React.FC = () => {
  const {
    banks,
    addBank,
    updateBank,
    deleteBank,
    nostroAccounts,
    addNostroAccount,
    updateNostroAccount,
    deleteNostroAccount,
    systemConfig,
    updateSystemConfig,
    users,
    addUser,
    deleteUser,
    resetAllData
  } = useBanking();

  const [activeTab, setActiveTab] = useState<'BANKS' | 'NOSTRO' | 'SYSTEM' | 'USERS'>('BANKS');

  // Bank Form State
  const [editingBic, setEditingBic] = useState<string | null>(null);
  const [bankBic, setBankBic] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCountry, setBankCountry] = useState('INDONESIA (ID)');
  const [bankCity, setBankCity] = useState('JAKARTA');
  const [bankIp, setBankIp] = useState('10.240.10.50');
  const [bankPort, setBankPort] = useState(8443);
  const [bankRoutingCode, setBankRoutingCode] = useState('014');
  const [bankAddress, setBankAddress] = useState('FINANCIAL DISTRICT TOWER 1, JAKARTA');
  const [bankClearingName, setBankClearingName] = useState('BI CLEARING CODE 014');
  const [bankLei, setBankLei] = useState('54930059CENAIDJA9910');
  const [bankProtocols, setBankProtocols] = useState<TransferProtocol[]>([
    'S2S_STP',
    'IP2IP_DIRECT',
    'SWIFT_MT103',
    'SWIFT_MT202',
    'ISO20022_PACS008'
  ]);

  // Nostro Form State
  const [nostroAccNum, setNostroAccNum] = useState('');
  const [nostroType, setNostroType] = useState<'NOSTRO' | 'VOSTRO' | 'LORO'>('NOSTRO');
  const [nostroCcy, setNostroCcy] = useState<'USD' | 'EUR' | 'IDR' | 'GBP' | 'SGD' | 'CHF' | 'JPY'>('USD');
  const [nostroCorrespBic, setNostroCorrespBic] = useState(banks[0]?.bic || '');
  const [nostroCorrespName, setNostroCorrespName] = useState(banks[0]?.name || '');
  const [nostroBal, setNostroBal] = useState<number>(50000000);

  // User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('TREASURY_OPERATOR');
  const [newOpCode, setNewOpCode] = useState('');
  const [newDept, setNewDept] = useState('Treasury Operations');
  const [newStation, setNewStation] = useState('WS-NODE-09');

  // Config State
  const [localConfig, setLocalConfig] = useState(systemConfig);

  const startEditBank = (b: BankParticipant) => {
    terminalSound.keyPress();
    setEditingBic(b.bic);
    setBankBic(b.bic);
    setBankName(b.name);
    setBankCountry(b.country);
    setBankCity(b.city);
    setBankIp(b.ip);
    setBankPort(b.port);
    setBankRoutingCode(b.routingCode || '');
    setBankAddress(b.headquartersAddress || '');
    setBankClearingName(b.clearingCodeName || '');
    setBankLei(b.leiCode || '');
    setBankProtocols(b.supportedProtocols);
  };

  const cancelEditBank = () => {
    setEditingBic(null);
    setBankBic('');
    setBankName('');
    setBankCountry('INDONESIA (ID)');
    setBankCity('JAKARTA');
    setBankIp('10.240.10.50');
    setBankPort(8443);
    setBankRoutingCode('');
    setBankAddress('');
    setBankClearingName('');
    setBankLei('');
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankBic.trim() || !bankName.trim()) return;

    terminalSound.keyPress();
    const bankData: BankParticipant = {
      bic: bankBic.trim().toUpperCase(),
      name: bankName.trim(),
      country: bankCountry.trim().toUpperCase(),
      city: bankCity.trim(),
      ip: bankIp.trim(),
      port: Number(bankPort),
      routingCode: bankRoutingCode.trim(),
      headquartersAddress: bankAddress.trim(),
      clearingCodeName: bankClearingName.trim(),
      leiCode: bankLei.trim(),
      supportedProtocols: bankProtocols
    };

    if (editingBic) {
      updateBank(editingBic, bankData);
      setEditingBic(null);
    } else {
      addBank(bankData);
    }

    cancelEditBank();
    terminalSound.success();
  };

  const handleSaveNostro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nostroAccNum.trim()) return;

    terminalSound.keyPress();
    const newAcc: NostroAccount = {
      id: 'ACC-' + Date.now().toString().slice(-4),
      accountNumber: nostroAccNum.trim(),
      type: nostroType,
      currency: nostroCcy,
      correspondentBic: nostroCorrespBic,
      correspondentName: nostroCorrespName || banks.find((b) => b.bic === nostroCorrespBic)?.name || '',
      balance: Number(nostroBal),
      availableBalance: Number(nostroBal),
      reservedBalance: 0,
      lastUpdated: new Date().toISOString().substring(0, 19).replace('T', ' ') + ' UTC'
    };

    addNostroAccount(newAcc);
    setNostroAccNum('');
    terminalSound.success();
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) return;

    terminalSound.keyPress();
    addUser({
      username: newUsername.trim().toLowerCase(),
      fullName: newFullName.trim(),
      role: newRole,
      operatorCode: newOpCode.trim() || 'OP-' + Date.now().toString().slice(-4),
      department: newDept.trim(),
      stationId: newStation.trim(),
      lastLogin: 'Never'
    });

    setNewUsername('');
    setNewFullName('');
    setNewOpCode('');
    terminalSound.success();
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    terminalSound.keyPress();
    updateSystemConfig(localConfig);
    terminalSound.success();
  };

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            CORE BANKING SYSTEM ADMINISTRATION & DIRECTORY CONSOLE
          </span>
          <span className="text-xs">DYNAMIC BIC, NOSTRO LEDGER & TOPOLOGY MANAGEMENT</span>
        </div>

        <button
          onClick={() => {
            if (confirm('RESTORE ALL CORE CLEARING CONFIGURATIONS TO VALID FACTORY DEFAULTS?')) {
              terminalSound.warning();
              resetAllData();
            }
          }}
          className="border border-red-500 text-red-500 px-2 py-0.5 hover:bg-red-500 hover:text-black cursor-pointer"
        >
          [RESTORE VALID FACTORY DEFAULTS]
        </button>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-4 border border-[#00ff00] p-1.5">
        {[
          { id: 'BANKS', label: '1. PARTICIPATING INSTITUTIONS (BICs)' },
          { id: 'NOSTRO', label: '2. NOSTRO / VOSTRO ACCOUNTS' },
          { id: 'SYSTEM', label: '3. GATEWAY HOST PARAMETERS' },
          { id: 'USERS', label: '4. OPERATOR CLEARANCE & USERS' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              terminalSound.keyPress();
              setActiveTab(tab.id as any);
            }}
            className={`px-3 py-1 cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                : 'bg-black text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Bank Participants */}
      {activeTab === 'BANKS' && (
        <div className="space-y-4">
          {/* Add / Edit Bank Form */}
          <form onSubmit={handleSaveBank} className="border border-[#00ff00] p-3 space-y-3">
            <div className="font-bold pb-1 border-b border-[#00ff00] flex justify-between">
              <span>{editingBic ? `EDIT PARTICIPANT: ${editingBic}` : 'ADD NEW BANK PARTICIPANT (BIC DIRECTORY)'}</span>
              {editingBic && (
                <button
                  type="button"
                  onClick={cancelEditBank}
                  className="border border-[#00ff00] px-2 text-[10px] hover:bg-[#00ff00] hover:text-black cursor-pointer"
                >
                  [CANCEL EDIT]
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] mb-1">&gt; SWIFT BIC / BEI (8 OR 11 CHARS):</label>
                <input
                  type="text"
                  value={bankBic}
                  onChange={(e) => setBankBic(e.target.value)}
                  placeholder="e.g. CHASUS33XXX"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] mb-1">&gt; INSTITUTION LEGAL NAME:</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. JPMORGAN CHASE BANK, N.A."
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] mb-1">&gt; COUNTRY CODE & NAME:</label>
                <input
                  type="text"
                  value={bankCountry}
                  onChange={(e) => setBankCountry(e.target.value)}
                  placeholder="UNITED STATES (US), INDONESIA (ID)"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; FINANCIAL HUB / CITY:</label>
                <input
                  type="text"
                  value={bankCity}
                  onChange={(e) => setBankCity(e.target.value)}
                  placeholder="NEW YORK, JAKARTA, FRANKFURT"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; GATEWAY IP ADDRESS:</label>
                <input
                  type="text"
                  value={bankIp}
                  onChange={(e) => setBankIp(e.target.value)}
                  placeholder="10.240.10.1 or 198.51.100.25"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; SAA / IP2IP PORT:</label>
                <input
                  type="number"
                  value={bankPort}
                  onChange={(e) => setBankPort(parseInt(e.target.value) || 8443)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] mb-1">&gt; CLEARING / ROUTING CODE (ABA/BLZ/SORT):</label>
                <input
                  type="text"
                  value={bankRoutingCode}
                  onChange={(e) => setBankRoutingCode(e.target.value)}
                  placeholder="021000021, 40-05-15, 50070010, 014"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; LEI CODE (ISO 17442):</label>
                <input
                  type="text"
                  value={bankLei}
                  onChange={(e) => setBankLei(e.target.value)}
                  placeholder="20-character LEI Identifier"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; CLEARING CHANNEL IDENTIFIER:</label>
                <input
                  type="text"
                  value={bankClearingName}
                  onChange={(e) => setBankClearingName(e.target.value)}
                  placeholder="FEDWIRE ABA / CHAPS / TARGET2"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] mb-1">&gt; HEADQUARTERS REGISTERED POSTAL ADDRESS:</label>
              <input
                type="text"
                value={bankAddress}
                onChange={(e) => setBankAddress(e.target.value)}
                placeholder="383 Madison Avenue, New York, NY 10179, USA"
                className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="border-2 border-[#00ff00] bg-[#00ff00] text-black font-bold px-4 py-1.5 text-xs hover:bg-black hover:text-[#00ff00] cursor-pointer"
              >
                {editingBic ? '[UPDATE PARTICIPANT ENTRY]' : '[+ COMMIT NEW BANK PARTICIPANT]'}
              </button>
            </div>
          </form>

          {/* Banks Directory Table */}
          <div className="border border-[#00ff00] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#00ff00] text-black font-bold">
                  <th className="p-2 border-r border-black">BIC</th>
                  <th className="p-2 border-r border-black">INSTITUTION NAME</th>
                  <th className="p-2 border-r border-black">LOCATION & ADDRESS</th>
                  <th className="p-2 border-r border-black">IP:PORT</th>
                  <th className="p-2 border-r border-black">ROUTING / LEI</th>
                  <th className="p-2 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((b) => (
                  <tr key={b.bic} className="border-b border-[#00ff00] hover:bg-[#00ff00] hover:text-black">
                    <td className="p-2 border-r border-[#00ff00] font-bold font-mono">{b.bic}</td>
                    <td className="p-2 border-r border-[#00ff00]">
                      <div className="font-bold">{b.name}</div>
                      {b.clearingCodeName && <div className="text-[10px] opacity-75">{b.clearingCodeName}</div>}
                    </td>
                    <td className="p-2 border-r border-[#00ff00]">
                      <div className="font-bold">{b.city}, {b.country}</div>
                      {b.headquartersAddress && (
                        <div className="text-[10px] opacity-75 truncate max-w-[220px]">{b.headquartersAddress}</div>
                      )}
                    </td>
                    <td className="p-2 border-r border-[#00ff00] font-mono">{b.ip}:{b.port}</td>
                    <td className="p-2 border-r border-[#00ff00] font-mono text-[10px]">
                      <div>ROUTE: {b.routingCode || 'N/A'}</div>
                      {b.leiCode && <div className="opacity-75">LEI: {b.leiCode}</div>}
                    </td>
                    <td className="p-2 text-center space-x-1">
                      <button
                        onClick={() => startEditBank(b)}
                        className="border border-[#00ff00] px-1.5 py-0.5 text-[10px] hover:bg-[#00ff00] hover:text-black cursor-pointer"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`DELETE PARTICIPANT ${b.bic}?`)) {
                            terminalSound.warning();
                            deleteBank(b.bic);
                          }
                        }}
                        className="border border-red-500 text-red-500 px-1.5 py-0.5 text-[10px] hover:bg-red-500 hover:text-black cursor-pointer"
                      >
                        DEL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Nostro / Vostro Accounts */}
      {activeTab === 'NOSTRO' && (
        <div className="space-y-4">
          <form onSubmit={handleSaveNostro} className="border border-[#00ff00] p-3 space-y-3">
            <div className="font-bold pb-1 border-b border-[#00ff00]">
              PROVISION NEW NOSTRO / VOSTRO CORRESPONDENT ACCOUNT
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] mb-1">&gt; ACCOUNT NUMBER / IBAN:</label>
                <input
                  type="text"
                  value={nostroAccNum}
                  onChange={(e) => setNostroAccNum(e.target.value)}
                  placeholder="e.g. US89-CHAS-0210-9812-4091"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; LEDGER TYPE:</label>
                <select
                  value={nostroType}
                  onChange={(e) => setNostroType(e.target.value as any)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                >
                  <option value="NOSTRO">NOSTRO (Our Account with Correspondent)</option>
                  <option value="VOSTRO">VOSTRO (Correspondent with Us)</option>
                  <option value="LORO">LORO (Third-Party Account)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; CURRENCY (ISO 4217):</label>
                <select
                  value={nostroCcy}
                  onChange={(e) => setNostroCcy(e.target.value as any)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="IDR">IDR (Rp)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="CHF">CHF (Fr)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; INITIAL OPENING BALANCE:</label>
                <input
                  type="number"
                  step="any"
                  value={nostroBal}
                  onChange={(e) => setNostroBal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] mb-1">&gt; CORRESPONDENT BIC:</label>
                <select
                  value={nostroCorrespBic}
                  onChange={(e) => {
                    setNostroCorrespBic(e.target.value);
                    const b = banks.find((item) => item.bic === e.target.value);
                    if (b) setNostroCorrespName(b.name);
                  }}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                >
                  {banks.map((b) => (
                    <option key={b.bic} value={b.bic}>
                      {b.bic} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; CORRESPONDENT INSTITUTION NAME:</label>
                <input
                  type="text"
                  value={nostroCorrespName}
                  onChange={(e) => setNostroCorrespName(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="border-2 border-[#00ff00] bg-[#00ff00] text-black font-bold px-4 py-1.5 text-xs hover:bg-black hover:text-[#00ff00] cursor-pointer"
              >
                [+ PROVISION NOSTRO/VOSTRO LEDGER ENTRY]
              </button>
            </div>
          </form>

          {/* Nostro Accounts Table with inline balance adjustment */}
          <div className="border border-[#00ff00] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#00ff00] text-black font-bold">
                  <th className="p-2 border-r border-black">ACCOUNT NUMBER</th>
                  <th className="p-2 border-r border-black">TYPE</th>
                  <th className="p-2 border-r border-black">CCY</th>
                  <th className="p-2 border-r border-black">CORRESPONDENT BIC</th>
                  <th className="p-2 border-r border-black">CORRESPONDENT</th>
                  <th className="p-2 border-r border-black text-right">AVAILABLE BALANCE</th>
                  <th className="p-2 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {nostroAccounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-[#00ff00] hover:bg-[#00ff00] hover:text-black">
                    <td className="p-2 border-r border-[#00ff00] font-bold font-mono">{acc.accountNumber}</td>
                    <td className="p-2 border-r border-[#00ff00]">{acc.type}</td>
                    <td className="p-2 border-r border-[#00ff00] font-bold">{acc.currency}</td>
                    <td className="p-2 border-r border-[#00ff00] font-mono">{acc.correspondentBic}</td>
                    <td className="p-2 border-r border-[#00ff00]">{acc.correspondentName}</td>
                    <td className="p-2 border-r border-[#00ff00] text-right font-bold">
                      {acc.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center space-x-1">
                      <button
                        onClick={() => {
                          const amtStr = prompt(
                            `Adjust balance for account ${acc.accountNumber} (${acc.currency}):`,
                            acc.availableBalance.toString()
                          );
                          if (amtStr !== null) {
                            const val = parseFloat(amtStr);
                            if (!isNaN(val)) {
                              terminalSound.keyPress();
                              updateNostroAccount(acc.id, {
                                balance: val,
                                availableBalance: val
                              });
                            }
                          }
                        }}
                        className="border border-[#00ff00] px-1.5 py-0.5 text-[10px] hover:bg-[#00ff00] hover:text-black cursor-pointer"
                      >
                        SET BAL
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`DELETE ACCOUNT ${acc.accountNumber}?`)) {
                            terminalSound.warning();
                            deleteNostroAccount(acc.id);
                          }
                        }}
                        className="border border-red-500 text-red-500 px-1.5 py-0.5 text-[10px] hover:bg-red-500 hover:text-black cursor-pointer"
                      >
                        DEL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: System Host Parameters */}
      {activeTab === 'SYSTEM' && (
        <form onSubmit={handleSaveConfig} className="border border-[#00ff00] p-4 space-y-4 max-w-2xl">
          <div className="font-bold pb-1 border-b border-[#00ff00]">
            GATEWAY DAEMON HOST CONFIGURATION
          </div>

          <div>
            <label className="block text-[11px] mb-1">&gt; GATEWAY NODE IDENTIFIER:</label>
            <input
              type="text"
              value={localConfig.gatewayNodeName}
              onChange={(e) => setLocalConfig({ ...localConfig, gatewayNodeName: e.target.value })}
              className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] mb-1">&gt; CORE HOST IP ADDRESS:</label>
              <input
                type="text"
                value={localConfig.coreBankingIp}
                onChange={(e) => setLocalConfig({ ...localConfig, coreBankingIp: e.target.value })}
                className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] mb-1">&gt; SWIFT ALLIANCE PORT:</label>
              <input
                type="number"
                value={localConfig.swiftAlliancePort}
                onChange={(e) => setLocalConfig({ ...localConfig, swiftAlliancePort: parseInt(e.target.value) || 8443 })}
                className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] mb-1">&gt; AML SCREENING THRESHOLD AMOUNT (USD EQUIV):</label>
            <input
              type="number"
              value={localConfig.amlThresholdAmount}
              onChange={(e) => setLocalConfig({ ...localConfig, amlThresholdAmount: parseFloat(e.target.value) || 500000 })}
              className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
              required
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-[#00ff00]">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.autoSettleStp}
                onChange={(e) => setLocalConfig({ ...localConfig, autoSettleStp: e.target.checked })}
                className="accent-[#00ff00]"
              />
              <span className="font-bold">ENABLE STRAIGHT-THROUGH PROCESSING (AUTO-SETTLE STP)</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.strictHsmSignatures}
                onChange={(e) => setLocalConfig({ ...localConfig, strictHsmSignatures: e.target.checked })}
                className="accent-[#00ff00]"
              />
              <span className="font-bold">ENFORCE STRICT HARDWARE HSM RSA-4096 SIGNATURES</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="border-2 border-[#00ff00] bg-[#00ff00] text-black font-bold px-4 py-2 text-xs hover:bg-black hover:text-[#00ff00] cursor-pointer"
            >
              [ COMMIT HOST PARAMETER CHANGES ]
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Operators & Users */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <form onSubmit={handleSaveUser} className="border border-[#00ff00] p-3 space-y-3">
            <div className="font-bold pb-1 border-b border-[#00ff00]">
              PROVISION NEW OPERATOR PROFILE & SECURITY CLEARANCE
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] mb-1">&gt; USERNAME:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. jdoe"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; FULL OPERATOR NAME & TITLE:</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. John Doe, Senior Treasury Analyst"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; SECURITY ROLE:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                >
                  <option value="SYSTEM_ADMIN">SYSTEM_ADMIN (Full Root Privileges)</option>
                  <option value="TREASURY_OPERATOR">TREASURY_OPERATOR (Wire Execution)</option>
                  <option value="COMPLIANCE_OFFICER">COMPLIANCE_OFFICER (AML & Holds)</option>
                  <option value="AUDITOR">AUDITOR (Read-Only Inspection)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] mb-1">&gt; OPERATOR CODE (e.g. OP-TRS-9001):</label>
                <input
                  type="text"
                  value={newOpCode}
                  onChange={(e) => setNewOpCode(e.target.value)}
                  placeholder="OP-TRS-9001"
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; DEPARTMENT:</label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; STATION ID:</label>
                <input
                  type="text"
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="border-2 border-[#00ff00] bg-[#00ff00] text-black font-bold px-4 py-1.5 text-xs hover:bg-black hover:text-[#00ff00] cursor-pointer"
              >
                [+ PROVISION OPERATOR PROFILE]
              </button>
            </div>
          </form>

          {/* User Table */}
          <div className="border border-[#00ff00] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#00ff00] text-black font-bold">
                  <th className="p-2 border-r border-black">USERNAME</th>
                  <th className="p-2 border-r border-black">OPERATOR CODE</th>
                  <th className="p-2 border-r border-black">FULL NAME</th>
                  <th className="p-2 border-r border-black">ROLE</th>
                  <th className="p-2 border-r border-black">STATION ID</th>
                  <th className="p-2 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#00ff00] hover:bg-[#00ff00] hover:text-black">
                    <td className="p-2 border-r border-[#00ff00] font-bold font-mono">{u.username}</td>
                    <td className="p-2 border-r border-[#00ff00] font-mono">{u.operatorCode}</td>
                    <td className="p-2 border-r border-[#00ff00]">{u.fullName}</td>
                    <td className="p-2 border-r border-[#00ff00] font-bold">{u.role}</td>
                    <td className="p-2 border-r border-[#00ff00] font-mono">{u.stationId}</td>
                    <td className="p-2 text-center">
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`REVOKE USER ${u.username}?`)) {
                              terminalSound.warning();
                              deleteUser(u.id);
                            }
                          }}
                          className="border border-red-500 text-red-500 px-1.5 py-0.5 text-[10px] hover:bg-red-500 hover:text-black cursor-pointer"
                        >
                          REVOKE
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
