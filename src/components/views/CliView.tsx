import React, { useState, useRef, useEffect } from 'react';
import { useBanking } from '../../context/BankingContext';
import { terminalSound } from '../../utils/soundEffects';

export const CliView: React.FC = () => {
  const { cliHistory, executeCliCommand, clearCli, systemConfig } = useBanking();
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [localHistory, setLocalHistory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cliHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!inputVal.trim()) return;
      terminalSound.keyPress();
      executeCliCommand(inputVal.trim());
      setLocalHistory((prev) => [...prev, inputVal.trim()]);
      setInputVal('');
      setHistoryIndex(null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (localHistory.length === 0) return;
      const nextIndex = historyIndex === null ? localHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(localHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= localHistory.length) {
        setHistoryIndex(null);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(localHistory[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const commands = [
        'help', 'clear', 'banks', 'nostro', 's2s --demo', 'ip2ip --test',
        'gpi', 'status', 'decode', 'keygen', 'audit', 'users', 'config', 'logout'
      ];
      const match = commands.find((cmd) => cmd.startsWith(inputVal.trim().toLowerCase()));
      if (match) {
        setInputVal(match);
      }
    }
  };

  const quickCommands = [
    { label: 'HELP', cmd: 'help' },
    { label: 'LIST BANKS', cmd: 'banks' },
    { label: 'NOSTRO MATRIX', cmd: 'nostro' },
    { label: 'S2S STP DEMO', cmd: 's2s --demo' },
    { label: 'IP2IP SOCKET TEST', cmd: 'ip2ip --test' },
    { label: 'SWIFT GPI AUDIT', cmd: 'gpi' },
    { label: 'HSM STATUS', cmd: 'status' },
    { label: 'CLEAR SCREEN', cmd: 'clear' }
  ];

  return (
    <div 
      className="flex-1 flex flex-col bg-black text-[#00ff00] p-4 font-mono overflow-hidden cursor-text select-text"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Quick Access Action Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-[#00ff00] text-xs">
        <span className="font-bold bg-[#00ff00] text-black px-1.5 py-0.5">DIRECTIVES:</span>
        {quickCommands.map((qc) => (
          <button
            key={qc.cmd}
            onClick={(e) => {
              e.stopPropagation();
              terminalSound.keyPress();
              executeCliCommand(qc.cmd);
            }}
            className="border border-[#00ff00] px-2 py-0.5 text-xs hover:bg-[#00ff00] hover:text-black cursor-pointer"
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1.5 text-xs">
        {cliHistory.map((item) => (
          <div key={item.id} className="whitespace-pre-wrap leading-relaxed">
            {item.type === 'input' ? (
              <div className="flex items-center text-[#00ff00] font-bold">
                <span className="mr-2">&gt;</span>
                <span>{item.content}</span>
              </div>
            ) : item.type === 'error' ? (
              <div className="text-red-500 font-bold border-l-2 border-red-500 pl-2">
                {item.content}
              </div>
            ) : item.type === 'success' ? (
              <div className="text-[#00ff00] font-bold border-l-2 border-[#00ff00] pl-2">
                {item.content}
              </div>
            ) : (
              <div className="text-[#00ff00]">{item.content}</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* CLI Input Prompt */}
      <div className="flex items-center pt-2 border-t border-[#00ff00]">
        <span className="font-bold mr-2 text-xs text-[#00ff00]">
          [{systemConfig.gatewayNodeName}]&gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (e.g. 'help', 's2s --demo', 'banks', 'nostro')..."
          className="flex-1 bg-black text-[#00ff00] border-none outline-none text-xs font-mono"
          autoFocus
        />
        <span className="terminal-cursor ml-1" />
      </div>
    </div>
  );
};
