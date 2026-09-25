import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { terminalSound } from '../../utils/soundEffects';

export const GpiTrackerView: React.FC = () => {
  const { transactions, setSelectedTransaction } = useBanking();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUetr, setSelectedUetr] = useState<string>(
    transactions[0]?.uetr || ''
  );

  const currentTrx = transactions.find((t) => t.uetr === selectedUetr) || transactions[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    terminalSound.keyPress();
    const query = searchQuery.trim().toLowerCase();
    const found = transactions.find(
      (t) =>
        t.uetr.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.senderName.toLowerCase().includes(query) ||
        t.receiverName.toLowerCase().includes(query)
    );
    if (found) {
      setSelectedUetr(found.uetr);
    }
  };

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            SWIFT GPI & UETR TRANSACTION TRACKER
          </span>
          <span className="text-xs">END-TO-END WIRE VISIBILITY & SETTLEMENT AUDIT</span>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4 border border-[#00ff00] p-2">
        <span className="font-bold py-1">&gt; SEARCH UETR / REF:</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="e.g. 4f92d410-b183-4ec3-a5c2-f19b889502ab or S2S-2026-98124"
          className="flex-1 bg-black text-[#00ff00] border border-[#00ff00] px-2 py-1 text-xs"
        />
        <button
          type="submit"
          className="border border-[#00ff00] bg-[#00ff00] text-black font-bold px-3 py-1 cursor-pointer hover:bg-black hover:text-[#00ff00]"
        >
          [EXECUTE QUERY]
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left List of Recent Transactions */}
        <div className="lg:col-span-5 border border-[#00ff00] p-3 flex flex-col">
          <div className="font-bold pb-1 border-b border-[#00ff00] mb-2">
            TRANSACTION LOG DISPATCHES ({transactions.length})
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[500px]">
            {transactions.map((trx) => {
              const isSelected = trx.uetr === selectedUetr;
              return (
                <div
                  key={trx.id}
                  onClick={() => {
                    terminalSound.keyPress();
                    setSelectedUetr(trx.uetr);
                  }}
                  className={`border border-[#00ff00] p-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#00ff00] text-black font-bold'
                      : 'bg-black text-[#00ff00] hover:bg-[#00ff00] hover:text-black'
                  }`}
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span>{trx.id}</span>
                    <span>[{trx.status}]</span>
                  </div>
                  <div className="text-[10px] truncate mt-1">UETR: {trx.uetr}</div>
                  <div className="flex justify-between text-[10px] mt-1 opacity-90">
                    <span>{trx.senderBank.bic} &gt; {trx.receiverBank.bic}</span>
                    <span>{trx.currency} {trx.amount.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        {currentTrx && (
          <div className="lg:col-span-7 border border-[#00ff00] p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#00ff00]">
              <span className="font-bold text-sm">TRANSACTION: {currentTrx.id}</span>
              <button
                onClick={() => {
                  terminalSound.keyPress();
                  setSelectedTransaction(currentTrx);
                }}
                className="border border-[#00ff00] px-2 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
              >
                [VIEW FULL CLEARING ADVICE]
              </button>
            </div>

            {/* Core Info */}
            <div className="grid grid-cols-2 gap-2 border border-[#00ff00] p-2">
              <div>
                <span className="opacity-75">UETR (TAG 121):</span>
                <div className="font-bold select-all">{currentTrx.uetr}</div>
              </div>
              <div>
                <span className="opacity-75">STATUS:</span>
                <div className="font-bold text-sm">[{currentTrx.status}]</div>
              </div>
              <div>
                <span className="opacity-75">AMOUNT & CCY:</span>
                <div className="font-bold">
                  {currentTrx.currency} {currentTrx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="opacity-75">PROTOCOL:</span>
                <div className="font-bold">{currentTrx.protocol}</div>
              </div>
            </div>

            {/* Hop Timeline */}
            <div className="border border-[#00ff00] p-3 space-y-3">
              <div className="font-bold border-b border-[#00ff00] pb-1">
                SWIFT GPI NODE ROUTING & HOP CHRONOLOGY:
              </div>

              {/* Hop 1 */}
              <div className="border-l-2 border-[#00ff00] pl-3 relative">
                <div className="font-bold text-[11px]">
                  [HOP 1] ORIGINATING INSTITUTION: {currentTrx.senderBank.bic} ({currentTrx.senderBank.name})
                </div>
                <div className="text-[10px] opacity-80">
                  DEBIT ACCOUNT: {currentTrx.senderAccount} | ENTITY: {currentTrx.senderName}
                </div>
                <div className="text-[10px] mt-0.5 font-bold">
                  STATUS: COMPLETED (PACS.008 INGESTION) - MAC VERIFIED
                </div>
              </div>

              {/* Hop 2 Intermediary */}
              {currentTrx.intermediaryBank && (
                <div className="border-l-2 border-[#00ff00] pl-3 relative">
                  <div className="font-bold text-[11px]">
                    [HOP 2] INTERMEDIARY CORRESPONDENT: {currentTrx.intermediaryBank.bic} ({currentTrx.intermediaryBank.name})
                  </div>
                  <div className="text-[10px] opacity-80">
                    NOSTRO/VOSTRO DUAL ENTRY BOOKING RECONCILED
                  </div>
                  <div className="text-[10px] mt-0.5 font-bold">
                    STATUS: ACSP (ACCEPTED SETTLEMENT IN PROCESS)
                  </div>
                </div>
              )}

              {/* Hop 3 Beneficiary */}
              <div className="border-l-2 border-[#00ff00] pl-3 relative">
                <div className="font-bold text-[11px]">
                  [HOP 3] BENEFICIARY INSTITUTION: {currentTrx.receiverBank.bic} ({currentTrx.receiverBank.name})
                </div>
                <div className="text-[10px] opacity-80">
                  CREDIT IBAN: {currentTrx.receiverAccount} | BENEFICIARY: {currentTrx.receiverName}
                </div>
                <div className="text-[10px] mt-0.5 font-bold">
                  STATUS: {currentTrx.status === 'SETTLED' ? 'ACCC (ACCEPTED & CREDITED TO BENEFICIARY ACCOUNT)' : currentTrx.status}
                </div>
              </div>
            </div>

            {/* Execution Logs */}
            <div className="border border-[#00ff00] p-2">
              <div className="font-bold text-[10px] pb-1 border-b border-[#00ff00] mb-1">
                GATEWAY EXECUTION AUDIT TRAIL:
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto text-[10px]">
                {currentTrx.executionLogs.map((log, i) => (
                  <div key={i} className="flex space-x-2">
                    <span className="opacity-75">[{log.timestamp}]</span>
                    <span className="font-bold">[{log.stage}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
