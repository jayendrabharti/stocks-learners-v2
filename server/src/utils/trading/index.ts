/**
 * Trading Utilities Index
 * Central export for all trading engine functions
 */

export {
  validateOrder,
  validateTickSize,
  validateLotSize,
  validateMISMargin,
  validateSellQuantity,
  type OrderValidationError,
  type OrderValidationResult,
} from "./validateOrder";

export {
  getLivePrice,
  getLiveMarketData,
  getBulkLivePrices,
} from "./livePrice";

export {
  calculateRealizedPnL,
  calculateUnrealizedPnL,
  calculateTotalUnrealizedPnL,
  calculateAvgPrice,
  calculatePositionMetrics,
  calculateROI,
  calculateBreakeven,
} from "./calculatePnL";

export {
  matchLotsForSell,
  getTotalAvailableQty,
  prepareLotUpdates,
  type LotConsumption,
} from "./fifoMatchLots";

export {
  recalculatePositionOnBuy,
  recalculatePositionOnSell,
  shouldClosePosition,
  createInitialPositionData,
  validatePositionConsistency,
  type PositionUpdateData,
} from "./updatePosition";

export {
  executeBuy,
  type BuyOrderInput,
  type BuyOrderResult,
} from "./executeBuy";

export {
  executeSell,
  type SellOrderInput,
  type SellOrderResult,
} from "./executeSell";

export {
  autoSquareOffMISPositions,
  scheduleAutoSquareOff,
  squareOffUserMISPositions,
  type AutoSquareOffResult,
} from "./autoSquareOff";
