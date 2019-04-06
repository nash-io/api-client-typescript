export interface MarketData {
  [key: string]: MarketDetail;
}

export interface MarketDetail {
  MinTickSize: number;
  MinTradeSize: number;
}
