import React, { createContext, useContext, useState } from 'react';
import { 
  BankParticipant, 
  NostroAccount, 
  TransactionRecord, 
  HsmStatus, 
  TerminalViewMode, 
  CliHistoryItem,
  ChargeType,
  TransferProtocol,
  ProcessingStep,
  UserProfile,
  SystemConfig
} from '../types/banking';
import { GLOBAL_BANKS, INITIAL_NOSTRO_ACCOUNTS } from '../data/mockBanks';
import { 
  generateUETR, 
  generateSwiftMT103, 
  generateSwiftMT202, 
  generateIso20022Pacs008, 
  generateIp2IpHexFrame, 
  generateMacDigest 
} from '../utils/mtFormatter';
import { terminalSound } from '../utils/soundEffects';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'USR-001',
    username: 'admin',
    fullName: 'Ir. Hendra Gunawan, Chief Banking Systems Architect',
    role: 'SYSTEM_ADMIN',
    operatorCode: 'OP-BRI-SYS-9901',
    department: 'BRI IT Core Infrastructure & Security Division',
    stationId: 'WS-BRI-NODE-SUDIRMAN-01',
    lastLogin: '2026-09-25 00:05:12 UTC'
  },
  {
    id: 'USR-002',
    username: 'treasury',
    fullName: 'Rizky Pratama, Lead International Treasury Dealer',
    role: 'TREASURY_OPERATOR',
    operatorCode: 'OP-BRI-TRS-4421',
    department: 'BRI International Banking & Treasury Division',
    stationId: 'WS-BRI-TREASURY-04',
    lastLogin: '2026-09-24 23:45:00 UTC'
  },
  {
    id: 'USR-003',
    username: 'compliance',
    fullName: 'Dewi Anggraini, AML & Sanctions Compliance Auditor',
    role: 'COMPLIANCE_OFFICER',
    operatorCode: 'OP-BRI-AML-8812',
    department: 'BRI Financial Crime & Sanctions Intelligence',
    stationId: 'WS-BRI-COMPLIANCE-02',
    lastLogin: '2026-09-24 22:15:30 UTC'
  }
];

export const INITIAL_CONFIG: SystemConfig = {
  gatewayNodeName: 'BRI-CORE-SAA-GATEWAY-01',
  coreBankingIp: '10.240.22.15',
  swiftAlliancePort: 8443,
  amlThresholdAmount: 500000,
  autoSettleStp: true,
  strictHsmSignatures: true,
  maintenanceMode: false
};

interface ExecuteTransferParams {
  protocol: TransferProtocol;
  senderBankBic: string;
  senderAccount: string;
  senderName: string;
  senderAddress?: string;
  intermediaryBankBic?: string;
  receiverBankBic: string;
  receiverAccount: string;
  receiverName: string;
  receiverAddress?: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'IDR' | 'GBP' | 'SGD' | 'CHF' | 'JPY';
  charges: ChargeType;
  remittanceInfo: string;
  ipTunnelConfig?: {
    sourceIP: string;
    destIP: string;
    port: number;
  };
  triggerSanctionHold?: boolean;
}

interface BankingContextType {
  // Authentication
  currentUser: UserProfile | null;
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  users: UserProfile[];
  addUser: (user: Omit<UserProfile, 'id'>) => void;
  deleteUser: (id: string) => void;

  // View & UI
  viewMode: TerminalViewMode;
  setViewMode: (mode: TerminalViewMode) => void;
  audioEnabled: boolean;
  setAudioEnabled: (enabled: boolean) => void;
  
  // Dynamic Banks
  banks: BankParticipant[];
  addBank: (bank: BankParticipant) => void;
  updateBank: (oldBic: string, bank: BankParticipant) => void;
  deleteBank: (bic: string) => void;

  // Dynamic Nostro Accounts
  nostroAccounts: NostroAccount[];
  addNostroAccount: (acc: NostroAccount) => void;
  updateNostroAccount: (id: string, acc: Partial<NostroAccount>) => void;
  deleteNostroAccount: (id: string) => void;

  // Dynamic System Config
  systemConfig: SystemConfig;
  updateSystemConfig: (config: Partial<SystemConfig>) => void;

  // Transactions & HSM
  transactions: TransactionRecord[];
  hsmStatus: HsmStatus;
  
  // CLI
  cliHistory: CliHistoryItem[];
  addCliItem: (item: Omit<CliHistoryItem, 'id' | 'timestamp'>) => void;
  clearCli: () => void;
  executeCliCommand: (cmd: string) => void;

  // Transfer Processing
  executeTransfer: (params: ExecuteTransferParams) => Promise<TransactionRecord>;
  activeProcessing: {
    isOpen: boolean;
    steps: ProcessingStep[];
    currentStepIndex: number;
    transaction?: TransactionRecord;
    isComplete: boolean;
  } | null;
  closeProcessing: () => void;
  
