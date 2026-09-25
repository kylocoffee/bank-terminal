export type TransferProtocol = 
  | 'S2S_STP'          // Server-to-Server Straight Through Processing
  | 'IP2IP_DIRECT'      // IP-to-IP Host-to-Host Direct Socket Tunnel
  | 'SWIFT_MT103'       // Single Customer Credit Transfer
  | 'SWIFT_MT202'       // General Financial Institution Transfer
  | 'ISO20022_PACS008'  // FI to FI Customer Credit Transfer (MX)
  | 'ISO20022_PACS009'  // FI to FI Financial Institutional Transfer
  | 'BI_RTGS'           // Real Time Gross Settlement
  | 'FEDWIRE';          // US Federal Reserve Wire Network

export type TransactionStatus = 
  | 'QUEUED'
  | 'HSM_SIGNING'
  | 'IP_HANDSHAKE'
  | 'AML_SCREENING'
  | 'INTERMEDIARY_ROUTING'
  | 'SETTLED'
  | 'COMPLIANCE_HOLD'
  | 'REJECTED';

export type ChargeType = 'OUR' | 'BEN' | 'SHA';

export type UserRole = 'SYSTEM_ADMIN' | 'COMPLIANCE_OFFICER' | 'TREASURY_OPERATOR' | 'AUDITOR';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  operatorCode: string;
  department: string;
  stationId: string;
  lastLogin: string;
}

export interface BankParticipant {
  bic: string;
  name: string;
  country: string;
  city: string;
  ip: string;
  port: number;
  routingCode?: string;
  headquartersAddress?: string;
  clearingCodeName?: string;
  leiCode?: string;
  supportedProtocols: TransferProtocol[];
  isIntermediaryCorrespondent?: boolean;
}

export interface NostroAccount {
  id: string;
  accountNumber: string;
  type: 'NOSTRO' | 'VOSTRO' | 'LORO';
  currency: 'USD' | 'EUR' | 'IDR' | 'GBP' | 'SGD' | 'CHF' | 'JPY';
  correspondentBic: string;
  correspondentName: string;
  balance: number;
  availableBalance: number;
  reservedBalance: number;
  lastUpdated: string;
}

export interface SystemConfig {
  gatewayNodeName: string;
  coreBankingIp: string;
  swiftAlliancePort: number;
  amlThresholdAmount: number;
  autoSettleStp: boolean;
  strictHsmSignatures: boolean;
  maintenanceMode: boolean;
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp?: string;
  details?: string;
  rawPayloadSnippet?: string;
}

export interface TransactionRecord {
  id: string; // Reference e.g. S2S-2026-98124
  uetr: string; // SWIFT Unique End-to-end Transaction Reference (UUIDv4)
  timestamp: string;
  protocol: TransferProtocol;
  status: TransactionStatus;
  
  // Ordering details
  senderBank: BankParticipant;
  senderAccount: string;
  senderName: string;
  senderAddress?: string;

  // Intermediary details
  intermediaryBank?: BankParticipant;
  
  // Beneficiary details
  receiverBank: BankParticipant;
  receiverAccount: string;
  receiverName: string;
  receiverAddress?: string;

  // Financials
  amount: number;
  currency: 'USD' | 'EUR' | 'IDR' | 'GBP' | 'SGD' | 'CHF' | 'JPY';
  exchangeRate?: number;
  charges: ChargeType;
  chargeAmount?: number;
  purposeCode: string;
  remittanceInfo: string;

  // Operator
  operatorId?: string;

  // Cryptography & S2S/IP2IP Specs
  ipTunnelInfo?: {
    sourceIP: string;
    destIP: string;
    port: number;
    tlsCipher: string;
    handshakeLatencyMs: number;
    packetCheckSum: string;
    socketFd: number;
  };
  hsmSignature: string;
  macDigest: string;
  sessionToken?: string;
  
  // Raw messages
  rawMTBlock?: string;
  rawISOPacs?: string;
  rawHexDump?: string;
  
  // Audit logs
  executionLogs: Array<{
    timestamp: string;
    stage: string;
    status: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
    message: string;
    node?: string;
  }>;
  settlementTimeMs?: number;
  rejectionReason?: string;
}

export interface HsmStatus {
  slotId: number;
  label: string;
  status: 'ONLINE_ACTIVE' | 'TAMPER_SECURE' | 'SYNCHRONIZING' | 'OFFLINE';
  firmwareVersion: string;
  activeKeyId: string;
  algorithm: 'RSA-4096 / SHA-256' | 'AES-256-GCM / HMAC' | 'ECC-SECP256K1';
  totalSignaturesGenerated: number;
  lastHealthCheck: string;
  sessionToken: string;
}

export type TerminalViewMode = 
  | 'LOGIN'
  | 'CLI'
  | 'S2S_FORM'
  | 'IP2IP_FORM'
  | 'NOSTRO_VOSTRO'
  | 'GPI_TRACKER'
  | 'MESSAGE_DECODER'
  | 'HSM_SECURITY'
  | 'AUDIT_LOGS'
  | 'ADMIN_SETTINGS'
  | 'STANDARDS_DOCS';

export interface CliHistoryItem {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'table' | 'banner' | 'raw';
  command?: string;
  content: string;
  timestamp: string;
}
