export type Direction = "Rises" | "Falls" | "Depends";

export interface ConceptGame {
  topicId: string;
  title: string;
  role: string;
  mechanic: string;
  mission: string;
  visual: string;
  driver: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  start: number;
  prediction: Direction;
  predictionPrompt: string;
  intuition: string;
  calculate: (value: number) => { value: string; label: string; note: string };
}

export const conceptGames: ConceptGame[] = [
  {
    topicId: "v1", title: "The Compounding Time Machine", role: "Return engineer", mechanic: "Move through time, predict wealth, then repair broken calculations.", mission: "Make timing, rates and probability visible before touching a formula.", visual: "timeline", driver: "Years invested", unit: "years", min: 1, max: 20, step: 1, start: 5, prediction: "Rises", predictionPrompt: "At a positive return, what happens to terminal wealth when time increases?", intuition: "Compounding earns a return on earlier returns. More positive-return periods increase terminal wealth non-linearly.",
    calculate: (years) => ({ value: (100 * 1.08 ** years).toFixed(1), label: "wealth from 100 at 8%", note: `${years} compounding periods` }),
  },
  {
    topicId: "v2", title: "Market Shock Control Room", role: "Policy operator", mechanic: "Inject a shock and stabilize the market before the cycle turns.", mission: "Trace incentives from the first shock to prices, output, trade and currencies.", visual: "market", driver: "Demand index", unit: "index", min: 70, max: 130, step: 5, start: 100, prediction: "Rises", predictionPrompt: "With supply unchanged, what normally happens to equilibrium price when demand rises?", intuition: "A rightward demand shift creates excess demand at the old price. Price rises until quantity supplied and demanded balance again.",
    calculate: (demand) => ({ value: (100 + (demand - 100) * 0.45).toFixed(1), label: "illustrative price pressure", note: "direction lab—not a forecast" }),
  },
  {
    topicId: "v3", title: "Capital Command", role: "Investment committee chair", mechanic: "Allocate scarce capital while funding costs and project risk move.", mission: "Approve only decisions that create value after financing and execution risk.", visual: "capital", driver: "Required return", unit: "%", min: 4, max: 20, step: 1, start: 10, prediction: "Falls", predictionPrompt: "For unchanged future cash flows, what happens to NPV when the required return rises?", intuition: "A higher required return discounts every future benefit more heavily, reducing present value and therefore NPV.",
    calculate: (rate) => ({ value: (120 / (1 + rate / 100) ** 2 - 90).toFixed(1), label: "two-year project NPV", note: "90 now; 120 received in year 2" }),
  },
  {
    topicId: "v4", title: "Statement Detective", role: "Forensic analyst", mechanic: "Follow accounting clues across three statements and expose weak earnings.", mission: "Separate reported profit from cash, sustainability and economic reality.", visual: "detective", driver: "Operating costs", unit: "% of sales", min: 50, max: 95, step: 5, start: 70, prediction: "Falls", predictionPrompt: "With revenue fixed, what happens to operating margin when operating costs rise?", intuition: "Operating margin is operating profit divided by revenue. Higher costs with unchanged revenue reduce both profit and margin.",
    calculate: (cost) => ({ value: (100 - cost).toFixed(0) + "%", label: "operating margin", note: "revenue normalized to 100" }),
  },
  {
    topicId: "v5", title: "Valuation Trading Desk", role: "Equity analyst", mechanic: "Quote a value, defend the assumptions and avoid buying a story at any price.", mission: "Keep observed market price separate from estimated intrinsic value.", visual: "equity", driver: "Long-run growth", unit: "%", min: 0, max: 9, step: 0.5, start: 4, prediction: "Rises", predictionPrompt: "Holding next dividend and required return fixed, what happens to Gordon-growth value when sustainable growth rises?", intuition: "Growth reduces the spread between required return and growth. Value rises sharply, which is why unrealistic growth assumptions are dangerous.",
    calculate: (growth) => ({ value: (5 / (0.1 - growth / 100)).toFixed(1), label: "value with D₁=5, k=10%", note: "valid only while growth < required return" }),
  },
  {
    topicId: "v6", title: "Bond Reactor", role: "Fixed-income navigator", mechanic: "Change yields, protect the portfolio and contain duration damage.", mission: "See every bond as a timeline of promised cash flows exposed to yield and credit risk.", visual: "bond", driver: "Market yield", unit: "%", min: 2, max: 14, step: 0.5, start: 8, prediction: "Falls", predictionPrompt: "For a fixed-rate bond, what normally happens to price when market yield rises?", intuition: "The promised cash flows do not change, but they are discounted at a higher rate. Their present value—and the bond price—falls.",
    calculate: (yieldRate) => { const y = yieldRate / 100; const price = 8 * (1 - (1 + y) ** -5) / y + 100 / (1 + y) ** 5; return { value: price.toFixed(1), label: "five-year 8% bond price", note: "annual coupon; par 100" }; },
  },
  {
    topicId: "v7", title: "Payoff Architect", role: "Replication engineer", mechanic: "Construct payoffs and close arbitrage gaps before competitors do.", mission: "Draw the terminal payoff first; price follows from replication and no-arbitrage.", visual: "derivative", driver: "Underlying price at expiry", unit: "", min: 60, max: 140, step: 5, start: 100, prediction: "Rises", predictionPrompt: "Once spot is above the strike, what happens to a long call payoff when terminal spot rises?", intuition: "A call pays max(0, spot minus strike). Above the strike, each additional unit of spot adds one unit of payoff.",
    calculate: (spot) => ({ value: Math.max(0, spot - 100).toFixed(0), label: "long-call payoff", note: "strike 100; premium excluded" }),
  },
  {
    topicId: "v8", title: "Due-Diligence Vault", role: "Alternative-assets investigator", mechanic: "Open opaque investments by testing liquidity, fees, leverage and valuation.", mission: "Find the risk hidden by smooth reported returns and complex structures.", visual: "vault", driver: "Annual management fee", unit: "%", min: 0, max: 4, step: 0.25, start: 2, prediction: "Falls", predictionPrompt: "Holding gross performance constant, what happens to investor wealth as recurring fees rise?", intuition: "Fees reduce the capital left to compound. A seemingly small annual charge produces a larger cumulative drag over long horizons.",
    calculate: (fee) => ({ value: (100 * (1 + (0.1 - fee / 100)) ** 10).toFixed(1), label: "ten-year net wealth", note: "100 initial; 10% gross; simplified fee drag" }),
  },
  {
    topicId: "v9", title: "Diversification Lab", role: "Portfolio constructor", mechanic: "Combine assets, control correlation and keep the investor’s constraints intact.", mission: "Build the whole portfolio—not a collection of individually attractive securities.", visual: "portfolio", driver: "Asset correlation", unit: "ρ", min: -1, max: 1, step: 0.1, start: 0.3, prediction: "Rises", predictionPrompt: "With weights and asset risks fixed, what happens to portfolio risk when correlation rises?", intuition: "Higher correlation increases the covariance contribution. The assets move together more, so diversification removes less risk.",
    calculate: (rho) => ({ value: (Math.sqrt(.25 * .15 ** 2 + .25 * .2 ** 2 + .5 * rho * .15 * .2) * 100).toFixed(1) + "%", label: "equal-weight portfolio risk", note: "asset risks 15% and 20%" }),
  },
  {
    topicId: "v10", title: "Ethics Court", role: "Standards adjudicator", mechanic: "Investigate facts, identify duties and issue a defensible verdict.", mission: "Resist instinctive moral reactions; decide from duties, material facts and required conduct.", visual: "ethics", driver: "Undisclosed conflict severity", unit: "risk", min: 0, max: 10, step: 1, start: 3, prediction: "Rises", predictionPrompt: "What happens to professional-conduct risk as an undisclosed material conflict becomes more severe?", intuition: "A material conflict can distort judgment or appear to do so. Clear, prominent disclosure—and sometimes avoidance—is needed to protect clients and trust.",
    calculate: (risk) => ({ value: risk < 4 ? "LOW" : risk < 7 ? "ELEVATED" : "CRITICAL", label: "misconduct warning", note: "learning signal—not a Standards formula" }),
  },
];
