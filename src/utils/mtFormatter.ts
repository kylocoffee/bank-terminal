import { BankParticipant, ChargeType, TransactionRecord } from '../types/banking';

export function generateUETR(): string {
  // Returns authentic standard UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateMacDigest(payload: string, secretKey: string = 'FIN_HSM_KEY_2026_MASTER'): string {
  let hash = 0;
  const combined = payload + secretKey;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const secondary = (Math.abs(hash ^ 0x5A5A5A5A)).toString(16).toUpperCase().padStart(8, '0');
  return `${hex}${secondary}`;
}

export function generateSwiftMT103(trx: Partial<TransactionRecord> & { reference?: string }): string {
  const ref = trx.id || trx.reference || 'S2S-2026-98124';
  const uetr = trx.uetr || generateUETR();
  const senderBank = trx.senderBank || { bic: 'CENAIDJAXXXX', name: 'BANK CENTRAL ASIA' };
  const receiverBank = trx.receiverBank || { bic: 'CHASUS33XXXX', name: 'JPMORGAN CHASE NY' };
  const amount = trx.amount || 1000000;
  const ccy = trx.currency || 'USD';
  const senderAcc = trx.senderAccount || '014-9988-2101';
  const senderNm = trx.senderName || 'PACIFIC COMMODITIES TRADING CORP';
  const senderAddr = trx.senderAddress || 'JAKARTA, ID';
  const receiverAcc = trx.receiverAccount || 'DE89-DEUT-5007-0010-9944';
  const receiverNm = trx.receiverName || 'SIEMENS AG INDUSTRIAL DIVISION';
  const receiverAddr = trx.receiverAddress || 'MUNICH, DE';
  const memo = trx.remittanceInfo || 'COMMERCIAL PAYMENT';
  const charges = trx.charges || 'OUR';

  const dateYYMMDD = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
  }).replace('.', ',');

  const block1 = `{1:F01${senderBank.bic.padEnd(12, 'X')}0000000000}`;
  const block2 = `{2:I103${receiverBank.bic.padEnd(12, 'X')}N}`;
  const block3 = `{3:{108:${ref}}{121:${uetr}}}`;
  
  let block4 = `{4:\n`;
  block4 += `:20:${ref}\n`;
  block4 += `:23B:CRED\n`;
  block4 += `:32A:${dateYYMMDD}${ccy}${formattedAmount}\n`;
  block4 += `:50K:/${senderAcc}\n${senderNm.toUpperCase()}\n${senderAddr.toUpperCase()}\n`;
  
  if (trx.intermediaryBank) {
    block4 += `:56A:${trx.intermediaryBank.bic}\n`;
  }
  
  block4 += `:57A:${receiverBank.bic}\n`;
  block4 += `:59:/${receiverAcc}\n${receiverNm.toUpperCase()}\n${receiverAddr.toUpperCase()}\n`;
  block4 += `:70:${memo.toUpperCase()}\n`;
  block4 += `:71A:${charges}\n`;
  block4 += `-}`;

  const mac = trx.macDigest || generateMacDigest(block4);
  const chk = Math.floor(10000000 + Math.random() * 90000000).toString(16).toUpperCase();
  const block5 = `{5:{MAC:${mac.slice(0, 8)}}{CHK:${chk}}}`;

  return `${block1}\n${block2}\n${block3}\n${block4}\n${block5}`;
}

export function generateSwiftMT202(trx: Partial<TransactionRecord> & { reference?: string; orderingInstitutionAcc?: string; beneficiaryInstitutionAcc?: string }): string {
  const ref = trx.id || trx.reference || 'TRS-MT202-2026-001';
  const uetr = trx.uetr || generateUETR();
  const senderBank = trx.senderBank || { bic: 'BMRIIDJAXXXX', name: 'BANK MANDIRI' };
  const receiverBank = trx.receiverBank || { bic: 'CHASUS33XXXX', name: 'JPMORGAN CHASE NY' };
  const amount = trx.amount || 25000000;
  const ccy = trx.currency || 'USD';
  const orderAcc = trx.orderingInstitutionAcc || trx.senderAccount || 'NOSTRO-USD-01';
  const benAcc = trx.beneficiaryInstitutionAcc || trx.receiverAccount || 'VOSTRO-USD-09';
  const memo = trx.remittanceInfo || 'INTERBANK OVERNIGHT LIQUIDITY PLACEMENT';

  const dateYYMMDD = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
  }).replace('.', ',');

  const block1 = `{1:F01${senderBank.bic.padEnd(12, 'X')}0000000000}`;
  const block2 = `{2:I202${receiverBank.bic.padEnd(12, 'X')}N}`;
  const block3 = `{3:{108:${ref}}{121:${uetr}}}`;
  
  let block4 = `{4:\n`;
  block4 += `:20:${ref}\n`;
  block4 += `:21:NONREF\n`;
  block4 += `:32A:${dateYYMMDD}${ccy}${formattedAmount}\n`;
  block4 += `:52A:${senderBank.bic}\n`;
  block4 += `:53A:/${orderAcc}\n`;
  if (trx.intermediaryBank) {
    block4 += `:56A:${trx.intermediaryBank.bic}\n`;
  }
  block4 += `:57A:${receiverBank.bic}\n`;
  block4 += `:58A:/${benAcc}\n${receiverBank.bic}\n`;
  block4 += `:72:/BNF/${memo.toUpperCase()}\n`;
  block4 += `-}`;

  const mac = trx.macDigest || generateMacDigest(block4);
  const chk = Math.floor(10000000 + Math.random() * 90000000).toString(16).toUpperCase();
  const block5 = `{5:{MAC:${mac.slice(0, 8)}}{CHK:${chk}}}`;

  return `${block1}\n${block2}\n${block3}\n${block4}\n${block5}`;
}

