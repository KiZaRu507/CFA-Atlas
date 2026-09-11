import type { BeginnerBrief, Module, Topic } from "../types";

const foundations: Record<string, { mental: string; prior: string[]; words: [string, string][] }> = {
  v1: {
    mental: "Quantitative Methods is the language used to compare money across time, describe uncertain outcomes, and test whether an apparent pattern is real. Treat every calculation as a short story: what is known, what is unknown, and when does each cash flow occur?",
    prior: ["Percentages and decimal conversion", "Powers, roots, and rearranging a simple equation", "The difference between an observation and an average"],
    words: [["Return", "The gain or loss relative to the amount invested."], ["Probability", "A number from 0 to 1 describing how likely an event is."], ["Estimate", "A data-based approximation, not a certainty."]],
  },
  v2: {
    mental: "Economics explains how households, firms, governments, and countries respond when resources are limited. Start with incentives: when price, income, policy, or risk changes, who changes behavior and in which direction?",
    prior: ["Demand means willingness and ability to buy", "Supply means willingness and ability to sell", "A trade-off is what must be given up"],
    words: [["Marginal", "The effect of one additional unit."], ["Equilibrium", "The point where opposing forces balance."], ["Policy transmission", "How a policy decision reaches spending, prices, and output."]],
  },
  v3: {
    mental: "Corporate Issuers studies the company as a decision-making machine. It raises money, invests it, runs operations, and distributes value. Judge each choice by its cash-flow effect, risk, incentives, and cost of funding.",
    prior: ["A company owns assets and owes liabilities", "Debt must be repaid; equity carries residual ownership", "Cash timing matters even when accounting profit looks unchanged"],
    words: [["Stakeholder", "Anyone materially affected by the company."], ["Capital", "Long-term funding supplied by lenders or owners."], ["Liquidity", "Ability to meet near-term cash needs."]],
  },
  v4: {
    mental: "Financial Statement Analysis translates a company’s reports into an economic story. The income statement measures performance over a period, the balance sheet is a snapshot, and the cash-flow statement explains where cash came from and went.",
    prior: ["Assets are resources; liabilities are obligations", "Revenue is not automatically cash received", "An accounting entry normally affects at least two accounts"],
    words: [["Accrual", "Recognition based on economic activity, not only cash movement."], ["Expense", "A cost recognized in measuring period profit."], ["Carrying amount", "The value shown for an item on the balance sheet."]],
  },
  v5: {
    mental: "Equity Investments moves from how markets operate to how an analyst studies a business and estimates what its ownership claim may be worth. Keep market price separate from estimated intrinsic value.",
    prior: ["A share is a residual ownership claim", "Price is observed; value is estimated", "Higher expected return usually accompanies higher perceived risk"],
    words: [["Market order", "An instruction prioritizing execution over a specified price."], ["Index", "A rule-based measure of a selected market basket."], ["Intrinsic value", "An analyst’s estimate based on expected future benefits."]],
  },
  v6: {
    mental: "Fixed Income is the study of promised cash flows. Draw the timeline first: coupons, principal, dates, and contingencies. Price is the present value of expected cash flows at the required yield, so price and yield usually move in opposite directions.",
    prior: ["Present value discounts future money", "A basis point is 0.01 percentage point", "Credit risk and interest-rate risk are different"],
    words: [["Par value", "Principal amount used to calculate coupon and redemption."], ["Yield", "The return implied by price and promised cash flows."], ["Duration", "A measure of sensitivity to yield changes."]],
  },
  v7: {
    mental: "A derivative gets value from another asset or rate. Begin with the future payoff diagram, then ask what combination of cash and underlying assets can reproduce it. No-arbitrage pricing follows from replication.",
    prior: ["Long benefits when the referenced value rises; short benefits when it falls", "Payoff excludes the initial price or premium", "Present value connects future strike payments to today"],
    words: [["Underlying", "The asset, rate, or event that drives the contract."], ["Forward commitment", "Both parties are obligated to transact later."], ["Contingent claim", "Payoff occurs only under specified conditions."]],
  },
  v8: {
    mental: "Alternative Investments covers assets and strategies outside traditional listed stocks and bonds. The analytical challenge is limited liquidity, complex fees, appraisal-based values, leverage, and less comparable performance data.",
    prior: ["Illiquidity can prevent a quick sale", "Leverage magnifies gains and losses", "Reported volatility can understate economic risk"],
    words: [["Private capital", "Financing not traded on a public exchange."], ["Carried interest", "Performance-linked compensation to a manager."], ["Due diligence", "Structured investigation before investing."]],
  },
  v9: {
    mental: "Portfolio Management asks how investments work together for a specific investor. A good asset is not automatically a good portfolio addition: correlation, objectives, constraints, and risk capacity all matter.",
    prior: ["Diversification depends on imperfect co-movement", "Risk tolerance and ability to bear risk can differ", "A portfolio objective needs both return and risk"],
    words: [["IPS", "The written investment objectives and constraints."], ["Correlation", "How two returns move together."], ["Risk budget", "The amount and allocation of risk an investor accepts."]],
  },
  v10: {
    mental: "Ethics is applied judgment under professional duties. Identify the people owed a duty, the information or conflict involved, the action taken, and the protection the standard is trying to provide. Small facts often change the conclusion.",
    prior: ["Legal does not always mean ethical", "Disclosure does not cure every conflict", "Client interests and market integrity guide professional conduct"],
    words: [["Material", "Information a reasonable investor would likely consider important."], ["Dissociate", "Remove yourself from participation in misconduct."], ["Fair dealing", "Use procedures that do not unfairly favor selected clients."]],
  },
};

