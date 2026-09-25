import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';

export const NostroVostroView: React.FC = () => {
  const { nostroAccounts, setViewMode } = useBanking();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCurrency, setFilterCurrency] = useState<string>('ALL');

  const filtered = nostroAccounts.filter((acc) => {
    if (filterType !== 'ALL' && acc.type !== filterType) return false;
    if (filterCurrency !== 'ALL' && acc.currency !== filterCurrency) return false;
    return true;
  });

  const totalUSD = nostroAccounts
    .filter((a) => a.currency === 'USD')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalEUR = nostroAccounts
    .filter((a) => a.currency === 'EUR')
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      {/* Header */}
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            NOSTRO & VOSTRO CORRESPONDENT LEDGER MATRIX
          </span>
          <span className="text-xs">REAL-TIME LIQUIDITY & MIRROR LEDGER POSITION</span>
        </div>

        <button
          onClick={() => setViewMode('ADMIN_SETTINGS')}
          className="border border-[#00ff00] px-2 py-1 hover:bg-[#00ff00] hover:text-black cursor-pointer"
        >
          [+ MANAGE / ADJUST ACCOUNTS IN ADMIN]
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="border border-[#00ff00] p-3 bg-black">
          <div className="text-[10px] opacity-80">AGGREGATE USD NOSTRO POSITION:</div>
          <div className="text-base font-bold mt-1">
            ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] mt-1">RESERVE RATIO: OPTIMAL (100%)</div>
        </div>

        <div className="border border-[#00ff00] p-3 bg-black">
          <div className="text-[10px] opacity-80">AGGREGATE EUR NOSTRO POSITION:</div>
          <div className="text-base font-bold mt-1">
            €{totalEUR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] mt-1">TARGET CORRESPONDENT: DEUTDEDDXXX</div>
        </div>

        <div className="border border-[#00ff00] p-3 bg-black">
          <div className="text-[10px] opacity-80">ACTIVE CORRESPONDENT NODES:</div>
          <div className="text-base font-bold mt-1">{nostroAccounts.length} ACCOUNTS</div>
          <div className="text-[10px] mt-1">RECONCILIATION: BALANCED</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 mb-3 border border-[#00ff00] p-2">
        <div className="flex items-center space-x-2">
          <span className="font-bold">TYPE FILTER:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-black text-[#00ff00] border border-[#00ff00] p-1 text-xs"
          >
            <option value="ALL">ALL LEDGER TYPES</option>
            <option value="NOSTRO">NOSTRO (Our Account at Correspondent)</option>
            <option value="VOSTRO">VOSTRO (Correspondent Account with Us)</option>
            <option value="LORO">LORO (Third-Party Clearing Account)</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-bold">CURRENCY:</span>
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="bg-black text-[#00ff00] border border-[#00ff00] p-1 text-xs"
          >
            <option value="ALL">ALL CURRENCIES</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="IDR">IDR</option>
            <option value="GBP">GBP</option>
            <option value="SGD">SGD</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
      </div>

      {/* Nostro Table */}
      <div className="border border-[#00ff00] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#00ff00] text-black font-bold">
              <th className="p-2 border-r border-black">ACCOUNT NUMBER</th>
              <th className="p-2 border-r border-black">TYPE</th>
              <th className="p-2 border-r border-black">CCY</th>
              <th className="p-2 border-r border-black">CORRESPONDENT BIC</th>
              <th className="p-2 border-r border-black">CORRESPONDENT INSTITUTION</th>
              <th className="p-2 border-r border-black text-right">AVAILABLE BALANCE</th>
              <th className="p-2 border-r border-black text-right">RESERVED</th>
              <th className="p-2 text-right">BOOK BALANCE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((acc) => (
              <tr key={acc.id} className="border-b border-[#00ff00] hover:bg-[#00ff00] hover:text-black">
                <td className="p-2 border-r border-[#00ff00] font-bold">{acc.accountNumber}</td>
                <td className="p-2 border-r border-[#00ff00]">{acc.type}</td>
                <td className="p-2 border-r border-[#00ff00] font-bold">{acc.currency}</td>
                <td className="p-2 border-r border-[#00ff00] font-mono">{acc.correspondentBic}</td>
                <td className="p-2 border-r border-[#00ff00]">{acc.correspondentName}</td>
                <td className="p-2 border-r border-[#00ff00] text-right font-bold">
                  {acc.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2 border-r border-[#00ff00] text-right opacity-80">
                  {acc.reservedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-2 text-right font-bold">
                  {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[10px] opacity-80 border-t border-[#00ff00] pt-2">
        MT940/MT950 Mirror Statement automatic end-of-day reconciliation: ALL ACCOUNTS BALANCED.
      </div>
    </div>
  );
};
