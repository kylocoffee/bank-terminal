import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { terminalSound } from '../../utils/soundEffects';
import { generateSwiftMT103, generateSwiftMT202, generateIso20022Pacs008, generateIp2IpHexFrame } from '../../utils/mtFormatter';

export const TransactionDetailModal: React.FC = () => {
  const { selectedTransaction, setSelectedTransaction } = useBanking();
  const [activeTab, setActiveTab] = useState<'ADVICE' | 'RAW_MT' | 'ISO_XML' | 'HEX_FRAME' | 'LOGS'>('ADVICE');
  const [copied, setCopied] = useState(false);

  if (!selectedTransaction) return null;

  const trx = selectedTransaction;
  const mt103 = trx.rawMTBlock || (trx.protocol === 'SWIFT_MT202' ? generateSwiftMT202(trx) : generateSwiftMT103(trx));
  const isoPacs = trx.rawISOPacs || generateIso20022Pacs008(trx);
  const hexDump = trx.rawHexDump || generateIp2IpHexFrame(trx);

  const handleCopy = (text: string) => {
    terminalSound.keyPress();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    terminalSound.keyPress();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-black border-2 border-[#00ff00] p-4 text-[#00ff00] font-mono text-xs flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#00ff00] pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="bg-[#00ff00] text-black font-bold px-2 py-0.5">
              SETTLEMENT CONFIRMATION ADVICE
            </span>
            <span className="font-bold">REF: {trx.id}</span>
          </div>

          <button
            onClick={() => {
              terminalSound.keyPress();
              setSelectedTransaction(null);
            }}
            className="border border-[#00ff00] px-2 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer font-bold"
          >
            [X CLOSE]
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00ff00] pb-2 mb-3">
          <div className="flex space-x-1">
            {[
              { id: 'ADVICE', label: 'OFFICIAL CLEARING SLIP' },
              { id: 'RAW_MT', label: 'SWIFT MT103/202' },
              { id: 'ISO_XML', label: 'ISO20022 XML' },
              { id: 'HEX_FRAME', label: 'SOCKET HEX FRAME' },
              { id: 'LOGS', label: 'EXECUTION AUDIT LOGS' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  terminalSound.keyPress();
                  setActiveTab(tab.id as any);
                }}
                className={`px-2 py-1 text-xs cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                    : 'bg-black text-[#00ff00] border-[#00ff00] hover:bg-[#00ff00] hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleCopy(activeTab === 'ADVICE' ? mt103 : activeTab === 'ISO_XML' ? isoPacs : hexDump)}
              className="border border-[#00ff00] px-2 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
            >
              {copied ? '[COPIED TO CLIPBOARD]' : '[COPY CONTENT]'}
            </button>
            <button
              onClick={handlePrint}
              className="border border-[#00ff00] px-2 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
            >
              [PRINT ADVICE]
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-2 border border-[#00ff00] bg-black">
          {activeTab === 'ADVICE' && (
            <div className="space-y-4 text-xs leading-relaxed max-w-3xl mx-auto p-4 border border-[#00ff00]">
              {/* Slip Header */}
              <div className="text-center border-b border-[#00ff00] pb-3">
                <div className="font-bold text-sm tracking-wider">
                  GLOBAL INTERBANK FUNDS TRANSFER ADVICE
                </div>
                <div className="text-[10px] opacity-80 mt-1">
                  CLEARING NETWORK: GB-ITS / SAA CORE HOST | UETR: {trx.uetr}
                </div>
                <div className="text-[10px] mt-1 font-bold">
                  TRANSACTION STATUS: [{trx.status}]
                </div>
              </div>

              {/* Reference & Financials */}
              <div className="grid grid-cols-2 gap-3 border-b border-[#00ff00] pb-3">
                <div>
                  <div className="opacity-75 text-[10px]">TRANSACTION REFERENCE (:20):</div>
                  <div className="font-bold text-sm">{trx.id}</div>
                </div>
                <div>
                  <div className="opacity-75 text-[10px]">SETTLEMENT AMOUNT (:32A):</div>
                  <div className="font-bold text-sm">
                    {trx.currency} {trx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="opacity-75 text-[10px]">EXECUTION TIMESTAMP:</div>
                  <div>{trx.timestamp}</div>
                </div>
                <div>
                  <div className="opacity-75 text-[10px]">SETTLEMENT PROTOCOL:</div>
                  <div>{trx.protocol}</div>
                </div>
              </div>

              {/* Originating Party */}
              <div className="border-b border-[#00ff00] pb-3">
                <div className="font-bold text-[11px] underline mb-1">
                  ORDERING CUSTOMER & DEBIT INSTITUTION (:50K / :52A)
                </div>
                <div>INSTITUTION: {trx.senderBank.bic} - {trx.senderBank.name} ({trx.senderBank.country})</div>
                <div>ACCOUNT NUMBER: {trx.senderAccount}</div>
                <div>ORDERING ENTITY: {trx.senderName}</div>
                {trx.senderAddress && <div>ADDRESS: {trx.senderAddress}</div>}
              </div>

              {/* Intermediary Party */}
              {trx.intermediaryBank && (
                <div className="border-b border-[#00ff00] pb-3">
                  <div className="font-bold text-[11px] underline mb-1">
                    INTERMEDIARY REIMBURSEMENT INSTITUTION (:56A)
                  </div>
                  <div>INSTITUTION: {trx.intermediaryBank.bic} - {trx.intermediaryBank.name}</div>
                  <div>NOSTRO LEDGER STATUS: DEBITED & CONFIRMED</div>
                </div>
              )}

              {/* Beneficiary Party */}
              <div className="border-b border-[#00ff00] pb-3">
                <div className="font-bold text-[11px] underline mb-1">
                  BENEFICIARY INSTITUTION & RECIPIENT (:57A / :59)
                </div>
                <div>INSTITUTION: {trx.receiverBank.bic} - {trx.receiverBank.name} ({trx.receiverBank.country})</div>
                <div>CREDIT ACCOUNT / IBAN: {trx.receiverAccount}</div>
                <div>BENEFICIARY NAME: {trx.receiverName}</div>
                {trx.receiverAddress && <div>ADDRESS: {trx.receiverAddress}</div>}
              </div>

              {/* Charges & Remittance */}
              <div className="border-b border-[#00ff00] pb-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="opacity-75 text-[10px]">CHARGE DETAILS (:71A):</div>
                  <div className="font-bold">{trx.charges}</div>
                </div>
                <div>
                  <div className="opacity-75 text-[10px]">REMITTANCE INFORMATION (:70):</div>
                  <div className="font-bold">{trx.remittanceInfo}</div>
                </div>
              </div>

              {/* Cryptography & Authentication */}
              <div className="pt-1 text-[10px] space-y-1">
                <div className="font-bold">HARDWARE CRYPTOGRAPHIC VERIFICATION:</div>
                <div>BLOCK 5 MAC DIGEST: {trx.macDigest}</div>
                <div>DIGITAL SIGNATURE: {trx.hsmSignature}</div>
                <div>ISSUED BY OPERATOR: {trx.operatorId || 'OP-SYS-9901'}</div>
              </div>
            </div>
          )}

          {activeTab === 'RAW_MT' && (
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed select-all">
              {mt103}
            </pre>
          )}

          {activeTab === 'ISO_XML' && (
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed select-all">
              {isoPacs}
            </pre>
          )}

          {activeTab === 'HEX_FRAME' && (
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed select-all">
              {hexDump}
            </pre>
          )}

          {activeTab === 'LOGS' && (
            <div className="space-y-2">
              <div className="font-bold border-b border-[#00ff00] pb-1">
                CHRONOLOGICAL GATEWAY EXECUTION LOG:
              </div>
              {trx.executionLogs.map((log, idx) => (
                <div key={idx} className="border border-[#00ff00] p-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold">[{log.stage}]</span>
                    <span>[{log.status}] {log.timestamp}</span>
                  </div>
                  <div className="text-[11px] mt-1">{log.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
