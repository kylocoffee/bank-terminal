import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { terminalSound } from '../../utils/soundEffects';

export const AuditComplianceView: React.FC = () => {
  const { transactions, releaseComplianceHold, setSelectedTransaction } = useBanking();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = transactions.filter((t) => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    return true;
  });

  const holdCount = transactions.filter((t) => t.status === 'COMPLIANCE_HOLD').length;

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            AUDIT LOGS & AML SANCTIONS COMPLIANCE DESK
          </span>
          <span className="text-xs">FINANCIAL CRIME SCREENING & DISPATCH HISTORY</span>
        </div>

        {holdCount > 0 && (
          <span className="border-2 border-red-500 bg-black text-red-500 px-2 py-1 font-bold animate-pulse">
            [!] {holdCount} TRANSACTION(S) ON COMPLIANCE HOLD
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4 border border-[#00ff00] p-2">
        <span className="font-bold">STATUS FILTER:</span>
        {['ALL', 'SETTLED', 'COMPLIANCE_HOLD', 'QUEUED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => {
              terminalSound.keyPress();
              setFilterStatus(st);
            }}
            className={`px-2 py-0.5 cursor-pointer border ${
              filterStatus === st
                ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                : 'bg-black text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
            }`}
          >
            {st} ({st === 'ALL' ? transactions.length : transactions.filter((t) => t.status === st).length})
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="border border-[#00ff00] overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#00ff00] text-black font-bold">
              <th className="p-2 border-r border-black">REF IDENTIFIER</th>
              <th className="p-2 border-r border-black">TIMESTAMP</th>
              <th className="p-2 border-r border-black">PROTOCOL</th>
              <th className="p-2 border-r border-black">ORIGINATOR</th>
              <th className="p-2 border-r border-black">BENEFICIARY</th>
              <th className="p-2 border-r border-black text-right">AMOUNT</th>
              <th className="p-2 border-r border-black text-center">STATUS</th>
              <th className="p-2 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trx) => {
              const isHold = trx.status === 'COMPLIANCE_HOLD';
              return (
                <tr
                  key={trx.id}
                  className={`border-b border-[#00ff00] hover:bg-[#00ff00] hover:text-black ${
                    isHold ? 'bg-red-950/40 text-red-400' : ''
                  }`}
                >
                  <td className="p-2 border-r border-[#00ff00] font-bold">{trx.id}</td>
                  <td className="p-2 border-r border-[#00ff00] opacity-80">{trx.timestamp}</td>
                  <td className="p-2 border-r border-[#00ff00]">{trx.protocol}</td>
                  <td className="p-2 border-r border-[#00ff00] truncate max-w-[150px]">
                    <div className="font-bold">{trx.senderBank.bic}</div>
                    <div className="text-[10px] opacity-75">{trx.senderName}</div>
                  </td>
                  <td className="p-2 border-r border-[#00ff00] truncate max-w-[150px]">
                    <div className="font-bold">{trx.receiverBank.bic}</div>
                    <div className="text-[10px] opacity-75">{trx.receiverName}</div>
                  </td>
                  <td className="p-2 border-r border-[#00ff00] text-right font-bold">
                    {trx.currency} {trx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 border-r border-[#00ff00] text-center font-bold">
                    [{trx.status}]
                  </td>
                  <td className="p-2 text-center space-x-1">
                    <button
                      onClick={() => {
                        terminalSound.keyPress();
                        setSelectedTransaction(trx);
                      }}
                      className="border border-[#00ff00] px-1.5 py-0.5 text-[10px] hover:bg-[#00ff00] hover:text-black cursor-pointer"
                    >
                      DETAILS
                    </button>
                    {isHold && (
                      <button
                        onClick={() => {
                          terminalSound.success();
                          releaseComplianceHold(trx.id);
                        }}
                        className="border border-green-500 bg-green-500 text-black font-bold px-1.5 py-0.5 text-[10px] cursor-pointer"
                      >
                        [RELEASE]
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[10px] opacity-80">
        All entries are immutable and cryptographically chained to prevent alteration under banking audit compliance mandates.
      </div>
    </div>
  );
};