  // Detail Modal
  selectedTransaction: TransactionRecord | null;
  setSelectedTransaction: (trx: TransactionRecord | null) => void;

  // Actions
  releaseComplianceHold: (trxId: string) => void;
  renewHsmKeys: () => void;
  resetAllData: () => void;
}

const BankingContext = createContext<BankingContextType | undefined>(undefined);

const SEED_TRANSACTIONS: TransactionRecord[] = [
  {
    id: 'S2S-2026-98124',
    uetr: '4f92d410-b183-4ec3-a5c2-f19b889502ab',
    timestamp: '2026-09-25 00:01:14 GMT',
    protocol: 'S2S_STP',
    status: 'SETTLED',
    senderBank: GLOBAL_BANKS[1],
    senderAccount: '014-9988-2101',
    senderName: 'PACIFIC COMMODITIES TRADING CORP',
    senderAddress: 'TOWER 1, FINANCIAL DISTRICT, JAKARTA',
    intermediaryBank: GLOBAL_BANKS[4],
    receiverBank: GLOBAL_BANKS[5],
    receiverAccount: 'DE89-DEUT-5007-0010-9944',
    receiverName: 'SIEMENS AG INDUSTRIAL DIVISION',
    receiverAddress: 'WERNER-VON-SIEMENS-STR 1, MUNICH DE',
    amount: 1250000.00,
    currency: 'USD',
    exchangeRate: 1.0,
    charges: 'OUR',
    chargeAmount: 25.00,
    purposeCode: 'COMM_IMPORT_HEAVY_EQUIPMENT',
    remittanceInfo: 'INV-2026-EU-9812 INDUSTRIAL TURBINES PAYMENT',
    operatorId: 'OP-TRS-4421',
    ipTunnelInfo: {
      sourceIP: '10.240.14.88',
      destIP: '198.51.100.25',
      port: 8443,
      tlsCipher: 'TLS_AES_256_GCM_SHA384',
      handshakeLatencyMs: 14,
      packetCheckSum: '0xFA88E910',
      socketFd: 1042
    },
    hsmSignature: 'RSA4096_SIG_0x9B81A02E718293DFB83719A82E37482910AA',
    macDigest: '98E2F1A0B7C41890',
    executionLogs: [
      { timestamp: '00:01:14.102', stage: 'INGESTION', status: 'SUCCESS', message: 'Payload received via S2S Core Gateway Host.' },
      { timestamp: '00:01:14.215', stage: 'AML_CHECK', status: 'SUCCESS', message: 'OFAC & PEP automated screening PASSED with zero match.' },
      { timestamp: '00:01:14.340', stage: 'HSM_SIGN', status: 'SUCCESS', message: 'Digital MAC Digest signed by HSM Slot #01.' },
      { timestamp: '00:01:14.510', stage: 'ROUTING', status: 'SUCCESS', message: 'Intermediary Correspondent [CHASUS33XXX] Nostro debited.' },
      { timestamp: '00:01:14.890', stage: 'SETTLEMENT', status: 'SUCCESS', message: 'Target Nostro/Vostro confirmed. MT910 Credit Advised.' }
    ],
    settlementTimeMs: 788
  },
  {
    id: 'IP2IP-2026-55109',
    uetr: '88a14b30-9b04-4033-bf9c-11e402b88134',
    timestamp: '2026-09-24 23:45:20 GMT',
    protocol: 'IP2IP_DIRECT',
    status: 'SETTLED',
    senderBank: GLOBAL_BANKS[2],
    senderAccount: '008-1122-3344-55',
    senderName: 'GLOBAL TELCO INFRASTRUCTURES LTD',
    receiverBank: GLOBAL_BANKS[7],
    receiverAccount: 'SG55-DBSS-7171-9988-1100',
    receiverName: 'SINGTEL ASIA GATEWAYS CORP',
    amount: 850000.00,
    currency: 'USD',
    charges: 'SHA',
    purposeCode: 'TELCO_BANDWIDTH_TRANSIT',
    remittanceInfo: 'H2H DIRECT TRANSIT CLEARING Q3',
    operatorId: 'OP-SYS-9901',
    ipTunnelInfo: {
      sourceIP: '10.240.18.22',
      destIP: '203.116.89.50',
      port: 8443,
      tlsCipher: 'TLS_CHACHA20_POLY1305_SHA256',
      handshakeLatencyMs: 8,
      packetCheckSum: '0xCC41091A',
      socketFd: 2048
    },
    hsmSignature: 'RSA4096_SIG_0x77A1F028881920AABBC81920193740191827',
    macDigest: 'CC449182FA192038',
    executionLogs: [
      { timestamp: '23:45:20.004', stage: 'SOCKET_OPEN', status: 'SUCCESS', message: 'Direct TCP socket established to DBS Singapore.' },
      { timestamp: '23:45:20.040', stage: 'MUTUAL_AUTH', status: 'SUCCESS', message: 'Mutual X.509 Root CA certificates validated.' },
      { timestamp: '23:45:20.120', stage: 'DISPATCH', status: 'SUCCESS', message: 'ISO 20022 pacs.008 raw buffer transferred.' },
      { timestamp: '23:45:20.310', stage: 'SETTLEMENT', status: 'SUCCESS', message: 'Host-to-Host instant settlement finalized.' }
    ],
    settlementTimeMs: 306
  }
];

