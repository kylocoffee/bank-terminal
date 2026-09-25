import React from 'react';
import { useBanking } from '../../context/BankingContext';
import { terminalSound } from '../../utils/soundEffects';

export const LiveSimulationModal: React.FC = () => {
  const { activeProcessing, closeProcessing, setSelectedTransaction } = useBanking();

  if (!activeProcessing || !activeProcessing.isOpen) return null;

  const { steps, currentStepIndex, transaction, isComplete } = activeProcessing;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-black border-2 border-[#00ff00] p-4 text-[#00ff00] font-mono text-xs shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#00ff00] pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="bg-[#00ff00] text-black font-bold px-1.5 py-0.5">
              [ REAL-TIME WIRE CLEARING PIPELINE ]
            </span>
            <span className="font-bold">{transaction?.id}</span>
          </div>

          {isComplete && (
            <button
              onClick={() => {
                terminalSound.keyPress();
                closeProcessing();
              }}
              className="border border-[#00ff00] px-2 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
            >
              [X CLOSE]
            </button>
          )}
        </div>

        {/* Transaction Summary Snippet */}
        {transaction && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-[#00ff00] p-2 mb-3 text-[11px]">
            <div>
              <span className="opacity-75">PROTOCOL:</span>
              <div className="font-bold">{transaction.protocol}</div>
            </div>
            <div>
              <span className="opacity-75">SETTLEMENT AMOUNT:</span>
              <div className="font-bold">{transaction.currency} {transaction.amount.toLocaleString()}</div>
            </div>
            <div>
              <span className="opacity-75">DEBIT NODE:</span>
              <div className="font-bold">{transaction.senderBank.bic}</div>
            </div>
            <div>
              <span className="opacity-75">CREDIT NODE:</span>
              <div className="font-bold">{transaction.receiverBank.bic}</div>
            </div>
          </div>
        )}

        {/* Chronological Execution Stages */}
        <div className="space-y-2 border border-[#00ff00] p-3 max-h-72 overflow-y-auto mb-3">
          <div className="font-bold text-[11px] pb-1 border-b border-[#00ff00]">
            EXECUTION STAGE AUDIT LOG:
          </div>

          {steps.map((step, idx) => {
            const isFinished = step.status === 'completed';
            const isRunning = step.status === 'running';
            const isError = step.status === 'error';
            const isPending = step.status === 'pending';

            return (
              <div
                key={step.id}
                className={`p-2 border ${
                  isRunning
                    ? 'border-[#00ff00] bg-[#00ff00]/10 font-bold'
                    : isFinished
                    ? 'border-[#00ff00]'
                    : isError
                    ? 'border-red-500 bg-red-950/20 text-red-500'
                    : 'border-neutral-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span>
                    [STAGE {idx + 1}] {step.label}
                  </span>
                  <span>
                    {isFinished && '[SUCCESS]'}
                    {isRunning && '[PROCESSING...]'}
                    {isError && '[COMPLIANCE_HOLD]'}
                    {isPending && '[QUEUED]'}
                  </span>
                </div>

                {step.details && (
                  <div className="text-[10px] mt-1 opacity-90">{step.details}</div>
                )}
                {step.rawPayloadSnippet && (
                  <pre className="text-[9px] mt-1 p-1 bg-black border border-[#00ff00] overflow-x-auto">
                    {step.rawPayloadSnippet}
                  </pre>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        {isComplete && (
          <div className="flex justify-end space-x-2 pt-2 border-t border-[#00ff00]">
            <button
              onClick={() => {
                terminalSound.keyPress();
                if (transaction) {
                  closeProcessing();
                  setSelectedTransaction(transaction);
                }
              }}
              className="border border-[#00ff00] bg-[#00ff00] text-black font-bold px-3 py-1 hover:bg-black hover:text-[#00ff00] cursor-pointer"
            >
              [ VIEW FULL SETTLEMENT ADVICE SLIP ]
            </button>
            <button
              onClick={() => {
                terminalSound.keyPress();
                closeProcessing();
              }}
              className="border border-[#00ff00] px-3 py-1 hover:bg-[#00ff00] hover:text-black cursor-pointer"
            >
              [ DISMISS MONITOR ]
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