export function generateIso20022Pacs008(trx: Partial<TransactionRecord> & { reference?: string }): string {
  const ref = trx.id || trx.reference || 'S2S-2026-98124';
  const uetr = trx.uetr || generateUETR();
  const now = new Date().toISOString();
  const senderBank = trx.senderBank || { bic: 'CENAIDJAXXXX' };
  const receiverBank = trx.receiverBank || { bic: 'DEUTDEDDXXXX' };
  const amount = trx.amount || 1250000;
  const ccy = trx.currency || 'USD';
  const senderAcc = trx.senderAccount || '014-9988-2101';
  const senderNm = trx.senderName || 'PACIFIC COMMODITIES TRADING CORP';
  const receiverAcc = trx.receiverAccount || 'DE89-DEUT-5007-0010-9944';
  const receiverNm = trx.receiverName || 'SIEMENS AG INDUSTRIAL DIVISION';
  const memo = trx.remittanceInfo || 'INVOICE PAYMENT';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${ref}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>${ref}</EndToEndId>
        <UETR>${uetr}</UETR>
      </PmtId>
      <IntrBkSttlmAmt Ccy="${ccy}">${amount.toFixed(2)}</IntrBkSttlmAmt>
      <Dbtr>
        <Nm>${senderNm}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id><Othr><Id>${senderAcc}</Id></Othr></Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId><BICFI>${senderBank.bic}</BICFI></FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId><BICFI>${receiverBank.bic}</BICFI></FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>${receiverNm}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id><Othr><Id>${receiverAcc}</Id></Othr></Id>
      </CdtrAcct>
      <RmtInf>
        <Ustrd>${memo}</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

export function generateIp2IpHexFrame(trx: Partial<TransactionRecord>): string {
  const senderBic = (trx.senderBank?.bic || 'CENAIDJA').padEnd(11, '.');
  const receiverBic = (trx.receiverBank?.bic || 'CHASUS33').padEnd(11, '.');
  const amount = (trx.amount || 5000000).toString().padEnd(12, '0');
  const ccy = trx.currency || 'USD';

  return `00000000: 4742 2d49 5032 4950 0000 041a ffff 0100  GB-IP2IP........
00000010: ${senderBic} 2020 ${receiverBic}  BICs............
00000020: 0000 0000 00${amount.slice(0, 4)} ${amount.slice(4, 8)} ${ccy}00 98e2 f1a0  .....LK@${ccy}.....
00000030: 5345 5454 4c45 4420 544c 5331 2e33 204d  SETTLED.TLS1.3.M
00000040: 544c 535f 4145 535f 3235 365f 4743 4d5f  TLS_AES_256_GCM_
00000050: 5348 4133 3834 0000 dead beef cafe babe  SHA384....\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD`;
}

export function parseSwiftMTMessage(raw: string): {
  messageType: string;
  senderBic: string;
  receiverBic: string;
  uetr: string;
  mac: string;
  chk: string;
  fields: Array<{ tag: string; label: string; value: string }>;
} {
  const result: any = {
    messageType: '103',
    senderBic: '',
    receiverBic: '',
    uetr: '',
    mac: '',
    chk: '',
    fields: []
  };

  // Block 1
  const b1 = raw.match(/\{1:F01([A-Z0-9]{8,12})/);
  if (b1) result.senderBic = b1[1];

  // Block 2
  const b2 = raw.match(/\{2:[IO](\d{3})([A-Z0-9]{8,12})/);
  if (b2) {
    result.messageType = b2[1];
    result.receiverBic = b2[2];
  }

  // Block 3
  const b3Uetr = raw.match(/\{121:([0-9a-fA-F-]{36})\}/);
  if (b3Uetr) result.uetr = b3Uetr[1];

  // Block 5
  const b5Mac = raw.match(/\{MAC:([0-9A-F]+)\}/);
  if (b5Mac) result.mac = b5Mac[1];
  const b5Chk = raw.match(/\{CHK:([0-9A-F]+)\}/);
  if (b5Chk) result.chk = b5Chk[1];

  // Field dictionary
  const labels: Record<string, string> = {
    '20': 'Transaction Reference Number',
    '21': 'Related Reference',
    '23B': 'Bank Operation Code',
    '32A': 'Value Date / Currency / Interbank Amount',
    '50K': 'Ordering Customer',
    '52A': 'Ordering Institution',
    '53A': 'Sender Correspondent (Nostro)',
    '56A': 'Intermediary Institution',
    '57A': 'Account With Institution (Beneficiary Bank)',
    '58A': 'Beneficiary Institution (FI)',
    '59': 'Beneficiary Customer',
    '70': 'Remittance Information',
    '71A': 'Details of Charges',
    '72': 'Sender to Receiver Information'
  };

  // Extract block 4 lines
  const b4 = raw.match(/\{4:\n?([\s\S]*?)\n?-?\}/);
  if (b4) {
    const text = b4[1];
    const regex = /:([0-9]{2}[A-Z]?):([\s\S]*?)(?=(?:\n:[0-9]{2}[A-Z]?:)|$)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const tag = match[1];
      const val = match[2].trim();
      result.fields.push({
        tag: `:${tag}:`,
        label: labels[tag] || 'Custom FIN Field',
        value: val
      });
    }
  }

  return result;
}
