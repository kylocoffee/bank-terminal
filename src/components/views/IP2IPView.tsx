import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { terminalSound } from '../../utils/soundEffects';

export const IP2IPView: React.FC = () => {
  const { banks, executeTransfer } = useBanking();

  const [sourceBankBic, setSourceBankBic] = useState(banks[1]?.bic || banks[0]?.bic || '');
  const [destBankBic, setDestBankBic] = useState(banks[5]?.bic || banks[4]?.bic || '');

  const sourceBank = banks.find((b) => b.bic === sourceBankBic) || banks[0];
  const destBank = banks.find((b) => b.bic === destBankBic) || banks[1];

  const [sourceIP, setSourceIP] = useState(sourceBank?.ip || '10.240.14.88');
  const [sourcePort, setSourcePort] = useState(sourceBank?.port || 8443);
  const [destIP, setDestIP] = useState(destBank?.ip || '198.51.100.25');
  const [destPort, setDestPort] = useState(destBank?.port || 443);

  const [tlsCipher, setTlsCipher] = useState('TLS_AES_256_GCM_SHA384');
  const [senderAccount, setSenderAccount] = useState('014-9988-2101');
  const [senderName, setSenderName] = useState('PACIFIC COMMODITIES TRADING CORP');
  const [receiverAccount, setReceiverAccount] = useState('US89-CHAS-0210-9812-4091');
  const [receiverName, setReceiverName] = useState('GLOBAL CORRESPONDENT CLEARING NY');
  const [amount, setAmount] = useState<number>(5000000);
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'IDR' | 'GBP' | 'SGD' | 'CHF' | 'JPY'>('USD');
  const [remittanceInfo, setRemittanceInfo] = useState('IP2IP-HOST-SETTLEMENT-DIRECT-WIRE');

  // Socket Test State
  const [socketTesting, setSocketTesting] = useState(false);
  const [socketLogs, setSocketLogs] = useState<string[]>([
    'Socket daemon ready. Point-to-point direct TCP tunnel awaiting initiation.'
  ]);

  const handleSourceBankChange = (bic: string) => {
    setSourceBankBic(bic);
    const b = banks.find((item) => item.bic === bic);
    if (b) {
      setSourceIP(b.ip);
      setSourcePort(b.port);
    }
  };

  const handleDestBankChange = (bic: string) => {
    setDestBankBic(bic);
    const b = banks.find((item) => item.bic === bic);
    if (b) {
      setDestIP(b.ip);
      setDestPort(b.port);
      if (b.country.includes('US')) {
        setReceiverAccount('US89-CHAS-0210-9812-4091');
      } else if (b.country.includes('DE')) {
        setReceiverAccount('DE89-DEUT-50070010-0010-8821');
      } else if (b.country.includes('GB')) {
        setReceiverAccount('GB29-MIDL-40051512-9901');
      } else if (b.country.includes('SG')) {
        setReceiverAccount('SG55-DBSS-7171-0021-4451');
      }
    }
  };

  const runSocketTest = () => {
    setSocketTesting(true);
    setSocketLogs([`[0.000ms] Initializing raw TCP socket to remote host ${destIP}:${destPort} (${destBank.city})...`]);
    terminalSound.keyPress();

    setTimeout(() => {
      setSocketLogs((prev) => [...prev, `[2.140ms] TCP SYN sent -> remote seq=0 (Flags: [SYN], MSS=1460)`]);
      terminalSound.packetBeep();
    }, 300);

    setTimeout(() => {
      setSocketLogs((prev) => [...prev, `[5.820ms] TCP SYN-ACK received <- remote seq=0 ack=1 (Window: 65535, SAA Daemon Active)`]);
    }, 600);

    setTimeout(() => {
      setSocketLogs((prev) => [...prev, `[7.210ms] TCP ACK sent -> connection ESTABLISHED (Socket FD: 1042)`]);
      terminalSound.packetBeep();
    }, 900);

    setTimeout(() => {
      setSocketLogs((prev) => [
        ...prev,
        `[12.450ms] TLS 1.3 ClientHello (Cipher: ${tlsCipher}, ALPN: s2s-v1)`,
        `[18.900ms] TLS 1.3 ServerHello + X.509 Certificate Chain Verified (CN: ${destBankBic}, LEI: ${destBank.leiCode || '549300...'})`,
        `[24.120ms] Mutual mTLS Authentication Complete. Hardware MAC digest channel ACTIVE.`
      ]);
      setSocketTesting(false);
      terminalSound.success();
    }, 1300);
  };

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    terminalSound.keyPress();

    try {
      await executeTransfer({
        protocol: 'IP2IP_DIRECT',
        senderBankBic: sourceBankBic,
        senderAccount,
        senderName,
        receiverBankBic: destBankBic,
        receiverAccount,
        receiverName,
        amount: Number(amount),
        currency,
        charges: 'OUR',
        remittanceInfo,
        ipTunnelConfig: {
          sourceIP,
          destIP,
          port: destPort
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            IP2IP DIRECT HOST-TO-HOST SOCKET GATEWAY
          </span>
          <span className="text-xs">POINT-TO-POINT ENCRYPTED TUNNEL INTERFACE</span>
        </div>
        <span className="border border-[#00ff00] px-2 py-0.5">TLS 1.3 mTLS VERIFIED</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Form Details */}
        <form onSubmit={handleExecute} className="lg:col-span-7 space-y-3">
          {/* Socket Network Configuration */}
          <div className="border border-[#00ff00] p-3">
            <div className="font-bold mb-2 pb-1 border-b border-[#00ff00]">
              1. DIRECT TCP/IP SOCKET & CIPHER SUITE PARAMETERS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Source Host */}
              <div className="border border-[#00ff00] p-2 space-y-2">
                <div className="font-bold text-[11px] underline">SOURCE NODE (HOST A)</div>
                <div>
                  <label className="block text-[10px]">&gt; PARTICIPANT:</label>
                  <select
                    value={sourceBankBic}
                    onChange={(e) => handleSourceBankChange(e.target.value)}
                    className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1 text-xs font-mono"
                  >
                    {banks.map((b) => (
                      <option key={b.bic} value={b.bic}>
                        {b.bic} - {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="col-span-2">
                    <label className="block text-[10px]">&gt; HOST IP:</label>
                    <input
                      type="text"
                      value={sourceIP}
                      onChange={(e) => setSourceIP(e.target.value)}
                      className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1 text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px]">&gt; PORT:</label>
                    <input
                      type="number"
                      value={sourcePort}
                      onChange={(e) => setSourcePort(parseInt(e.target.value) || 8443)}
                      className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1 text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Destination Host */}
              <div className="border border-[#00ff00] p-2 space-y-2">
                <div className="font-bold text-[11px] underline">DESTINATION NODE (HOST B)</div>
                <div>
                  <label className="block text-[10px]">&gt; PARTICIPANT:</label>
                  <select
                    value={destBankBic}
                    onChange={(e) => handleDestBankChange(e.target.value)}
                    className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1 text-xs font-mono"
                  >
                    {banks.map((b) => (
                      <option key={b.bic} value={b.bic}>
                        {b.bic} - {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="col-span-2">
                    <label className="block text-[10px]">&gt; REMOTE IP:</label>
                    <input
                      type="text"
                      value={destIP}
                      onChange={(e) => setDestIP(e.target.value)}
                      className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1 text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px]">&gt; PORT:</label>
                    <input
                      type="number"
                      value={destPort}
                      onChange={(e) => setDestPort(parseInt(e.target.value) || 443)}
                      className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1 text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] mb-1">&gt; TLS 1.3 CIPHER SUITE & SECURE HANDSHAKE:</label>
              <select
                value={tlsCipher}
                onChange={(e) => setTlsCipher(e.target.value)}
                className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
              >
                <option value="TLS_AES_256_GCM_SHA384">TLS_AES_256_GCM_SHA384 (FIPS 140-2 Level 3)</option>
                <option value="TLS_CHACHA20_POLY1305_SHA256">TLS_CHACHA20_POLY1305_SHA256 (High Performance)</option>
                <option value="TLS_AES_128_GCM_SHA256">TLS_AES_128_GCM_SHA256 (Standard)</option>
              </select>
            </div>
          </div>

          {/* Accounts & Settlement */}
          <div className="border border-[#00ff00] p-3 space-y-2">
            <div className="font-bold mb-2 pb-1 border-b border-[#00ff00]">
              2. DIRECT SETTLEMENT INSTRUCTION
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] mb-1">&gt; ORIGINATING ACCOUNT:</label>
                <input
                  type="text"
                  value={senderAccount}
                  onChange={(e) => setSenderAccount(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] mb-1">&gt; ORIGINATING ENTITY:</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] mb-1">&gt; BENEFICIARY NOSTRO / ACCOUNT:</label>
                <input
                  type="text"
                  value={receiverAccount}
                  onChange={(e) => setReceiverAccount(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] mb-1">&gt; BENEFICIARY ENTITY:</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[10px] mb-1">&gt; AMOUNT:</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] mb-1">&gt; CURRENCY:</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="IDR">IDR</option>
                  <option value="GBP">GBP</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] mb-1">&gt; MEMO / TRANSACTION REFERENCE:</label>
              <input
                type="text"
                value={remittanceInfo}
                onChange={(e) => setRemittanceInfo(e.target.value)}
                className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                required
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="w-full border-2 border-[#00ff00] bg-[#00ff00] text-black font-bold py-2.5 text-xs hover:bg-black hover:text-[#00ff00] cursor-pointer"
            >
              [ TRANSMIT BINARY WIRE FRAME VIA IP2IP SOCKET TUNNEL ]
            </button>
          </div>
        </form>

        {/* Right Pane: Socket Status & Diagnostic Console */}
        <div className="lg:col-span-5 border border-[#00ff00] p-3 flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#00ff00]">
            <span className="font-bold">SOCKET CONNECTION MONITOR</span>
            <button
              type="button"
              onClick={runSocketTest}
              disabled={socketTesting}
              className="border border-[#00ff00] px-2 py-0.5 text-xs hover:bg-[#00ff00] hover:text-black cursor-pointer disabled:opacity-50"
            >
              {socketTesting ? 'TESTING...' : '[ RUN TCP/TLS PING ]'}
            </button>
          </div>

          <div className="flex-1 bg-black border border-[#00ff00] p-2 overflow-y-auto text-[11px] leading-relaxed space-y-1">
            {socketLogs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap">
                {log}
              </div>
            ))}
          </div>

          {/* Hex Stream Snippet */}
          <div className="border border-[#00ff00] p-2">
            <div className="font-bold text-[10px] pb-1 border-b border-[#00ff00] mb-1">
              PAYLOAD FRAME HEX SPECIFICATION:
            </div>
            <pre className="text-[10px] leading-tight text-[#00ff00] overflow-x-auto">
{`00000000: 4742 2d49 5032 4950 0000 041a ffff 0100  GB-IP2IP........
00000010: ${sourceBankBic.padEnd(11, '.')} 2020 ${destBankBic.padEnd(11, '.')}  BICs............
00000020: 0000 0000 004c 4b40 5553 4400 98e2 f1a0  .....LK@USD.....`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