const focus: Record<string, string> = {
  "Rates and Returns": "Measure investment performance correctly and distinguish a one-period average from wealth compounded through time.",
  "Time Value of Money in Finance": "Move cash flows to a common date before comparing them, then infer price, return, or growth.",
  "Statistical Measures of Asset Returns": "Summarize the center, spread, shape, and co-movement of return data without letting one statistic tell the whole story.",
  "Probability Trees and Conditional Expectations": "Break uncertainty into branches, weight outcomes, and update beliefs when new evidence arrives.",
  "Portfolio Mathematics": "Combine asset returns and risk while recognizing that covariance—not asset risk alone—drives diversification.",
  "Simulation Methods": "Generate or resample possible outcomes while keeping model assumptions and sampling limitations visible.",
  "Estimation and Inference": "Use samples to learn about a population and quantify how much sampling uncertainty remains.",
  "Hypothesis Testing": "Turn a claim into a disciplined decision rule while controlling false rejection and missed detection.",
  "Parametric and Non-Parametric Tests of Independence": "Test association using a method suited to the data scale and distribution assumptions.",
  "Simple Linear Regression": "Estimate and interpret a linear relationship, diagnose its assumptions, and avoid treating association as causation.",
  "Introduction to Big Data Techniques": "Connect data type, processing method, model choice, validation, and responsible interpretation.",
  "The Firm and Market Structures": "Link cost, revenue, competitive structure, and output decisions to profit and long-run industry behavior.",
  "Understanding Business Cycles": "Recognize expansion, slowdown, contraction, and recovery through linked indicators rather than one headline number.",
  "Fiscal Policy": "Trace how government spending and taxation affect demand, debt, incentives, and the economy with timing constraints.",
  "Monetary Policy": "Trace how central-bank tools change financial conditions, expectations, inflation, and real activity.",
  "Introduction to Geopolitics": "Assess how power, resources, institutions, and cooperation costs affect investment outcomes.",
  "International Trade": "Explain gains from specialization and the distributional effects of tariffs, quotas, subsidies, and trade blocs.",
  "Capital Flows and the FX Market": "Understand who trades currencies, how exchange rates are quoted, and how regimes shape adjustment.",
  "Exchange Rate Calculations": "Keep quote direction consistent across cross rates, forward points, premiums, and arbitrage relationships.",
  "Organizational Forms, Corporate Issuer Features, and Ownership": "Compare control, liability, taxation, funding access, and continuity across business forms.",
  "Investors and Other Stakeholders": "Map claims, incentives, priority, and conflicts among lenders, owners, managers, employees, and society.",
  "Corporate Governance: Conflicts, Mechanisms, Risks, and Benefits": "Connect agency conflicts to governance mechanisms and evaluate whether oversight actually protects stakeholders.",
  "Working Capital and Liquidity": "Follow cash through inventory, receivables, and payables and distinguish temporary liquidity support from sustainable operations.",
  "Capital Investments and Capital Allocation": "Convert project cash flows into NPV and IRR decisions while accounting for timing, risk, and mutually exclusive choices.",
  "Capital Structure": "Understand how debt and equity mix changes taxes, flexibility, expected distress, and required returns.",
  "Business Models": "Explain how a company creates value, delivers it, earns revenue, and sustains the capabilities needed to compete.",
  "Introduction to Financial Statement Analysis": "Use a repeatable process from purpose and data collection through adjustments, analysis, conclusion, and follow-up.",
  "Analyzing Income Statements": "Separate sustainable operating performance from recognition choices, unusual items, and per-share presentation.",
  "Analyzing Balance Sheets": "Judge asset quality, obligations, measurement bases, and the economic meaning behind reported balances.",
  "Analyzing Statements of Cash Flows I": "Reconcile profit to operating cash and classify operating, investing, and financing flows consistently.",
  "Analyzing Statements of Cash Flows II": "Evaluate cash-flow quality, free cash flow, common-size patterns, and coverage ratios.",
  "Analysis of Inventories": "Understand how cost-flow assumptions and price changes affect inventory, profit, taxes, and ratios.",
  "Analysis of Long-Term Assets": "Track capitalization, depreciation, impairment, derecognition, and their effects across statements and ratios.",
  "Topics in Long-Term Liabilities and Equity": "Analyze leases, pensions, share-based compensation, and ownership transactions as financing and claim changes.",
  "Analysis of Income Taxes": "Reconcile accounting profit with taxable income and interpret deferred tax assets, liabilities, and valuation uncertainty.",
  "Financial Reporting Quality": "Distinguish high-quality sustainable reporting from biased estimates, earnings management, and departures from standards.",
  "Financial Analysis Techniques": "Use ratios and common-size analysis as questions about the business, not as isolated arithmetic.",
  "Introduction to Financial Statement Modeling": "Build linked operating assumptions into forecasts while maintaining internal statement consistency.",
  "Market Organization and Structure": "Connect participants, orders, trading venues, settlement, and market quality to execution outcomes.",
  "Security Market Indexes": "Understand how selection, weighting, rebalancing, and return calculation shape what an index represents.",
  "Market Efficiency": "Relate information incorporation, market frictions, anomalies, and behavioral limits to active investment opportunities.",
  "Overview of Equity Securities": "Compare common, preferred, public, private, and foreign ownership claims and their rights.",
  "Company Analysis: Past and Present": "Turn the business model, revenue drivers, margins, and working capital into a coherent historical diagnosis.",
  "Industry and Competitive Analysis": "Assess industry structure, life cycle, competition, and external forces before forecasting a company.",
  "Company Analysis: Forecasting": "Choose forecast objects, horizon, and approach; connect assumptions to revenue, margins, assets, and financing.",
  "Equity Valuation: Concepts and Basic Tools": "Estimate value from future dividends, cash flows, assets, or multiples while separating model inputs from market price.",
  "Portfolio Risk and Return: Part I": "Measure historical and expected return and risk across assets, including nominal versus real outcomes.",
  "Portfolio Risk and Return: Part II": "Connect diversification, beta, the efficient frontier, CML, and CAPM to required return.",
  "Portfolio Management: An Overview": "Follow the portfolio process from investor needs through construction, execution, monitoring, and rebalancing.",
  "Basics of Portfolio Planning and Construction": "Translate investor objectives and constraints into a usable IPS and strategic allocation.",
  "The Behavioral Biases of Individuals": "Identify cognitive and emotional biases from behavior, then choose a realistic mitigation method.",
  "Introduction to Risk Management": "Identify, measure, prioritize, modify, and monitor financial and non-financial risks within risk tolerance.",
};

function cleanSections(module: Module) {
  return [...new Set(module.sections.map((s) => s.title))]
    .filter((s) => !/^(introduction|preface|acknowledgments)$/i.test(s))
    .slice(0, 12);
}

export function beginnerBrief(topic: Topic, module: Module): BeginnerBrief {
  const base = foundations[topic.id];
  const sections = cleanSections(module);
  const central = focus[module.title] || `Build a practical mental model of ${module.title.toLowerCase()}, then distinguish its major classifications, calculations, and decision uses.`;
  return {
    mentalModel: `${base.mental} In this module, your central job is to ${central.charAt(0).toLowerCase()}${central.slice(1)}`,
    beforeYouStart: base.prior,
    outcomes: sections.slice(0, 6).map((s) => `Explain and apply ${s.toLowerCase()}.`),
    vocabulary: base.words.map(([term, plain]) => ({ term, plain })),
    studyOrder: ["Build the mental model", "Learn the key distinctions", "Work one example", "Retrieve without notes", "Mix it with older topics"],
  };
}
