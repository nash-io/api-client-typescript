export enum CryptoCurrency {
  ACAT = 'acat',
  ANT = 'ant',
  AE = 'ae',
  AGI = 'agi',
  AION = 'aion',
  AOA = 'aoa',
  APH = 'aph',
  APT = 'apt',
  ASA = 'asa',
  AVA = 'ava',
  BAT = 'bat',
  BCS = 'bcs',
  BDN = 'bdn',
  BHPC = 'bhpc',
  BNB = 'bnb',
  BNT = 'bnt',
  BRD = 'brd',
  BTC = 'btc',
  BTM = 'btm',
  C20 = 'c20',
  CENNZ = 'cennz',
  CGAS = 'cgas',
  CGE = 'cge',
  CGL = 'cgl',
  CHX = 'chx',
  CMT = 'cmt',
  CND = 'cnd',
  CNEO = 'cneo',
  COUP = 'coup',
  CPX = 'cpx',
  CREDO = 'credo',
  CRO = 'cro',
  CRPT = 'crpt',
  CTXC = 'ctxc',
  CVC = 'cvc',
  DAD = 'dad',
  DAI = 'dai',
  DBC = 'dbc',
  DENT = 'dent',
  DENTACOIN = 'dentacoin',
  DGD = 'dgd',
  DGTX = 'dgtx',
  DRGN = 'drgn',
  EDG = 'edg',
  EDO = 'edo',
  EDR = 'edr',
  EDS = 'eds',
  EFX = 'efx',
  ELF = 'elf',
  ENG = 'eng',
  ENJ = 'enj',
  EPN = 'epn',
  ERD = 'erd',
  ETH = 'eth',
  EURS = 'eurs',
  EXT = 'ext',
  FTW = 'ftw',
  FTX = 'ftx',
  FUN = 'fun',
  GALA = 'gala',
  GAS = 'gas',
  GDM = 'gdm',
  GNT = 'gnt',
  GTA = 'gta',
  GTO = 'gto',
  GUARD = 'guard',
  GUNTHY = 'gunthy',
  GUSD = 'gusd',
  GVT = 'gvt',
  HOT = 'hot',
  HPT = 'hpt',
  HT = 'ht',
  IAM = 'iam',
  ICX = 'icx',
  INB = 'inb',
  INO = 'ino',
  IOST = 'iost',
  IOTX = 'iotx',
  JWT = 'jwt',
  KIN = 'kin',
  KNC = 'knc',
  LINK = 'link',
  LKY = 'lky',
  LOOM = 'loom',
  LRC = 'lrc',
  LRN = 'lrn',
  LX = 'lx',
  MANA = 'mana',
  MCO = 'mco',
  MCT = 'mct',
  MFT = 'mft',
  MGO = 'mgo',
  MKR = 'mkr',
  MRG = 'mrg',
  MRW = 'mrw',
  MXM = 'mxm',
  NAS = 'nas',
  NEC = 'nec',
  NEO = 'neo',
  NEX = 'nex',
  NEXO = 'nexo',
  NKN = 'nkn',
  NNC = 'nnc',
  NOS = 'nos',
  NOIA = 'noia',
  NPXS = 'npxs',
  NRVE = 'nrve',
  NULS = 'nuls',
  NVL = 'nvl',
  OBT = 'obt',
  ODEM = 'odem',
  OMG = 'omg',
  ONT = 'ont',
  OSA = 'osa',
  PAX = 'pax',
  PAY = 'pay',
  PEGCNY = 'pegcny',
  PEGUSD = 'pegusd',
  PHX = 'phx',
  PKC = 'pkc',
  POLY = 'poly',
  POWR = 'powr',
  PPT = 'ppt',
  PRL = 'prl',
  PROQ = 'proq',
  QASH = 'qash',
  QBIT = 'qbit',
  QKC = 'qkc',
  QLC = 'qlc',
  QNT = 'qnt',
  R = 'r',
  RCPT = 'rcpt',
  REP = 'rep',
  RHT = 'rht',
  RLC = 'rlc',
  RNT = 'rnt',
  RPX = 'rpx',
  SAN = 'san',
  SCC = 'scc',
  SDS = 'sds',
  SDT = 'sdt',
  SENNO = 'senno',
  SGAS = 'sgas',
  SGT = 'sgt',
  SNT = 'snt',
  SOUL = 'soul',
  SPOT = 'spot',
  STORJ = 'storj',
  SWH = 'swh',
  SWTH = 'swth',
  SXDT = 'sxdt',
  TCT = 'tct',
  THETA = 'theta',
  THOR = 'thor',
  TKN = 'tkn',
  TKY = 'tky',
  TMN = 'tmn',
  TNC = 'tnc',
  TOLL = 'toll',
  TOMO = 'tomo',
  TRAC = 'trac',
  TUSD = 'tusd',
  USDC = 'usdc',
  USDT = 'usdt',
  UTD = 'utd',
  VEN = 'ven',
  VERI = 'veri',
  VIT = 'vit',
  WANDN = 'wandn',
  WAX = 'wax',
  WHT = 'wht',
  WIC = 'wic',
  WTC = 'wtc',
  WWB = 'wwb',
  XIN = 'xin',
  XQT = 'xqt',
  XQTA = 'xqta',
  XYO = 'xyo',
  YEZ = 'yez',
  ZIL = 'zil',
  ZPT = 'zpt',
  ZRX = 'zrx',

  MATIC = 'matic',
  DERC20 = 'derc20'
}

export const NEO_SYSTEM_ASSETS = [CryptoCurrency.NEO, CryptoCurrency.GAS]

export type CryptoCurrencies = CryptoCurrency[]

const { NEO, NEX, ETH, GAS, ACAT, QLC, PHX, DBC, BTC } = CryptoCurrency

interface CryptoCurrencyDefinition {
  companyName: string
}

// TODO: Deprecate asset definition (this information is now available on the backend)

export const CRYPTO_CURRENCY_DEFINITION: Partial<
  Record<CryptoCurrency, CryptoCurrencyDefinition>
> = {
  // NEO Chain (NEO/GAS/NEP5)
  [NEO]: {
    companyName: 'NEO'
  },
  [GAS]: {
    companyName: 'NEO'
  },
  [NEX]: {
    companyName: 'Nash'
  },
  [ACAT]: {
    companyName: 'Alphacat'
  },
  [QLC]: {
    companyName: 'QLink'
  },
  [PHX]: {
    companyName: 'Red Pulse'
  },
  [DBC]: {
    companyName: 'DeepBrain Chain'
  },
  // Ethereum Chain (ETH/ERC20)
  [ETH]: {
    companyName: 'Ethereum'
  },
  [BTC]: {
    companyName: 'Bitcoin'
  }
}

export const basePairTokens = [NEX, ETH, NEX]

export enum FiatCurrency {
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
  GBP = 'GBP',
  AUD = 'AUD',
  CAD = 'CAD',
  CHF = 'CHF',
  CNY = 'CNY',
  INR = 'INR',
  SGD = 'SGD',
  RUB = 'RUB'
}
