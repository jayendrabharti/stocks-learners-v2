import { Router } from "express";
import { Instruments } from "../controllers/instruments.js";
import { GetLiveData } from "../controllers/liveData.js";
import { GetHistoricalData } from "../controllers/historicalData.js";

const InstrumentRouter = Router();

InstrumentRouter.get("/", Instruments);
InstrumentRouter.get("/live-data", GetLiveData);
InstrumentRouter.get("/historical-data", GetHistoricalData);
export default InstrumentRouter;
