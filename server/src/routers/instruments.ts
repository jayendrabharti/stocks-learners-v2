import { GetHistoricalData } from "@/controllers/historicalData";
import { Instruments } from "@/controllers/instruments";
import { GetLiveData } from "@/controllers/liveData";
import { Router } from "express";

const InstrumentRouter = Router();

InstrumentRouter.get("/", Instruments);
InstrumentRouter.get("/live-data", GetLiveData);
InstrumentRouter.get("/historical-data", GetHistoricalData);

export default InstrumentRouter;