export const BankingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(INITIAL_USERS[0]);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [viewMode, setViewMode] = useState<TerminalViewMode>('CLI');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  
  const [banks, setBanks] = useState<BankParticipant[]>(GLOBAL_BANKS);
  const [nostroAccounts, setNostroAccounts] = useState<NostroAccount[]>(INITIAL_NOSTRO_ACCOUNTS);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(INITIAL_CONFIG);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(SEED_TRANSACTIONS);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);

  const [hsmStatus, setHsmStatus] = useState<HsmStatus>({
    slotId: 1,
    label: 'THALES-LUNA-HSM-PCIe #01 (PRIMARY-CORE)',
    status: 'ONLINE_ACTIVE',
    firmwareVersion: 'v7.8.2-FIPS140-2-L3',
    activeKeyId: '0x99A81-SEC-2026-CORP',
    algorithm: 'RSA-4096 / SHA-256',
    totalSignaturesGenerated: 142857,
    lastHealthCheck: '2026-09-25 00:05:00 GMT',
    sessionToken: 'HSM_SESS_8FA99201BB4391'
  });

  const [cliHistory, setCliHistory] = useState<CliHistoryItem[]>([
    {
      id: 'init-1',
      type: 'banner',
      content: `+------------------------------------------------------------------------------+
| PT BANK RAKYAT INDONESIA (PERSERO) TBK - SAA CORE CLEARING TERMINAL          |
| INSTITUTION: BANK BRI (BIC: BBBAIDJAXXX | BI ROUTING CODE: 002)              |
| LOCATION: GEDUNG BRI 1, JL. JEND. SUDIRMAN KAV. 44-46, JAKARTA 10210         |
| NODE: BRI-CORE-SAA-GATEWAY-01 | HOST IP: 10.240.22.15:8443 (ONLINE)         |
| PROTOCOLS: S2S STP | IP2IP DIRECT H2H | SWIFT MT103/MT202 | ISO 20022 MX     |
| CRYPTOGRAPHY: THALES LUNA HSM FIPS 140-2 LEVEL 3 (BRI CENTRAL DATA CENTER)  |
+------------------------------------------------------------------------------+
Type 'help' or press [F1] for command index.
Type 'banks' for Directory of Connected Counterparty Banks.
Type 'nostro' for BRI Multi-Currency Correspondent Ledgers.
Type 'admin' or press [F10] for BRI System & Node Management Console.
Type 'specs' or press [F9] for Official Technical Standards.`,
      timestamp: '00:00:01'
    }
  ]);

  const [activeProcessing, setActiveProcessing] = useState<{
    isOpen: boolean;
    steps: ProcessingStep[];
    currentStepIndex: number;
    transaction?: TransactionRecord;
    isComplete: boolean;
  } | null>(null);

  const login = (username: string, pass: string): boolean => {
    const trimmed = username.toLowerCase().trim();
    const found = users.find(u => u.username.toLowerCase() === trimmed);
    if (found) {
      setCurrentUser(found);
      setViewMode('CLI');
      terminalSound.playSettlementSuccess();
      addCliItem({
        type: 'success',
        content: `[AUTH] Operator session opened: ${found.fullName} (${found.role}) | Station: ${found.stationId}`
      });
      return true;
    }
    terminalSound.playWarningBuzzer();
    return false;
  };

  const logout = () => {
    terminalSound.playBeep(440, 0.1);
    setCurrentUser(null);
    setViewMode('LOGIN');
    addCliItem({
      type: 'output',
      content: '[AUTH] Terminal session terminated. Interface locked.'
    });
  };

  const addUser = (user: Omit<UserProfile, 'id'>) => {
    const newUser: UserProfile = {
      ...user,
      id: `USR-${Math.floor(100 + Math.random() * 900)}`
    };
    setUsers(prev => [...prev, newUser]);
    terminalSound.playPacketSent();
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    terminalSound.playKeyClick();
  };

  const addBank = (bank: BankParticipant) => {
    setBanks(prev => {
      const filtered = prev.filter(b => b.bic !== bank.bic);
      return [...filtered, bank];
    });
    terminalSound.playPacketSent();
    addCliItem({
      type: 'success',
      content: `[CONFIG] Bank participant registered: [${bank.bic}] ${bank.name} (${bank.country}) at ${bank.ip}:${bank.port}`
    });
  };

  const updateBank = (oldBic: string, updated: BankParticipant) => {
    setBanks(prev => prev.map(b => b.bic === oldBic ? updated : b));
    terminalSound.playPacketSent();
    addCliItem({
      type: 'success',
      content: `[CONFIG] Bank participant updated: [${updated.bic}] ${updated.name}`
    });
  };

  const deleteBank = (bic: string) => {
    setBanks(prev => prev.filter(b => b.bic !== bic));
    terminalSound.playWarningBuzzer();
    addCliItem({
      type: 'output',
      content: `[CONFIG] Bank participant removed: [${bic}]`
    });
  };

  const addNostroAccount = (acc: NostroAccount) => {
    setNostroAccounts(prev => {
      const filtered = prev.filter(a => a.id !== acc.id);
      return [...filtered, acc];
    });
    terminalSound.playPacketSent();
    addCliItem({
      type: 'success',
      content: `[NOSTRO] Ledger registered: ${acc.id} [${acc.accountNumber}] - ${acc.currency} ${acc.balance.toLocaleString()}`
    });
  };

  const updateNostroAccount = (id: string, acc: Partial<NostroAccount>) => {
    setNostroAccounts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, ...acc, lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' GMT' };
      }
      return a;
    }));
    terminalSound.playPacketSent();
  };

  const deleteNostroAccount = (id: string) => {
    setNostroAccounts(prev => prev.filter(a => a.id !== id));
    terminalSound.playWarningBuzzer();
  };

  const updateSystemConfig = (cfg: Partial<SystemConfig>) => {
    setSystemConfig(prev => ({ ...prev, ...cfg }));
    terminalSound.playPacketSent();
    addCliItem({
      type: 'success',
      content: '[CONFIG] Gateway parameters saved.'
    });
  };

  const addCliItem = (item: Omit<CliHistoryItem, 'id' | 'timestamp'>) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setCliHistory(prev => [...prev, {
      ...item,
      id: Math.random().toString(36).substring(2, 9),
      timestamp
    }]);
  };

  const clearCli = () => {
    setCliHistory([]);
    terminalSound.playBeep(600, 0.05);
  };

  const renewHsmKeys = () => {
    terminalSound.playPacketSent();
    const newKeyId = '0x' + Math.floor(10000000 + Math.random() * 90000000).toString(16).toUpperCase();
    const newSession = 'HSM_SESS_' + Math.random().toString(36).substring(2, 12).toUpperCase();
    setHsmStatus(prev => ({
      ...prev,
      activeKeyId: newKeyId,
      sessionToken: newSession,
      totalSignaturesGenerated: prev.totalSignaturesGenerated + 1,
      lastHealthCheck: new Date().toLocaleTimeString('en-GB', { hour12: false }) + ' GMT'
    }));
  };

  const releaseComplianceHold = (trxId: string) => {
    terminalSound.playSettlementSuccess();
    setTransactions(prev => prev.map(t => {
      if (t.id === trxId) {
        return {
          ...t,
          status: 'SETTLED',
          executionLogs: [
            ...t.executionLogs,
            {
              timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
              stage: 'MANUAL_RELEASE',
              status: 'SUCCESS',
              message: `Compliance Officer Override (${currentUser?.operatorCode || 'OP-AML-8812'}): False positive cleared.`
            },
            {
              timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
              stage: 'SETTLEMENT',
              status: 'SUCCESS',
              message: 'Interbank settlement finalized and Nostro ledger debited.'
            }
          ]
        };
      }
      return t;
    }));
  };

  const resetAllData = () => {
    setBanks(GLOBAL_BANKS);
    setNostroAccounts(INITIAL_NOSTRO_ACCOUNTS);
    setTransactions(SEED_TRANSACTIONS);
    setSystemConfig(INITIAL_CONFIG);
    clearCli();
    addCliItem({
      type: 'success',
      content: '[SYSTEM] Ledgers, participant nodes, Nostro balances, and queues reset to system baseline.'
    });
  };

  const executeTransfer = async (params: ExecuteTransferParams): Promise<TransactionRecord> => {
    terminalSound.playPacketSent();
    const uetr = generateUETR();
    const prefix = params.protocol === 'IP2IP_DIRECT' ? 'IP2IP' : 'S2S';
    const trxId = `${prefix}-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const timestampStr = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' GMT';

    const senderBank = banks.find(b => b.bic === params.senderBankBic) || banks[0] || GLOBAL_BANKS[0];
    const receiverBank = banks.find(b => b.bic === params.receiverBankBic) || banks[1] || GLOBAL_BANKS[1];
    const intermediaryBank = params.intermediaryBankBic ? banks.find(b => b.bic === params.intermediaryBankBic) : undefined;

    const rawMTBlock = params.protocol === 'SWIFT_MT202'
      ? generateSwiftMT202({
          reference: trxId,
          uetr,
          senderBank,
          receiverBank,
          intermediaryBank,
          orderingInstitutionAcc: params.senderAccount,
          beneficiaryInstitutionAcc: params.receiverAccount,
          amount: params.amount,
          currency: params.currency,
          remittanceInfo: params.remittanceInfo
        })
      : generateSwiftMT103({
          reference: trxId,
          uetr,
          senderBank,
          receiverBank,
          intermediaryBank,
          senderAccount: params.senderAccount,
          senderName: params.senderName,
          senderAddress: params.senderAddress,
          receiverAccount: params.receiverAccount,
          receiverName: params.receiverName,
          receiverAddress: params.receiverAddress,
          amount: params.amount,
          currency: params.currency,
          charges: params.charges,
          remittanceInfo: params.remittanceInfo
        });

    const rawISOPacs = generateIso20022Pacs008({
      reference: trxId,
      uetr,
      senderBank,
      receiverBank,
      senderAccount: params.senderAccount,
      senderName: params.senderName,
      receiverAccount: params.receiverAccount,
      receiverName: params.receiverName,
      amount: params.amount,
      currency: params.currency,
      charges: params.charges,
      remittanceInfo: params.remittanceInfo
    });

    const ipTunnelInfo = {
      sourceIP: params.ipTunnelConfig?.sourceIP || senderBank.ip,
      destIP: params.ipTunnelConfig?.destIP || receiverBank.ip,
      port: params.ipTunnelConfig?.port || receiverBank.port,
      tlsCipher: 'TLS_AES_256_GCM_SHA384',
      handshakeLatencyMs: Math.floor(6 + Math.random() * 15),
      packetCheckSum: '0x' + Math.floor(10000000 + Math.random() * 90000000).toString(16).toUpperCase(),
      socketFd: Math.floor(1024 + Math.random() * 3000)
    };

    const macDigest = generateMacDigest(rawMTBlock, hsmStatus.sessionToken);
    const hsmSignature = `RSA4096_SIG_0x${macDigest}${Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase()}`;

    const newRecord: TransactionRecord = {
      id: trxId,
      uetr,
      timestamp: timestampStr,
      protocol: params.protocol,
      status: params.triggerSanctionHold ? 'COMPLIANCE_HOLD' : 'SETTLED',
      senderBank,
      senderAccount: params.senderAccount,
      senderName: params.senderName,
      senderAddress: params.senderAddress,
      intermediaryBank,
      receiverBank,
      receiverAccount: params.receiverAccount,
      receiverName: params.receiverName,
      receiverAddress: params.receiverAddress,
      amount: params.amount,
      currency: params.currency,
      exchangeRate: 1.0,
      charges: params.charges,
      chargeAmount: params.charges === 'OUR' ? 25.00 : 0.00,
      purposeCode: 'INTERBANK_WIRE',
      remittanceInfo: params.remittanceInfo,
      operatorId: currentUser?.operatorCode || 'OP-SYS-9901',
      ipTunnelInfo,
      hsmSignature,
      macDigest,
      rawMTBlock,
      rawISOPacs,
      rawHexDump: generateIp2IpHexFrame({
        id: trxId,
        uetr,
        timestamp: timestampStr,
        protocol: params.protocol,
        status: 'SETTLED',
        senderBank,
        senderAccount: params.senderAccount,
        senderName: params.senderName,
        receiverBank,
        receiverAccount: params.receiverAccount,
        receiverName: params.receiverName,
        amount: params.amount,
        currency: params.currency,
        charges: params.charges,
        purposeCode: 'COMMERCIAL_SETTLEMENT',
        remittanceInfo: params.remittanceInfo,
        ipTunnelInfo,
        hsmSignature,
        macDigest,
        executionLogs: []
      }),
      executionLogs: [
        { timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.100', stage: 'VALIDATION', status: 'SUCCESS', message: `Core Ledger validated. Debtor account ${params.senderAccount} debited.` },
        { timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.250', stage: 'HSM_SIGNING', status: 'SUCCESS', message: `HSM Key ${hsmStatus.activeKeyId} generated signature MAC: ${macDigest.slice(0, 12)}.` },
        params.triggerSanctionHold 
          ? { timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.380', stage: 'AML_SANCTIONS', status: 'WARN', message: `OFAC / PEP Alert Flagged for entity "${params.receiverName}". Transaction queued for Compliance review.` }
          : { timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.380', stage: 'AML_SANCTIONS', status: 'SUCCESS', message: `Sanctions Screening cleared with zero OFAC/PEP matches.` },
        { timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.520', stage: 'NETWORK_HOP', status: 'SUCCESS', message: `Encrypted packet dispatched to ${receiverBank.name} [${receiverBank.ip}:${receiverBank.port}].` },
        params.triggerSanctionHold
          ? { timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.700', stage: 'STATUS', status: 'WARN', message: `Transaction held in Compliance Investigation Queue (COMPLIANCE_HOLD).` }
          : { timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.700', stage: 'SETTLEMENT', status: 'SUCCESS', message: `Settlement ACK confirmed. Nostro correspondent accounts updated.` }
      ],
      settlementTimeMs: 600
    };

    const steps: ProcessingStep[] = [
      { id: '1', label: '1. Ledger Fund Verification & Debtor Account Booking', status: 'running', details: `Checking balance on account ${params.senderAccount} (${params.currency} ${params.amount.toLocaleString()})` },
      { id: '2', label: '2. Cryptographic Hardware Security Module (HSM) Signing', status: 'pending', details: `Hashing SHA-256 Block 4 payload via Thales Luna HSM Slot #1 [Key: ${hsmStatus.activeKeyId}]` },
      { id: '3', label: '3. Real-Time AML & Sanction Screening (OFAC/PEP Check)', status: 'pending', details: `Verifying international sanction databases, counter-terrorism lists, and PEP rosters` },
      { id: '4', label: params.protocol === 'IP2IP_DIRECT' ? '4. IP2IP Direct Socket Tunnel Handshake (mTLS / Port 8443)' : '4. S2S STP Gateway Dispatch & Message Routing', status: 'pending', details: `Point-to-point socket tunnel to host ${receiverBank.ip} via ${ipTunnelInfo.tlsCipher}` },
      { id: '5', label: '5. Nostro/Vostro Correspondent Book Settlement & Final Advice', status: 'pending', details: `Crediting beneficiary correspondent ledger and emitting MT910 Credit Confirmation` }
    ];

    setActiveProcessing({
      isOpen: true,
      steps,
      currentStepIndex: 0,
      transaction: newRecord,
      isComplete: false
    });

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 320));
      terminalSound.playKeyClick();
      
      setActiveProcessing(prev => {
        if (!prev) return null;
        const updatedSteps = [...prev.steps];
        updatedSteps[i].status = (i === 2 && params.triggerSanctionHold) ? 'error' : 'completed';
        if (i + 1 < updatedSteps.length) {
          updatedSteps[i + 1].status = 'running';
        }
        return {
          ...prev,
          steps: updatedSteps,
          currentStepIndex: i + 1,
          isComplete: i === steps.length - 1
        };
      });
    }

    if (params.triggerSanctionHold) {
      terminalSound.playWarningBuzzer();
    } else {
      terminalSound.playSettlementSuccess();
      setNostroAccounts(prev => prev.map(acc => {
        if (acc.currency === params.currency && acc.type === 'NOSTRO') {
          return {
            ...acc,
            balance: Math.max(0, acc.balance - params.amount),
            availableBalance: Math.max(0, acc.availableBalance - params.amount),
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' GMT'
          };
        }
        return acc;
      }));
    }

    setTransactions(prev => [newRecord, ...prev]);
    setHsmStatus(prev => ({
      ...prev,
      totalSignaturesGenerated: prev.totalSignaturesGenerated + 1
    }));

    return newRecord;
  };

  const closeProcessing = () => {
    setActiveProcessing(null);
  };

  const executeCliCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addCliItem({
      type: 'input',
      command: trimmed,
      content: `SYS@${systemConfig.gatewayNodeName}:~$ ${trimmed}`
    });

    const parts = trimmed.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg1 = parts[1]?.toLowerCase();

    switch (mainCmd) {
      case 'help':
      case 'f1':
      case '?':
        addCliItem({
          type: 'table',
          content: `GLOBAL CLEARING & INTERBANK SETTLEMENT SYSTEM COMMAND INDEX:
================================================================================
 COMMAND             | KEY | FUNCTION
---------------------+-----+----------------------------------------------------
 help / ?            | F1  | Display terminal command directory
 s2s                 | F2  | Open Server-to-Server Straight-Through Form
 s2s --exec          |     | Execute instant MT103 wire transfer
 ip2ip               | F3  | Open IP-to-IP Host-to-Host Socket Gateway
 ip2ip --test        |     | Open direct socket frame transmission
 nostro              | F4  | Open Nostro & Vostro Foreign Currency Ledgers
 gpi [UETR/ID]       | F5  | Track end-to-end SWIFT GPI node hops & status
 decode [MT-TEXT]    | F6  | Parse and inspect SWIFT MT & ISO 20022 payloads
 decode --sample     |     | Load sample MT103 financial structure
 audit               | F7  | View transaction audit records & compliance holds
 hsm                 | F8  | Display Hardware Security Module (HSM) telemetry
 keygen              |     | Rotate cryptographic master signing keys
 docs                | F9  | Open Interbank Settlement Standards Manual
 admin               | F10 | Dynamic Bank, Nostro & System Management Console
 sanction --test     |     | Test AML / OFAC compliance hold workflow
 ping [BIC/IP]       |     | Test socket latency to correspondent banking host
 users               |     | List registered terminal operator clearances
 lock / logout       |     | Terminate operator session and lock terminal
 clear / cls         |     | Clear screen buffer
 reset               |     | Reset database ledgers to system baseline
================================================================================`
        });
        terminalSound.playBeep(880, 0.05);
        break;

      case 'admin':
      case 'settings':
      case 'f10':
        setViewMode('ADMIN_SETTINGS');
        addCliItem({
          type: 'output',
          content: '[ADMIN] Switched to Dynamic System Configuration & Bank Management Console [F10].'
        });
        break;

      case 's2s':
        if (arg1 === '--exec' || arg1 === '--demo') {
          addCliItem({
            type: 'output',
            content: '[S2S-STP] Executing automated STP Wire: BCA -> JPMorgan Chase NY (USD 500,000.00)...'
          });
          executeTransfer({
            protocol: 'S2S_STP',
            senderBankBic: banks[1]?.bic || 'CENAIDJAXXX',
            senderAccount: '014-8899-7711',
            senderName: 'PACIFIC AGRO COMMODITIES CORP',
            receiverBankBic: banks[4]?.bic || 'CHASUS33XXX',
            receiverAccount: 'US89-CHAS-0210-4491-0022',
            receiverName: 'GLOBAL COMMODITIES TRADING CORP',
            amount: 500000.00,
            currency: 'USD',
            charges: 'OUR',
            remittanceInfo: 'PAYMENT FOR COFFEE BEANS SHIPMENT CONT #9921'
          });
        } else {
          setViewMode('S2S_FORM');
          addCliItem({
            type: 'output',
            content: '[SYSTEM] Opened Server-to-Server (S2S) STP Wire Dispatcher [F2].'
          });
        }
        break;

      case 'ip2ip':
        if (arg1 === '--test') {
          addCliItem({
            type: 'output',
            content: '[IP2IP-SOCKET] Opening mTLS socket pipe to Deutsche Bank Frankfurt (Port 8443)...'
          });
          executeTransfer({
            protocol: 'IP2IP_DIRECT',
            senderBankBic: banks[2]?.bic || 'BMRIIDJAXXX',
            senderAccount: '008-5544-3322-11',
            senderName: 'MANDIRI TREASURY HOST',
            receiverBankBic: banks[5]?.bic || 'DEUTDEDDXXX',
            receiverAccount: 'DE89-DEUT-5007-0010-3321',
            receiverName: 'DEUTSCHE BANK AG TREASURY LIQUIDITY',
            amount: 1500000.00,
            currency: 'EUR',
            charges: 'SHA',
            remittanceInfo: 'INTERBANK LIQUIDITY OVERNIGHT REBALANCING',
            ipTunnelConfig: {
              sourceIP: banks[2]?.ip || '10.240.18.22',
              destIP: banks[5]?.ip || '193.159.24.110',
              port: 8443
            }
          });
        } else {
          setViewMode('IP2IP_FORM');
          addCliItem({
            type: 'output',
            content: '[SYSTEM] Opened IP2IP Direct Host-to-Host Gateway [F3].'
          });
        }
        break;

      case 'nostro':
      case 'vostro':
        setViewMode('NOSTRO_VOSTRO');
        addCliItem({
          type: 'output',
          content: '[SYSTEM] Opened Nostro & Vostro Correspondent Account Ledgers [F4].'
        });
        break;

      case 'gpi':
        setViewMode('GPI_TRACKER');
        addCliItem({
          type: 'output',
          content: '[SYSTEM] Opened SWIFT GPI Live Tracker & Network Hop Map [F5].'
        });
        break;

      case 'decode':
        setViewMode('MESSAGE_DECODER');
        if (arg1 === '--sample') {
          addCliItem({
            type: 'output',
            content: '[SYSTEM] Loaded sample SWIFT MT103 structure to Message Inspector [F6].'
          });
        } else {
          addCliItem({
            type: 'output',
            content: '[SYSTEM] Opened SWIFT MT & ISO 20022 Message Parser [F6].'
          });
        }
        break;

      case 'hsm':
      case 'crypto':
        setViewMode('HSM_SECURITY');
        addCliItem({
          type: 'output',
          content: `[HSM STATUS] Slot: #${hsmStatus.slotId} | Firmware: ${hsmStatus.firmwareVersion} | State: ${hsmStatus.status} | Key: ${hsmStatus.activeKeyId}`
        });
        break;

      case 'keygen':
        renewHsmKeys();
        addCliItem({
          type: 'success',
          content: `[HSM KEYGEN] Cryptographic master key generated: ID [${hsmStatus.activeKeyId}] | Token: [${hsmStatus.sessionToken}].`
        });
        break;

      case 'audit':
      case 'logs':
        setViewMode('AUDIT_LOGS');
        addCliItem({
          type: 'output',
          content: `[AUDIT] Opened Audit Trails & Compliance Screening Queue [F7]. Total recorded records: ${transactions.length}.`
        });
        break;

      case 'sanction':
        if (arg1 === '--test') {
          addCliItem({
            type: 'output',
            content: '[AML-CHECK] Dispatching transaction with sanctioned entity name...'
          });
          executeTransfer({
            protocol: 'S2S_STP',
            senderBankBic: banks[1]?.bic || 'CENAIDJAXXX',
            senderAccount: '014-9900-1122',
            senderName: 'SUMBER ENERGY CORP',
            receiverBankBic: banks[4]?.bic || 'CHASUS33XXX',
            receiverAccount: 'US89-CHAS-0210-9999-0011',
            receiverName: 'RESTRICTED MARITIME PETRO CORP [OFAC-SDN-FLAG]',
            amount: 750000.00,
            currency: 'USD',
            charges: 'OUR',
            remittanceInfo: 'VESSEL BUNKERING FUEL SETTLEMENT',
            triggerSanctionHold: true
          });
        } else {
          addCliItem({
            type: 'output',
            content: 'Usage: "sanction --test" to test AML / OFAC compliance hold.'
          });
        }
        break;

      case 'docs':
      case 'standards':
      case 'guide':
        setViewMode('STANDARDS_DOCS');
        addCliItem({
          type: 'output',
          content: '[DOCS] Opened Interbank Settlement Standards Documentation [F9].'
        });
        break;

      case 'users':
        addCliItem({
          type: 'table',
          content: `REGISTERED TERMINAL OPERATORS (${users.length}):\n` +
            users.map(u => ` • ${u.operatorCode.padEnd(12)} | ${u.username.padEnd(12)} | ${u.role.padEnd(20)} | ${u.fullName}`).join('\n')
        });
        break;

      case 'login':
        setViewMode('LOGIN');
        break;

      case 'lock':
      case 'logout':
        logout();
        break;

      case 'ping': {
        const target = arg1 || 'CHASUS33XXX';
        const bank = banks.find(b => b.bic.toLowerCase().includes(target) || b.ip.includes(target)) || banks[0];
        const latency = Math.floor(8 + Math.random() * 20);
        addCliItem({
          type: 'output',
          content: `PING ${bank.name} [${bank.ip}:${bank.port}]: 64 bytes packet. mTLS Handshake = OK. Latency: ${latency}ms. Node status: ACTIVE.`
        });
        terminalSound.playPacketSent();
        break;
      }

      case 'sound':
      case 'audio': {
        if (arg1 === 'off') {
          setAudioEnabled(false);
          addCliItem({ type: 'output', content: '[AUDIO] Terminal acoustic feedback MUTED.' });
        } else {
          setAudioEnabled(true);
          addCliItem({ type: 'output', content: '[AUDIO] Terminal acoustic feedback ENABLED.' });
        }
        break;
      }

      case 'clear':
      case 'cls':
        clearCli();
        break;

      case 'reset':
        resetAllData();
        break;

      default:
        terminalSound.playWarningBuzzer();
        addCliItem({
          type: 'error',
          content: `[ERR-404] Command '${trimmed}' not found. Type 'help' or press [F1] for command index.`
        });
        break;
    }
  };

  return (
    <BankingContext.Provider
      value={{
        currentUser,
        login,
        logout,
        users,
        addUser,
        deleteUser,
        viewMode,
        setViewMode,
        audioEnabled,
        setAudioEnabled,
        banks,
        addBank,
        updateBank,
        deleteBank,
        nostroAccounts,
        addNostroAccount,
        updateNostroAccount,
        deleteNostroAccount,
        systemConfig,
        updateSystemConfig,
        transactions,
        hsmStatus,
        cliHistory,
        addCliItem,
        clearCli,
        executeCliCommand,
        executeTransfer,
        activeProcessing,
        closeProcessing,
        selectedTransaction,
        setSelectedTransaction,
        releaseComplianceHold,
        renewHsmKeys,
        resetAllData
      }}
    >
      {children}
    </BankingContext.Provider>
  );
};

export function useBanking(): BankingContextType {
  const context = useContext(BankingContext);
  if (!context) {
    throw new Error('useBanking must be used within a BankingProvider');
  }
  return context;
}
