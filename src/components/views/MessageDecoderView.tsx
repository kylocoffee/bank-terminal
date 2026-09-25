import React, { useState } from 'react';
import { parseSwiftMTMessage } from '../../utils/mtFormatter';
import { terminalSound } from '../../utils/soundEffects';

const SAMPLE_MT103 = `{1:F01CENAIDJAXXXX0001000001}{2:I103CHASUS33XXXXN}{3:{108:GB20260925001}{121:4f92d410-b183-4ec3-a5c2-f19b889502ab}}{4:
:20:S2S-2026-98124
:23B:CRED
:32A:260925USD1250000,00
:50K:/014-9988-2101
PACIFIC COMMODITIES TRADING CORP
FINANCIAL TOWER 1, JAKARTA ID
:57A:DEUTDEDDXXX
:59:/DE89-DEUT-5007-0010-9944
SIEMENS AG INDUSTRIAL DIVISION
WERNER-VON-SIEMENS-STR 1, MUNICH DE
:70:INV-2026-EU-9812 INDUSTRIAL TURBINES PAYMENT
:71A:OUR
-}{5:{MAC:98E2F1A0B7C41890}{CHK:A881}}`;

const SAMPLE_MT202 = `{1:F01BMRIIDJAXXXX0002000001}{2:I202CHASUS33XXXXN}{3:{121:8c11e204-9844-42ea-9122-aa77102911b1}}{4:
:20:TRS-MT202-2026-009
:21:NONREF
:32A:260925USD25000000,00
:52A:BMRIIDJAXXX
:53A:/NOSTRO-USD-01
:58A:CHASUS33XXX
:72:/BNF/INTERBANK OVERNIGHT PLACEMENT
-}{5:{MAC:44F8910AB7129031}{CHK:B112}}`;

export const MessageDecoderView: React.FC = () => {
  const [rawText, setRawText] = useState(SAMPLE_MT103);
  const [parsed, setParsed] = useState<any>(parseSwiftMTMessage(SAMPLE_MT103));

  const handleParse = (text: string) => {
    setRawText(text);
    const res = parseSwiftMTMessage(text);
    setParsed(res);
  };

  const handleLoadSample = (sample: string) => {
    terminalSound.keyPress();
    handleParse(sample);
  };

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            SWIFT FIN & ISO MESSAGE PARSER / DECODER
          </span>
          <span className="text-xs">FIELD SYNTAX VALIDATION & TAG EXTRACTION</span>
        </div>

        <div className="flex items-center space-x-1">
          <span className="font-bold mr-1">LOAD SAMPLES:</span>
          <button
            onClick={() => handleLoadSample(SAMPLE_MT103)}
            className="border border-[#00ff00] px-2 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
          >
            MT103 CUSTOMER WIRE
          </button>
          <button
            onClick={() => handleLoadSample(SAMPLE_MT202)}
            className="border border-[#00ff00] px-2 py-0.5 hover:bg-[#00ff00] hover:text-black cursor-pointer"
          >
            MT202 INSTITUTIONAL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Input Textarea */}
        <div className="lg:col-span-6 border border-[#00ff00] p-3 flex flex-col">
          <div className="font-bold pb-1 border-b border-[#00ff00] mb-2 flex justify-between">
            <span>RAW SWIFT FIN PAYLOAD (BLOCKS 1 - 5)</span>
            <span className="text-[10px]">{rawText.length} BYTES</span>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => handleParse(e.target.value)}
            rows={16}
            className="flex-1 bg-black text-[#00ff00] border border-[#00ff00] p-2 text-xs font-mono leading-relaxed outline-none resize-none"
            placeholder="Paste raw SWIFT MT message here..."
          />

          <div className="mt-2 text-[10px] opacity-75">
            Parser validates standard ISO 15022 tags (:20:, :32A:, :50K:, :57A:, :59:, :70:, :71A:, {'{121:...}'}, {'{MAC:...}'}).
          </div>
        </div>

        {/* Right: Parsed Breakdown */}
        <div className="lg:col-span-6 border border-[#00ff00] p-3 space-y-3">
          <div className="font-bold pb-1 border-b border-[#00ff00]">
            DECODED STRUCTURAL FIELD BLOCKS:
          </div>

          {/* Block 1, 2, 3 */}
          <div className="border border-[#00ff00] p-2 space-y-1">
            <div className="font-bold text-[11px] underline">HEADERS (BLOCKS 1, 2, 3)</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="opacity-75">MESSAGE TYPE:</span>
                <span className="font-bold ml-1">MT{parsed.messageType || '103'}</span>
              </div>
              <div>
                <span className="opacity-75">SENDER LT / BIC:</span>
                <span className="font-bold ml-1">{parsed.senderBic || 'N/A'}</span>
              </div>
              <div>
                <span className="opacity-75">RECEIVER LT / BIC:</span>
                <span className="font-bold ml-1">{parsed.receiverBic || 'N/A'}</span>
              </div>
              <div>
                <span className="opacity-75">UETR (TAG 121):</span>
                <div className="font-bold text-[10px] truncate select-all">{parsed.uetr || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Block 4 Fields */}
          <div className="border border-[#00ff00] p-2 space-y-2 max-h-72 overflow-y-auto">
            <div className="font-bold text-[11px] underline">BLOCK 4 FINANCIAL BODY TAGS</div>

            {parsed.fields && parsed.fields.length > 0 ? (
              parsed.fields.map((f: any, idx: number) => (
                <div key={idx} className="border-b border-[#00ff00] pb-1">
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>TAG {f.tag} ({f.label})</span>
                  </div>
                  <pre className="text-[#00ff00] text-[10px] whitespace-pre-wrap mt-0.5 opacity-90">
                    {f.value}
                  </pre>
                </div>
              ))
            ) : (
              <div className="opacity-75">No field tags parsed. Check format.</div>
            )}
          </div>

          {/* Block 5 Security */}
          <div className="border border-[#00ff00] p-2">
            <div className="font-bold text-[11px] underline mb-1">BLOCK 5 TRAILER & MAC DIGEST</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="opacity-75">MAC SIGNATURE:</span>
                <div className="font-bold">{parsed.mac || '98E2F1A0B7C41890'}</div>
              </div>
              <div>
                <span className="opacity-75">CHECKSUM:</span>
                <div className="font-bold">{parsed.chk || 'A881'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
