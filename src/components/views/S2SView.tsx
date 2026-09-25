import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { ChargeType, TransferProtocol } from '../../types/banking';
import { generateSwiftMT103, generateSwiftMT202, generateIso20022Pacs008, generateUETR } from '../../utils/mtFormatter';
import { terminalSound } from '../../utils/soundEffects';

export const S2SView: React.FC = () => {
  const { banks, executeTransfer } = useBanking();

  const [protocol, setProtocol] = useState<TransferProtocol>('S2S_STP');
  const [senderBankBic, setSenderBankBic] = useState(banks[1]?.bic || banks[0]?.bic || '');
  const [senderAccount, setSenderAccount] = useState('014-9988-2101');
  const [senderName, setSenderName] = useState('PACIFIC COMMODITIES TRADING CORP');
  const [senderAddress, setSenderAddress] = useState('MENARA BCA, JL. M.H. THAMRIN NO. 1, JAKARTA 10310');

  const [intermediaryBankBic, setIntermediaryBankBic] = useState(banks[5]?.bic || '');

  const [receiverBankBic, setReceiverBankBic] = useState(banks[7]?.bic || banks[5]?.bic || '');
  const [receiverAccount, setReceiverAccount] = useState('DE89-DEUT-5007-0010-9944');
  const [receiverName, setReceiverName] = useState('SIEMENS AG INDUSTRIAL DIVISION');
  const [receiverAddress, setReceiverAddress] = useState('TAUNUSANLAGE 12, 60325 FRANKFURT AM MAIN, GERMANY');

  const [amount, setAmount] = useState<number>(1250000);
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'IDR' | 'GBP' | 'SGD' | 'CHF' | 'JPY'>('USD');
  const [charges, setCharges] = useState<ChargeType>('OUR');
  const [remittanceInfo, setRemittanceInfo] = useState('INV-2026-EU-9812 INDUSTRIAL TURBINES PAYMENT');
  const [activePreviewTab, setActivePreviewTab] = useState<'SWIFT_MT' | 'ISO_XML' | 'JSON'>('SWIFT_MT');
  const [isSanctionsTest, setIsSanctionsTest] = useState(false);

  const senderBank = banks.find((b) => b.bic === senderBankBic) || banks[0];
  const receiverBank = banks.find((b) => b.bic === receiverBankBic) || banks[1];
  const intermediaryBank = banks.find((b) => b.bic === intermediaryBankBic);

  const handleSenderBankChange = (bic: string) => {
    setSenderBankBic(bic);
    const b = banks.find((item) => item.bic === bic);
    if (b && b.headquartersAddress) {
      setSenderAddress(b.headquartersAddress);
    }
  };

  const handleReceiverBankChange = (bic: string) => {
    setReceiverBankBic(bic);
    const b = banks.find((item) => item.bic === bic);
    if (b) {
      if (b.headquartersAddress) {
        setReceiverAddress(b.headquartersAddress);
      }
      // Auto-populate realistic account format
      if (b.country.includes('DE')) {
        setReceiverAccount(`DE89-DEUT-${b.routingCode || '50070010'}-0010-9944`);
      } else if (b.country.includes('US')) {
        setReceiverAccount(`US89-CHAS-${b.routingCode || '021000021'}-4091`);
      } else if (b.country.includes('GB')) {
        setReceiverAccount(`GB29-MIDL-${(b.routingCode || '40-05-15').replace(/-/g, '')}-1299`);
      } else if (b.country.includes('SG')) {
        setReceiverAccount(`SG55-DBSS-${b.routingCode || '7171'}-0021-4451`);
      }
    }
  };

  // Generate live preview payload
  const dummyTrx = {
    id: 'TX-S2S-LIVE',
    uetr: generateUETR(),
    timestamp: new Date().toISOString(),
    protocol,
    status: 'QUEUED' as const,
    senderBank,
    senderAccount,
    senderName,
    senderAddress,
    intermediaryBank,
    receiverBank,
    receiverAccount,
    receiverName,
    receiverAddress,
    amount,
    currency,
    charges,
    purposeCode: 'COMM_TRADE',
    remittanceInfo,
    hsmSignature: 'RSA4096_PREVIEW_SIG',
    macDigest: '98E2F1A0B7C41890',
    executionLogs: []
  };

  const previewMT103 = generateSwiftMT103(dummyTrx);
  const previewMT202 = generateSwiftMT202(dummyTrx);
  const previewISO = generateIso20022Pacs008(dummyTrx);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    terminalSound.keyPress();

    try {
      await executeTransfer({
        protocol,
        senderBankBic,
        senderAccount,
        senderName,
        senderAddress,
        intermediaryBankBic: intermediaryBankBic || undefined,
        receiverBankBic,
        receiverAccount,
        receiverName,
        receiverAddress,
        amount: Number(amount),
        currency,
        charges,
        remittanceInfo,
        triggerSanctionHold: isSanctionsTest
      });
    } catch (err) {
      console.error(err);
    }
  };

  const loadPreset = (presetType: 'COMMODITY' | 'TREASURY' | 'DIVIDEND' | 'SANCTION_TEST') => {
    terminalSound.keyPress();
    if (presetType === 'COMMODITY') {
      setProtocol('S2S_STP');
      setSenderBankBic(banks[1]?.bic || '');
      setSenderAccount('014-9988-2101');
      setSenderName('PACIFIC COMMODITIES TRADING CORP');
      setSenderAddress(banks[1]?.headquartersAddress || 'JAKARTA, ID');
      setIntermediaryBankBic(banks[5]?.bic || '');
      setReceiverBankBic(banks[7]?.bic || '');
      setReceiverAccount('DE89-DEUT-50070010-0010-9944');
      setReceiverName('SIEMENS AG INDUSTRIAL DIVISION');
      setReceiverAddress(banks[7]?.headquartersAddress || 'FRANKFURT, DE');
      setAmount(1250000);
      setCurrency('USD');
      setCharges('OUR');
      setRemittanceInfo('INV-2026-EU-9812 INDUSTRIAL TURBINES PAYMENT');
      setIsSanctionsTest(false);
    } else if (presetType === 'TREASURY') {
      setProtocol('SWIFT_MT202');
      setSenderBankBic(banks[2]?.bic || '');
      setSenderAccount('NOSTRO-USD-01');
      setSenderName('BANK MANDIRI GLOBAL TREASURY');
      setSenderAddress(banks[2]?.headquartersAddress || 'JAKARTA, ID');
      setIntermediaryBankBic('');
      setReceiverBankBic(banks[5]?.bic || '');
      setReceiverAccount('VOSTRO-USD-JPM-09');
      setReceiverName('JPMORGAN CHASE NY LIQUIDITY DESK');
      setReceiverAddress(banks[5]?.headquartersAddress || 'NEW YORK, US');
      setAmount(25000000);
      setCurrency('USD');
      setCharges('OUR');
      setRemittanceInfo('INTERBANK OVERNIGHT LIQUIDITY PLACEMENT');
      setIsSanctionsTest(false);
    } else if (presetType === 'SANCTION_TEST') {
      setProtocol('S2S_STP');
      setSenderBankBic(banks[1]?.bic || '');
      setSenderAccount('099-0011-8844');
      setSenderName('PETRO CHEMICALS TRADING LTD');
      setSenderAddress('LEVEL 4, KAV. 10, JAKARTA');
      setReceiverBankBic(banks[7]?.bic || '');
      setReceiverAccount('SY-DAM-9910-4411');
      setReceiverName('AL-BARAKA PETROLEUM REFINERY');
      setReceiverAddress('DAMASCUS FREE TRADE ZONE');
      setAmount(8900000);
      setCurrency('EUR');
      setCharges('SHA');
      setRemittanceInfo('CRUDE OIL REFINERY CONSIGNMENT SHIPMENT 104');
      setIsSanctionsTest(true);
    }
  };

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      {/* Title Header */}
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            S2S STRAIGHT THROUGH PROCESSING (STP) GATEWAY
          </span>
          <span className="text-xs">ISO 15022 / ISO 20022 CORE SETTLEMENT DISPATCHER</span>
        </div>

        {/* Presets */}
        <div className="flex items-center space-x-1">
          <span className="font-bold mr-1">SCENARIOS:</span>
          <button
            type="button"
            onClick={() => loadPreset('COMMODITY')}
            className="border border-[#00ff00] px-1.5 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
          >
            COMMODITY WIRE
          </button>
          <button
            type="button"
            onClick={() => loadPreset('TREASURY')}
            className="border border-[#00ff00] px-1.5 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
          >
            INTERBANK MT202
          </button>
          <button
            type="button"
            onClick={() => loadPreset('SANCTION_TEST')}
            className="border border-red-500 text-red-500 px-1.5 py-0.5 hover:bg-red-500 hover:text-black cursor-pointer"
          >
            AML HOLD TEST
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Form: Parameters */}
        <form onSubmit={handleExecute} className="lg:col-span-7 space-y-3">
          {/* Protocol Selection */}
          <div className="border border-[#00ff00] p-3">
            <div className="font-bold mb-2 pb-1 border-b border-[#00ff00]">
              1. CLEARING PROTOCOL & SETTLEMENT ROUTING
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] mb-1">&gt; PROTOCOL STANDARD:</label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value as TransferProtocol)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                >
                  <option value="S2S_STP">S2S_STP (Server-to-Server STP)</option>
                  <option value="SWIFT_MT103">SWIFT_MT103 (Single Customer Wire)</option>
                  <option value="SWIFT_MT202">SWIFT_MT202 (Financial Inst. Transfer)</option>
                  <option value="ISO20022_PACS008">ISO20022_PACS008 (Customer MX)</option>
                  <option value="FEDWIRE">FEDWIRE (US Fed Wire Network)</option>
                  <option value="BI_RTGS">BI_RTGS (Central Bank RTGS)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; INTERMEDIARY CORRESPONDENT BIC (OPTIONAL):</label>
                <select
                  value={intermediaryBankBic}
                  onChange={(e) => setIntermediaryBankBic(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                >
                  <option value="">-- DIRECT NOSTRO (NO INTERMEDIARY) --</option>
                  {banks.map((b) => (
                    <option key={b.bic} value={b.bic}>
                      {b.bic} - {b.name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ordering Customer Details */}
          <div className="border border-[#00ff00] p-3">
            <div className="font-bold mb-2 pb-1 border-b border-[#00ff00] flex justify-between">
              <span>2. ORDERING CUSTOMER & DEBIT INSTITUTION (:50K / :52A)</span>
              {senderBank?.routingCode && <span className="text-[10px]">ROUTE: {senderBank.routingCode}</span>}
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] mb-1">&gt; ORIGINATING BANK (BIC):</label>
                <select
                  value={senderBankBic}
                  onChange={(e) => handleSenderBankChange(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold font-mono"
                >
                  {banks.map((b) => (
                    <option key={b.bic} value={b.bic}>
                      {b.bic} - {b.name} ({b.city}, {b.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] mb-1">&gt; DEBIT ACCOUNT NUMBER:</label>
                  <input
                    type="text"
                    value={senderAccount}
                    onChange={(e) => setSenderAccount(e.target.value)}
                    className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1">&gt; ORDERING ENTITY NAME:</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; ORDERING REGISTERED ADDRESS:</label>
                <input
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Beneficiary Details */}
          <div className="border border-[#00ff00] p-3">
            <div className="font-bold mb-2 pb-1 border-b border-[#00ff00] flex justify-between">
              <span>3. BENEFICIARY INSTITUTION & RECIPIENT (:57A / :59)</span>
              {receiverBank?.leiCode && <span className="text-[10px]">LEI: {receiverBank.leiCode}</span>}
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] mb-1">&gt; BENEFICIARY BANK (BIC):</label>
                <select
                  value={receiverBankBic}
                  onChange={(e) => handleReceiverBankChange(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold font-mono"
                >
                  {banks.map((b) => (
                    <option key={b.bic} value={b.bic}>
                      {b.bic} - {b.name} ({b.city}, {b.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] mb-1">&gt; BENEFICIARY IBAN / ACCOUNT:</label>
                  <input
                    type="text"
                    value={receiverAccount}
                    onChange={(e) => setReceiverAccount(e.target.value)}
                    className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] mb-1">&gt; BENEFICIARY NAME:</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] mb-1">&gt; BENEFICIARY REGISTERED ADDRESS:</label>
                <input
                  type="text"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Financials & Remittance */}
          <div className="border border-[#00ff00] p-3">
            <div className="font-bold mb-2 pb-1 border-b border-[#00ff00]">
              4. FINANCIAL AMOUNTS & SETTLEMENT DETAILS (FIELD :32A / :70 / :71A)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] mb-1">&gt; PRINCIPAL SETTLEMENT AMOUNT:</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] mb-1">&gt; CURRENCY:</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] mb-1">&gt; CHARGE CODE (:71A):</label>
                <select
                  value={charges}
                  onChange={(e) => setCharges(e.target.value as ChargeType)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                >
                  <option value="OUR">OUR (Sender Bears All Fees)</option>
                  <option value="BEN">BEN (Beneficiary Bears Fees)</option>
                  <option value="SHA">SHA (Shared Correspondent Fees)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] mb-1">&gt; REMITTANCE / PURPOSE INFO (:70):</label>
                <input
                  type="text"
                  value={remittanceInfo}
                  onChange={(e) => setRemittanceInfo(e.target.value)}
                  className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-1.5 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dispatch Button */}
          <div className="pt-1">
            <button
              type="submit"
              className="w-full border-2 border-[#00ff00] bg-[#00ff00] text-black font-bold py-2.5 text-xs hover:bg-black hover:text-[#00ff00] cursor-pointer"
            >
              [ DISPATCH WIRE PAYLOAD TO CORE SETTLEMENT ENGINE ]
            </button>
          </div>
        </form>

        {/* Right Pane: Live Wire Payload Preview */}
        <div className="lg:col-span-5 border border-[#00ff00] p-3 flex flex-col h-full">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#00ff00]">
            <span className="font-bold">LIVE WIRE PAYLOAD GENERATION</span>
            <div className="flex space-x-1">
              <button
                type="button"
                onClick={() => setActivePreviewTab('SWIFT_MT')}
                className={`px-1.5 py-0.5 text-[10px] cursor-pointer border ${
                  activePreviewTab === 'SWIFT_MT'
                    ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                    : 'bg-black text-[#00ff00] border-[#00ff00]'
                }`}
              >
                SWIFT MT
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('ISO_XML')}
                className={`px-1.5 py-0.5 text-[10px] cursor-pointer border ${
                  activePreviewTab === 'ISO_XML'
                    ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                    : 'bg-black text-[#00ff00] border-[#00ff00]'
                }`}
              >
                ISO20022 XML
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab('JSON')}
                className={`px-1.5 py-0.5 text-[10px] cursor-pointer border ${
                  activePreviewTab === 'JSON'
                    ? 'bg-[#00ff00] text-black font-bold border-[#00ff00]'
                    : 'bg-black text-[#00ff00] border-[#00ff00]'
                }`}
              >
                JSON WIRE
              </button>
            </div>
          </div>

          <div className="flex-1 bg-black border border-[#00ff00] p-2 overflow-x-auto text-[11px] leading-snug">
            <pre className="text-[#00ff00] whitespace-pre-wrap">
              {activePreviewTab === 'SWIFT_MT'
                ? protocol === 'SWIFT_MT202'
                  ? previewMT202
                  : previewMT103
                : activePreviewTab === 'ISO_XML'
                ? previewISO
                : JSON.stringify(
                    {
                      header: {
                        protocol,
                        uetr: dummyTrx.uetr,
                        hsm_mac: dummyTrx.macDigest,
                        timestamp: dummyTrx.timestamp
                      },
                      financials: {
                        amount,
                        currency,
                        charges
                      },
                      sender: {
                        bic: senderBankBic,
                        account: senderAccount,
                        name: senderName,
                        address: senderAddress
                      },
                      intermediary: intermediaryBankBic ? { bic: intermediaryBankBic } : null,
                      receiver: {
                        bic: receiverBankBic,
                        account: receiverAccount,
                        name: receiverName,
                        address: receiverAddress
                      },
                      memo: remittanceInfo
                    },
                    null,
                    2
                  )}
            </pre>
          </div>

          <div className="mt-2 text-[10px] opacity-75">
            Cryptographic signatures and Block 5 MAC checksums are generated via the hardware security module during execution.
          </div>
        </div>
      </div>
    </div>
  );
};
