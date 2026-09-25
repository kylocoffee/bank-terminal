export interface TechnicalSpecTopic {
  id: string;
  category: 'S2S' | 'IP2IP' | 'SWIFT' | 'NOSTRO_VOSTRO' | 'CRYPTOGRAPHY' | 'COMPLIANCE';
  title: string;
  subtitle: string;
  summary: string;
  sections: {
    heading: string;
    body: string;
    codeSnippet?: string;
  }[];
}

export const TECHNICAL_SPECIFICATIONS: TechnicalSpecTopic[] = [
  {
    id: 'SPEC-S2S-01',
    category: 'S2S',
    title: 'SERVER-TO-SERVER (S2S) STRAIGHT THROUGH PROCESSING',
    subtitle: 'Automated Interbank Core-to-Core Execution Protocol',
    summary: 'Direct asynchronous core banking integration enabling high-volume wire settlement with zero manual operator touchpoints.',
    sections: [
      {
        heading: '1. Architecture & Network Topology',
        body: 'S2S (Server-to-Server) Straight-Through Processing connects Originating Financial Institution (OFI) clearing servers directly with Beneficiary or Intermediary Financial Institution (RFI) clearing nodes over private MPLS or IPsec VPN channels.',
        codeSnippet: `[ OFI Core Banking Server ]
           │ (HTTPS / TLS 1.3 mTLS Certificate Auth)
           ▼
[ GB-ITS Clearing Gateway / MQ Pipeline ]
           │ (Payload Parsing & AML Screening Engine)
           ▼
[ HSM Hardware Security Module ]  ──▶ RSA-4096 / HMAC Digitally Signed
           │
           ▼
[ Direct Nostro/Vostro Settlement Engine ]
           │
           ▼
[ RFI Core Gateway ] ──▶ MT910 Credit Confirmation Advice`
      },
      {
        heading: '2. Straight-Through Processing (STP) Lifecycle',
        body: 'Transactions meeting automated validation rules bypass manual teller queues. The STP engine verifies ordering customer balance, checks beneficiary routing BIC against active SWIFT directory, validates sanctions screening lists, and issues cryptographic MAC authorization within milliseconds.'
      },
      {
        heading: '3. Error Handling & Rollback Protocol',
        body: 'In case of network partition or unacknowledged socket disconnects, an automated ISO 20022 pacs.002 Payment Status Report or SWIFT MT199 query is dispatched to freeze correspondent ledger reserves and prevent double-spending.'
      }
    ]
  },
  {
    id: 'SPEC-IP2IP-02',
    category: 'IP2IP',
    title: 'IP-TO-IP (IP2IP) HOST-TO-HOST DIRECT SOCKET PROTOCOL',
    subtitle: 'Direct TCP Socket Gateway with Dual Mutual TLS 1.3',
    summary: 'Low-latency binary packet stream between host server sockets without third-party messaging network intermediaries.',
    sections: [
      {
        heading: '1. Direct Socket Connection Architecture',
        body: 'IP2IP establishes a dedicated point-to-point TCP stream directly between Bank A Server IP and Bank B Server IP over predetermined ports (standard: 8443 or custom 9000-9999).',
        codeSnippet: `TCP 3-Way Handshake -> SYN (Seq=0) -> SYN-ACK (Seq=0, Ack=1) -> ACK
mTLS 1.3 Handshake -> ClientHello -> ServerHello + X.509 Cert Exchange
Cryptographic Channel -> AES-256-GCM / SHA-384 Cipher Tunnel
Binary Wire Frame -> [Length: 4B][MsgType: 2B][Payload: N Bytes][MAC Checksum: 8B]`
      },
      {
        heading: '2. Frame Structure & Byte Specifications',
        body: 'Each transmission starts with a 4-byte header representing the frame payload length in big-endian format, followed by the message identification block, ISO/SWIFT payload, and a hardware-generated MAC authentication block.'
      },
      {
        heading: '3. Network Security & IP Whitelisting',
        body: 'Strict firewall rules permit incoming packets only from designated Classless Inter-Domain Routing (CIDR) blocks. Non-whitelisted packets are dropped at kernel level via iptables/BPF filter before reaching the banking daemon.'
      }
    ]
  },
  {
    id: 'SPEC-SWIFT-03',
    category: 'SWIFT',
    title: 'SWIFT FIN MESSAGING ARCHITECTURE (MT103 vs MT202)',
    subtitle: 'Financial Messaging Formats & Message Block Standard',
    summary: 'Standardized ISO 15022 / FIN messaging structures governing international customer and interbank wire clearing.',
    sections: [
      {
        heading: '1. SWIFT FIN 5-Block Standard Architecture',
        body: 'SWIFT FIN messages are formatted in five structural blocks demarcated by curly braces:',
        codeSnippet: `{1: Basic Header}        -> Application ID, Service ID, LT Address, Session & Sequence
{2: Application Header}  -> Message Type (e.g. 103/202), Destination BIC, Priority (N/U)
{3: User Header}         -> Field 121 (UETR UUID), Field 108 (Banking Priority)
{4: Text Block}          -> Core Financial Fields (:20:, :32A:, :50K:, :59:, :70:, :71A:)
{5: Trailer Block}       -> MAC Signature ({MAC:...}), Checksum ({CHK:...})`
      },
      {
        heading: '2. MT103 vs MT202 vs MT202COV Comparative Matrix',
        body: '• MT103: Single Customer Credit Transfer. Initiated by non-financial retail or corporate entity.\n• MT202: Financial Institution Transfer. Used strictly for bank-to-bank treasury and interbank liquidity settlements.\n• MT202COV: Cover Payment. Sent to intermediary bank to cover funds for an underlying MT103 customer payment.'
      }
    ]
  },
  {
    id: 'SPEC-NOSTRO-04',
    category: 'NOSTRO_VOSTRO',
    title: 'CORRESPONDENT BANKING & NOSTRO-VOSTRO RECONCILIATION',
    subtitle: 'Dual Ledger Accounting & Liquidity Management',
    summary: 'Mechanics of bilateral interbank accounts enabling cross-border foreign exchange and settlement clearing.',
    sections: [
      {
        heading: '1. Accounting Terminology',
        body: '• Nostro Account ("Our account at your bank"): Bank A holds an account denominated in foreign currency at Correspondent Bank B.\n• Vostro Account ("Your account at our bank"): Correspondent Bank B holds an account denominated in domestic currency at Bank A.\n• Loro Account ("Their account"): A third party bank account referenced in correspondence.',
        codeSnippet: `Transaction: Bank Mandiri (ID) transfers USD 1,000,000 to Deutsche Bank (DE)
1. Mandiri Nostro at JPMorgan NY is DEBITED: -$1,000,000 USD
2. JPMorgan NY credits Deutsche Bank Vostro account: +$1,000,000 USD
3. Deutsche Bank releases funds to recipient customer account in Frankfurt.`
      },
      {
        heading: '2. Daily Reconciliation & MT940 / MT950 Statements',
        body: 'Automated end-of-day reconciliation parses MT940 Customer Statement Messages and MT950 Statement Messages to balance mirror ledger records and identify float exceptions.'
      }
    ]
  },
  {
    id: 'SPEC-CRYPTO-05',
    category: 'CRYPTOGRAPHY',
    title: 'HARDWARE SECURITY MODULES (HSM) & KEY MANAGEMENT',
    subtitle: 'FIPS 140-2 Level 3 Cryptographic Architecture',
    summary: 'Hardware-enforced key generation, message signing, and Message Authentication Code (MAC) calculation.',
    sections: [
      {
        heading: '1. Key Generation & Dual Control',
        body: 'Banking encryption keys are never stored in plaintext software memory. Keys reside inside tamper-resistant cryptographic boundaries requiring M-of-N split smartcard authentication to initialize.',
        codeSnippet: `SWIFT MAC Generation:
1. Input Payload = Block 4 Text ({4:...})
2. Message Digest = HMAC-SHA256(SecretKey, Block4)
3. Cryptographic Hardware Signature = RSA-4096_Sign(Private_HSM_Key, Message_Digest)
4. Block 5 MAC Header = {MAC:98E2F1A0B7C41890}{CHK:A881}`
      }
    ]
  },
  {
    id: 'SPEC-AML-06',
    category: 'COMPLIANCE',
    title: 'AML, SANCTIONS SCREENING & OFAC CLEARANCE PROTOCOLS',
    subtitle: 'Automated Real-Time Watchlist & PEP Verification Engine',
    summary: 'Pre-settlement regulatory gate checks enforcing United Nations, OFAC, FATF, and national regulatory blacklists.',
    sections: [
      {
        heading: '1. Pre-Execution Screening Algorithms',
        body: 'Every ordering customer, beneficiary name, and remittance memo undergoes fuzzy phonetic string matching (Jaro-Winkler, Levenshtein Distance > 0.85) against global sanctions databases.',
        codeSnippet: `Screening Pipeline:
Incoming Wire -> Tokenize Fields -> Sanctions Dictionary Match -> Match Score >= 85%?
  ├─ YES: Trigger COMPLIANCE_HOLD, Alert Audit Officer, Freeze Nostro Reservation
  └─ NO:  Pass to Core Settlement Engine for Immediate Straight-Through Clearance`
      }
    ]
  }
];

// Compatibility export
export const ACADEMY_TOPICS = TECHNICAL_SPECIFICATIONS;
