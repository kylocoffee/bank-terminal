import React, { useState } from 'react';
import { useBanking } from '../../context/BankingContext';
import { generateMacDigest } from '../../utils/mtFormatter';
import { terminalSound } from '../../utils/soundEffects';

export const HsmSecurityView: React.FC = () => {
  const { hsmStatus, renewHsmKeys } = useBanking();
  const [calcInput, setCalcInput] = useState(
    ':20:S2S-2026-98124\n:32A:260925USD1250000,00\n:50K:/014-9988-2101\n:59:/DE89-DEUT-5007-0010-9944'
  );
  const [calculatedMac, setCalculatedMac] = useState(generateMacDigest(calcInput));
  const [isRotating, setIsRotating] = useState(false);

  const handleCalculate = (text: string) => {
    setCalcInput(text);
    setCalculatedMac(generateMacDigest(text));
  };

  const handleRotateKeys = () => {
    setIsRotating(true);
    terminalSound.keyPress();
    setTimeout(() => {
      renewHsmKeys();
      setIsRotating(false);
      terminalSound.success();
    }, 800);
  };

  return (
    <div className="flex-1 p-4 bg-black text-[#00ff00] overflow-y-auto font-mono text-xs">
      <div className="border-b-2 border-[#00ff00] pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-bold text-sm bg-[#00ff00] text-black px-2 py-0.5 mr-2">
            HARDWARE SECURITY MODULE (HSM) CONSOLE
          </span>
          <span className="text-xs">FIPS 140-2 LEVEL 3 CRYPTOGRAPHIC KEY ENGINE</span>
        </div>

        <button
          onClick={handleRotateKeys}
          disabled={isRotating}
          className="border border-[#00ff00] bg-[#00ff00] text-black font-bold px-3 py-1 hover:bg-black hover:text-[#00ff00] cursor-pointer disabled:opacity-50"
        >
          {isRotating ? '[ROTATING ASYMMETRIC KEYS...]' : '[TRIGGER KEY ROTATION]'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: HSM Slot Diagnostics */}
        <div className="lg:col-span-6 border border-[#00ff00] p-3 space-y-3">
          <div className="font-bold pb-1 border-b border-[#00ff00]">
            HARDWARE CRYPTOGRAPHIC MODULE STATUS
          </div>

          <div className="grid grid-cols-2 gap-2 border border-[#00ff00] p-2">
            <div>
              <span className="opacity-75">HARDWARE SLOT ID:</span>
              <div className="font-bold text-sm">SLOT #{hsmStatus.slotId.toString().padStart(2, '0')}</div>
            </div>
            <div>
              <span className="opacity-75">OPERATIONAL STATUS:</span>
              <div className="font-bold text-sm bg-[#00ff00] text-black px-1 inline-block">
                [{hsmStatus.status}]
              </div>
            </div>
            <div>
              <span className="opacity-75">FIRMWARE / SPEC:</span>
              <div className="font-bold">{hsmStatus.firmwareVersion}</div>
            </div>
            <div>
              <span className="opacity-75">ASYMMETRIC ALGORITHM:</span>
              <div className="font-bold">{hsmStatus.algorithm}</div>
            </div>
            <div className="col-span-2">
              <span className="opacity-75">ACTIVE PRIMARY KEY IDENTIFIER:</span>
              <div className="font-bold select-all">{hsmStatus.activeKeyId}</div>
            </div>
            <div>
              <span className="opacity-75">SIGNATURES GENERATED:</span>
              <div className="font-bold">{hsmStatus.totalSignaturesGenerated.toLocaleString()}</div>
            </div>
            <div>
              <span className="opacity-75">LAST HEALTH CHECK:</span>
              <div className="font-bold">{hsmStatus.lastHealthCheck}</div>
            </div>
          </div>

          {/* Security Features List */}
          <div className="border border-[#00ff00] p-2 space-y-1 text-[11px]">
            <div className="font-bold underline">CRYPTOGRAPHIC SECURITY ATTRIBUTES:</div>
            <div>[X] Dual Control / Split Knowledge M-of-N Key Custody</div>
            <div>[X] Automated Zeroization upon physical enclosure tamper detection</div>
            <div>[X] Dedicated PCI-e Cryptographic Accelerator with hardware RNG</div>
            <div>[X] Enforced SWIFT LAU (Local Authentication) & RMA relationship table</div>
          </div>
        </div>

        {/* Right: Live MAC & Signature Generator */}
        <div className="lg:col-span-6 border border-[#00ff00] p-3 flex flex-col space-y-3">
          <div className="font-bold pb-1 border-b border-[#00ff00]">
            REAL-TIME MAC DIGEST & SIGNATURE ENGINE
          </div>

          <div>
            <label className="block text-[11px] mb-1">
              &gt; INPUT FINANCIAL TEXT BLOCK (:FIELD PAYLOAD):
            </label>
            <textarea
              value={calcInput}
              onChange={(e) => handleCalculate(e.target.value)}
              rows={6}
              className="w-full bg-black text-[#00ff00] border border-[#00ff00] p-2 text-xs font-mono outline-none resize-none"
            />
          </div>

          <div className="border border-[#00ff00] p-2 space-y-2">
            <div>
              <span className="opacity-75 text-[10px]">COMPUTED 64-BIT MAC DIGEST:</span>
              <div className="text-base font-bold select-all bg-black text-[#00ff00]">
                0x{calculatedMac}
              </div>
            </div>

            <div>
              <span className="opacity-75 text-[10px]">RSA-4096 DIGITAL SIGNATURE ENVELOPE:</span>
              <pre className="text-[10px] text-[#00ff00] whitespace-pre-wrap break-all mt-1 bg-black p-1 border border-[#00ff00]">
                {`3082020a0282020100c4f8190e21ab791e84a921804f${calculatedMac}9812a101b0f0238120e...[RSA4096_VERIFIED_BY_${hsmStatus.activeKeyId.substring(0, 12)}]`}
              </pre>
            </div>
          </div>

          <div className="text-[10px] opacity-75">
            Every transaction executed in S2S STP or IP2IP is automatically appended with this hardware-attested cryptographic signature.
          </div>
        </div>
      </div>
    </div>
  );
};
