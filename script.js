// --- Global Variables ---
let detailedLogBucketGlobal, detailedLogTRGlobal;
let historicalDataParsed = []; // To store parsed historical data

// --- PRNG and Return Generation (Monte Carlo) ---
function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let currentPRNG = Math.random;

function generateStandardNormal() {
  let u1 = 0,
    u2 = 0;
  // Guard against Math.log(0)
  while (u1 === 0) u1 = currentPRNG();
  while (u2 === 0) u2 = currentPRNG();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function generateReturn(mean, stdDev) {
  if (stdDev === 0) return mean; // No volatility
  return mean + generateStandardNormal() * stdDev;
}

// --- Formatting Functions ---
const fmtC = (v, digits = 0) =>
  typeof v !== "number" || isNaN(v)
    ? "N/A"
    : v.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
const fmtN = (v, digits = 0) =>
  typeof v !== "number" || isNaN(v)
    ? "N/A"
    : v.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
const fmtP = (v, digits = 1) =>
  typeof v !== "number" || isNaN(v) ? "N/A" : (v * 100).toFixed(digits) + "%";

// --- Input Gathering and Parsing ---
function getInputs() {
  const p = (id) => parseFloat(document.getElementById(id).value);
  const pc = (id) => p(id) / 100;
  const val = (id) => document.getElementById(id).value;
  const checked = (id) => document.getElementById(id).checked;

  const simulationMode = document.querySelector(
    'input[name="simulationMode"]:checked'
  ).value;
  const dollarBasis = document.querySelector(
    'input[name="dollarBasis"]:checked'
  ).value;

  let inputs = {
    simulationMode: simulationMode,
    dollarBasis: dollarBasis,
    startBalance: p("startBalance"),
    initialWithdrawal: p("initialWithdrawal"),
    timeHorizon: parseInt(p("timeHorizon")),
  };

  if (simulationMode === "monteCarlo") {
    inputs = {
      ...inputs,
      inflationRateMean: pc("inflationRate"),
      inflationRateStdDev: pc("inflationStdDev"), // New
      numSimulations: parseInt(p("numSimulations")),
      stockReturnMean: pc("stockReturn"),
      stockReturnStdDev: pc("stockStdDev"),
      bondReturnMean: pc("bondReturn"),
      bondReturnStdDev: pc("bondStdDev"),
      cashReturnMean: pc("cashReturn"),
      cashReturnStdDev: pc("cashStdDev"),
    };
  } else {
    // Historical mode
    // Historical data parsing will be handled separately if needed by runSimulations
    // For now, historicalDataParsed will be populated before calling simulation functions.
  }

  inputs = {
    ...inputs,
    bucket1Years: p("bucket1Years"),
    bucket1RefillThresholdYears: p("bucket1RefillThreshold"),
    bucket2YearsBonds: p("bucket2YearsBonds"),
    trStockAllocationRatio: pc("trStockAllocation"),
  };
  return inputs;
}

function parseHistoricalData() {
  const rawData = document.getElementById("historicalData").value.trim();
  if (!rawData) {
    alert("Please paste historical data.");
    return [];
  }
  const lines = rawData.split("\n");
  const parsed = [];
  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.toLowerCase().startsWith("year")) continue; // Skip empty lines or header
      const parts = line.split(",");
      if (parts.length < 5) {
        throw new Error(`Line ${i + 1} has too few columns: ${line}`);
      }
      parsed.push({
        year: parseInt(parts[0]),
        stockReturn: parseFloat(parts[1]),
        bondReturn: parseFloat(parts[2]),
        cashReturn: parseFloat(parts[3]),
        inflation: parseFloat(parts[4]),
      });
    }
    // Validate data
    if (parsed.length === 0) throw new Error("No valid data rows found.");
    for (const row of parsed) {
      if (
        isNaN(row.year) ||
        isNaN(row.stockReturn) ||
        isNaN(row.bondReturn) ||
        isNaN(row.cashReturn) ||
        isNaN(row.inflation)
      ) {
        throw new Error(
          `Invalid data found: ${JSON.stringify(
            row
          )}. Ensure all values are numbers.`
        );
      }
    }
    parsed.sort((a, b) => a.year - b.year); // Ensure chronological order
    return parsed;
  } catch (e) {
    alert(`Error parsing historical data: ${e.message}`);
    console.error("Historical data parsing error:", e);
    return [];
  }
}

function getRollingPeriods(fullHistoricalData, timeHorizon) {
  const periods = [];
  if (fullHistoricalData.length < timeHorizon) {
    return []; // Not enough data for a single period
  }
  for (let i = 0; i <= fullHistoricalData.length - timeHorizon; i++) {
    periods.push(fullHistoricalData.slice(i, i + timeHorizon));
  }
  return periods;
}

// --- Simulation Logic (Core) ---
// Shared logic for applying returns and handling withdrawals based on dollar basis
function applyYearlyEvents(
  portfolio,
  currentYearData,
  annualWithdrawalAmount,
  params
) {
  // currentYearData for historical: {stockReturn, bondReturn, cashReturn, inflation}
  // currentYearData for MC: {stockReturn, bondReturn, cashReturn, inflation (generated for this year)}

  let yearStockReturn = currentYearData.stockReturn;
  let yearBondReturn = currentYearData.bondReturn;
  let yearCashReturn = currentYearData.cashReturn;
  let yearInflation = currentYearData.inflation;

  let effectiveWithdrawal = annualWithdrawalAmount;

  if (params.dollarBasis === "nominal") {
    // Withdrawals inflate. Returns are nominal.
    // annualWithdrawalAmount passed to this function should already be inflated for the year.
  } else {
    // Real dollars
    // Withdrawals are constant real. Returns need to be converted to real.
    yearStockReturn = (1 + yearStockReturn) / (1 + yearInflation) - 1;
    yearBondReturn = (1 + yearBondReturn) / (1 + yearInflation) - 1;
    yearCashReturn = (1 + yearCashReturn) / (1 + yearInflation) - 1;
  }

  // Apply growth (using potentially adjusted real returns)
  if (portfolio.b1Balance !== undefined)
    portfolio.b1Balance *= 1 + yearCashReturn;
  if (portfolio.b2Balance !== undefined)
    portfolio.b2Balance *= 1 + yearBondReturn;
  if (portfolio.b3Balance !== undefined)
    portfolio.b3Balance *= 1 + yearStockReturn;

  if (portfolio.stockBalance !== undefined)
    portfolio.stockBalance *= 1 + yearStockReturn;
  if (portfolio.bondBalance !== undefined)
    portfolio.bondBalance *= 1 + yearBondReturn;

  return {
    yearStockReturn,
    yearBondReturn,
    yearCashReturn,
    yearInflation,
    effectiveWithdrawal,
  };
}

function simulateThreeBucketStrategy_Engine(
  params,
  historicalPeriodData = null,
  seed = null
) {
  if (params.simulationMode === "monteCarlo" && seed !== null) {
    currentPRNG = mulberry32(seed);
  }

  const detailedLog = [];
  let currentAnnualWithdrawal = params.initialWithdrawal; // Base withdrawal

  // Initial bucket allocation
  const bucket1TargetInitial = params.bucket1Years * params.initialWithdrawal; // Use initial withdrawal for setup
  let bucket1Balance = Math.min(params.startBalance, bucket1TargetInitial);
  const remainingAfterB1 = Math.max(0, params.startBalance - bucket1Balance);
  const bucket2TargetInitial =
    params.bucket2YearsBonds * params.initialWithdrawal;
  let bucket2Balance = Math.min(remainingAfterB1, bucket2TargetInitial);
  let bucket3Balance = Math.max(0, remainingAfterB1 - bucket2Balance);

  let totalPortfolioStartOfYear = params.startBalance;
  const annualPortfolioValues = [params.startBalance];

  for (let year = 0; year < params.timeHorizon; year++) {
    const logEntry = {
      year: year + 1,
      startPortfolio:
        totalPortfolioStartOfYear /* ... other fields init to 0/N/A ... */,
    };

    let yearMarketData;
    let actualWithdrawalForYear = currentAnnualWithdrawal; // This is nominal if nominal mode, real if real mode for BUCKET SIZING

    if (params.simulationMode === "monteCarlo") {
      const generatedInflation = generateReturn(
        params.inflationRateMean,
        params.inflationRateStdDev
      );
      yearMarketData = {
        stockReturn: generateReturn(
          params.stockReturnMean,
          params.stockReturnStdDev
        ),
        bondReturn: generateReturn(
          params.bondReturnMean,
          params.bondReturnStdDev
        ),
        cashReturn: generateReturn(
          params.cashReturnMean,
          params.cashReturnStdDev
        ),
        inflation: generatedInflation,
      };
      if (params.dollarBasis === "nominal") {
        actualWithdrawalForYear *= 1 + generatedInflation; // Current withdrawal amount inflates
      }
    } else {
      // Historical
      yearMarketData = historicalPeriodData[year]; // {year, stockReturn, bondReturn, cashReturn, inflation}
      if (params.dollarBasis === "nominal") {
        actualWithdrawalForYear *= 1 + yearMarketData.inflation;
      }
    }
    logEntry.withdrawalForYear = actualWithdrawalForYear;
    logEntry.inflationForYear = yearMarketData.inflation; // Log the inflation used

    // --- Withdrawal Phase ---
    logEntry.b1Start = bucket1Balance;
    logEntry.b2Start = bucket2Balance;
    logEntry.b3Start = bucket3Balance;
    let withdrawalNeeded = actualWithdrawalForYear;

    const fromB1Withdraw = Math.min(withdrawalNeeded, bucket1Balance);
    bucket1Balance -= fromB1Withdraw;
    withdrawalNeeded -= fromB1Withdraw;
    logEntry.b1Withdrawal = fromB1Withdraw;

    if (withdrawalNeeded > 0) {
      const fromB2Withdraw = Math.min(withdrawalNeeded, bucket2Balance);
      bucket2Balance -= fromB2Withdraw;
      withdrawalNeeded -= fromB2Withdraw;
      logEntry.b2Withdrawal = fromB2Withdraw;
    }
    if (withdrawalNeeded > 0) {
      const fromB3Withdraw = Math.min(withdrawalNeeded, bucket3Balance);
      bucket3Balance -= fromB3Withdraw;
      withdrawalNeeded -= fromB3Withdraw;
      logEntry.b3Withdrawal = fromB3Withdraw;
    }

    if (
      withdrawalNeeded > 0 &&
      bucket1Balance + bucket2Balance + bucket3Balance === 0
    ) {
      logEntry.endPortfolio = 0;
      detailedLog.push(logEntry);
      for (let y = year; y < params.timeHorizon; y++)
        annualPortfolioValues.push(0);
      return {
        endingBalance: 0,
        success: false,
        annualValues: annualPortfolioValues,
        detailedLog: detailedLog,
      };
    }

    // --- Growth Phase (uses Real/Nominal logic from applyYearlyEvents) ---
    let portfolioForGrowth = { b1Balance, b2Balance, b3Balance };
    const { yearStockReturn, yearBondReturn, yearCashReturn } =
      applyYearlyEvents(
        portfolioForGrowth,
        yearMarketData,
        actualWithdrawalForYear,
        params
      );

    bucket1Balance = Math.max(0, portfolioForGrowth.b1Balance);
    bucket2Balance = Math.max(0, portfolioForGrowth.b2Balance);
    bucket3Balance = Math.max(0, portfolioForGrowth.b3Balance);

    logEntry.b1ReturnPercent = yearCashReturn; // Effective return
    logEntry.b2ReturnPercent = yearBondReturn;
    logEntry.b3ReturnPercentDecision = yearMarketData.stockReturn; // Decision based on nominal stock return
    logEntry.b3ReturnPercentEffective = yearStockReturn; // Effective return for growth

    logEntry.b1AfterGrowth = bucket1Balance;
    logEntry.b2AfterGrowth = bucket2Balance;
    logEntry.b3AfterGrowth = bucket3Balance;

    // --- Rebalancing/Refill Phase (based on nominal stock market performance and current withdrawal amount) ---
    const b1TargetDollar = params.bucket1Years * actualWithdrawalForYear; // Target based on current year's expenses
    const b2TargetDollar = params.bucket2YearsBonds * actualWithdrawalForYear;
    logEntry.b1TargetAmount = b1TargetDollar;
    logEntry.b2TargetAmount = b2TargetDollar;

    let totalPortfolioAfterGrowth =
      bucket1Balance + bucket2Balance + bucket3Balance;

    if (logEntry.b3ReturnPercentDecision >= 0) {
      // Market Up/Flat (nominal stock return)
      logEntry.reallocStrategy = "Market Up/Flat: Holistic";
      let b1Old = bucket1Balance,
        b2Old = bucket2Balance,
        b3Old = bucket3Balance;

      bucket1Balance = Math.min(totalPortfolioAfterGrowth, b1TargetDollar);
      let remainingForB2B3 = totalPortfolioAfterGrowth - bucket1Balance;
      bucket2Balance = Math.min(remainingForB2B3, b2TargetDollar);
      bucket3Balance = Math.max(0, remainingForB2B3 - bucket2Balance); // Ensure B3 not negative

      logEntry.b1RefillAmount = bucket1Balance - b1Old;
      // ... (rest of logging for rebalance transfers) ...
    } else {
      // Market Down
      logEntry.reallocStrategy = "Market Down: Conditional";
      const bucket1RefillTriggerLevel =
        params.bucket1RefillThresholdYears * actualWithdrawalForYear;
      if (bucket1Balance < bucket1RefillTriggerLevel) {
        let amountToRefillB1 = Math.max(0, b1TargetDollar - bucket1Balance);
        if (amountToRefillB1 > 0) {
          const fromB2Refill = Math.min(amountToRefillB1, bucket2Balance);
          bucket1Balance += fromB2Refill;
          bucket2Balance -= fromB2Refill;
          logEntry.b1RefillAmount += fromB2Refill;
          logEntry.b1RefillSource = "B2 Only";
          logEntry.b2TransferToB1 = -fromB2Refill;
        }
      }
      // If B2 has surplus after B1 check (and potential refill), move to B3
      if (bucket2Balance > b2TargetDollar) {
        const excessB2 = bucket2Balance - b2TargetDollar;
        logEntry.b2RebalanceTransfer = -excessB2; // Moving out of B2
        logEntry.b3RebalanceTransfer = excessB2; // Moving into B3
        bucket2Balance -= excessB2;
        bucket3Balance += excessB2;
      }
    }
    bucket1Balance = Math.max(0, bucket1Balance);
    bucket2Balance = Math.max(0, bucket2Balance);
    bucket3Balance = Math.max(0, bucket3Balance);

    logEntry.b1End = bucket1Balance;
    logEntry.b2End = bucket2Balance;
    logEntry.b3End = bucket3Balance;
    totalPortfolioStartOfYear =
      bucket1Balance + bucket2Balance + bucket3Balance;
    logEntry.endPortfolio = totalPortfolioStartOfYear;

    if (params.dollarBasis === "nominal") {
      currentAnnualWithdrawal = actualWithdrawalForYear; // It was already inflated for THIS year, becomes base for NEXT.
    } else {
      // currentAnnualWithdrawal remains params.initialWithdrawal in real terms.
      // actualWithdrawalForYear for next year will be the same real amount.
    }
    logEntry.nextYearWithdrawalBase = currentAnnualWithdrawal; // Base for next year before inflation adjustment (if nominal)

    detailedLog.push(logEntry);
    annualPortfolioValues.push(totalPortfolioStartOfYear);
  }
  return {
    endingBalance: totalPortfolioStartOfYear,
    success: totalPortfolioStartOfYear > 0,
    annualValues: annualPortfolioValues,
    detailedLog: detailedLog,
  };
}

function simulateTotalReturnStrategy_Engine(
  params,
  historicalPeriodData = null,
  seed = null
) {
  if (params.simulationMode === "monteCarlo" && seed !== null) {
    currentPRNG = mulberry32(seed);
  }

  const detailedLog = [];
  let portfolioBalance = params.startBalance;
  let currentAnnualWithdrawal = params.initialWithdrawal; // Base withdrawal

  let stockBalance = portfolioBalance * params.trStockAllocationRatio;
  let bondBalance = portfolioBalance * (1 - params.trStockAllocationRatio);
  const annualPortfolioValues = [params.startBalance];

  for (let year = 0; year < params.timeHorizon; year++) {
    const logEntry = {
      year: year + 1,
      startPortfolio: portfolioBalance /* ... other fields ... */,
    };

    let yearMarketData;
    let actualWithdrawalForYear = currentAnnualWithdrawal;

    if (params.simulationMode === "monteCarlo") {
      const generatedInflation = generateReturn(
        params.inflationRateMean,
        params.inflationRateStdDev
      );
      yearMarketData = {
        stockReturn: generateReturn(
          params.stockReturnMean,
          params.stockReturnStdDev
        ),
        bondReturn: generateReturn(
          params.bondReturnMean,
          params.bondReturnStdDev
        ),
        cashReturn: 0, // Not used directly by TR asset classes
        inflation: generatedInflation,
      };
      if (params.dollarBasis === "nominal") {
        actualWithdrawalForYear *= 1 + generatedInflation;
      }
    } else {
      // Historical
      yearMarketData = historicalPeriodData[year];
      if (params.dollarBasis === "nominal") {
        actualWithdrawalForYear *= 1 + yearMarketData.inflation;
      }
    }
    logEntry.withdrawalForYear = actualWithdrawalForYear;
    logEntry.inflationForYear = yearMarketData.inflation;

    // --- Withdrawal Phase ---
    logEntry.stockStart = stockBalance;
    logEntry.bondStart = bondBalance;
    if (portfolioBalance < actualWithdrawalForYear && portfolioBalance <= 0) {
      logEntry.endPortfolio = 0;
      detailedLog.push(logEntry);
      for (let y = year; y < params.timeHorizon; y++)
        annualPortfolioValues.push(0);
      return {
        endingBalance: 0,
        success: false,
        annualValues: annualPortfolioValues,
        detailedLog: detailedLog,
      };
    }

    let stockWithdrawal = 0,
      bondWithdrawal = 0;
    if (portfolioBalance > 0) {
      const totalToWithdraw = Math.min(
        actualWithdrawalForYear,
        portfolioBalance
      ); // Don't withdraw more than available
      stockWithdrawal = totalToWithdraw * (stockBalance / portfolioBalance);
      bondWithdrawal = totalToWithdraw * (bondBalance / portfolioBalance);
    }
    stockBalance -= stockWithdrawal;
    bondBalance -= bondWithdrawal;
    logEntry.stockWithdrawal = stockWithdrawal;
    logEntry.bondWithdrawal = bondWithdrawal;
    portfolioBalance = Math.max(0, stockBalance + bondBalance);
    logEntry.portfolioAfterWithdrawal = portfolioBalance;

    if (portfolioBalance === 0) {
      logEntry.endPortfolio = 0;
      detailedLog.push(logEntry);
      annualPortfolioValues.push(0);
      for (let y = year + 1; y < params.timeHorizon; y++)
        annualPortfolioValues.push(0);
      return {
        endingBalance: 0,
        success: false,
        annualValues: annualPortfolioValues,
        detailedLog: detailedLog,
      };
    }

    // --- Growth Phase ---
    let portfolioForGrowth = { stockBalance, bondBalance }; // Only stock/bond for TR
    const { yearStockReturn, yearBondReturn } = applyYearlyEvents(
      portfolioForGrowth,
      yearMarketData,
      actualWithdrawalForYear,
      params
    );

    stockBalance = Math.max(0, portfolioForGrowth.stockBalance);
    bondBalance = Math.max(0, portfolioForGrowth.bondBalance);
    portfolioBalance = stockBalance + bondBalance;

    logEntry.stockReturnPercent = yearStockReturn;
    logEntry.bondReturnPercent = yearBondReturn;
    logEntry.stockAfterGrowth = stockBalance;
    logEntry.bondAfterGrowth = bondBalance;

    // --- Rebalancing Phase ---
    if (portfolioBalance > 0) {
      const targetStock = portfolioBalance * params.trStockAllocationRatio;
      const targetBond = portfolioBalance * (1 - params.trStockAllocationRatio);
      logEntry.rebalanceStockAmount = targetStock - stockBalance;
      logEntry.rebalanceBondAmount = targetBond - bondBalance;
      stockBalance = targetStock;
      bondBalance = targetBond;
    }
    logEntry.stockEnd = stockBalance;
    logEntry.bondEnd = bondBalance;
    logEntry.endPortfolio = portfolioBalance;

    if (params.dollarBasis === "nominal") {
      currentAnnualWithdrawal = actualWithdrawalForYear;
    }
    logEntry.nextYearWithdrawalBase = currentAnnualWithdrawal;

    detailedLog.push(logEntry);
    annualPortfolioValues.push(portfolioBalance);
  }
  return {
    endingBalance: portfolioBalance,
    success: portfolioBalance > 0,
    annualValues: annualPortfolioValues,
    detailedLog: detailedLog,
  };
}

// --- Monte Carlo Runner ---
function runMonteCarlo(
  simulationFunction,
  numSimulations,
  baseParams,
  strategySpecificParams,
  initialSeedForSet
) {
  const allParams = {
    ...baseParams,
    ...strategySpecificParams,
    simulationMode: "monteCarlo",
  }; // Ensure mode is set
  const simResults = [];
  let successfulRuns = 0;

  for (let i = 0; i < numSimulations; i++) {
    const seed = initialSeedForSet + i;
    // Use the appropriate engine function
    const result =
      simulationFunction === simulateThreeBucketStrategy_Engine
        ? simulateThreeBucketStrategy_Engine(allParams, null, seed)
        : simulateTotalReturnStrategy_Engine(allParams, null, seed);

    simResults.push({
      seed: seed,
      endingBalance: result.endingBalance,
      annualValues: result.annualValues,
      success: result.success,
    });
    if (result.success) successfulRuns++;
  }

  simResults.sort((a, b) => a.endingBalance - b.endingBalance);
  const endingBalances = simResults.map((r) => r.endingBalance);
  const probSuccess = numSimulations > 0 ? successfulRuns / numSimulations : 0;
  const medianIdx = Math.floor(endingBalances.length / 2);
  const medianEndBal =
    endingBalances.length > 0 ? endingBalances[medianIdx] : 0;
  const medianRunSeed =
    simResults.length > 0 ? simResults[medianIdx].seed : initialSeedForSet;
  const p10 =
    endingBalances.length > 0
      ? endingBalances[Math.floor(endingBalances.length * 0.1)]
      : 0;
  const p90idx =
    endingBalances.length > 0
      ? Math.max(
          0,
          Math.min(
            endingBalances.length - 1,
            Math.floor(endingBalances.length * 0.9) -
              (endingBalances.length * 0.9 ===
                Math.floor(endingBalances.length * 0.9) &&
              endingBalances.length * 0.9 > 0
                ? 1
                : 0)
          )
        )
      : 0;
  const p90 = endingBalances.length > 0 ? endingBalances[p90idx] : 0;
  const medianAnnualValues = calculateMedianPath(
    simResults.map((r) => r.annualValues),
    baseParams.timeHorizon
  );

  return {
    medianEndingBalance: medianEndBal,
    probabilityOfSuccess: probSuccess,
    p10EndingBalance: p10,
    p90EndingBalance: p90,
    medianAnnualValues: medianAnnualValues,
    medianRunSeed: medianRunSeed,
  };
}

// --- Historical Backtesting Runner ---
function runHistoricalBacktest(
  simulationFunction,
  fullHistoricalData,
  baseParams,
  strategySpecificParams
) {
  const allParams = {
    ...baseParams,
    ...strategySpecificParams,
    simulationMode: "historical",
  }; // Ensure mode
  const rollingPeriods = getRollingPeriods(
    fullHistoricalData,
    baseParams.timeHorizon
  );
  if (rollingPeriods.length === 0) {
    return {
      probabilityOfSuccess: NaN,
      detailedLogs: [],
      firstPeriodLog: null,
    }; // Not enough data
  }

  let successfulRuns = 0;
  let firstPeriodDetailedLog = null;

  for (let i = 0; i < rollingPeriods.length; i++) {
    const periodData = rollingPeriods[i];
    const result =
      simulationFunction === simulateThreeBucketStrategy_Engine
        ? simulateThreeBucketStrategy_Engine(allParams, periodData)
        : simulateTotalReturnStrategy_Engine(allParams, periodData);

    if (result.success) successfulRuns++;
    if (i === 0) {
      // Capture log of the first simulated historical period
      firstPeriodDetailedLog = result.detailedLog;
    }
  }
  const probabilityOfSuccess =
    rollingPeriods.length > 0 ? successfulRuns / rollingPeriods.length : 0;
  return {
    probabilityOfSuccess,
    firstPeriodLog: firstPeriodDetailedLog,
    totalPeriods: rollingPeriods.length,
  };
}

// --- Charting and Display ---
function calculateMedianPath(allPaths, timeHorizon) {
  /* ... (keep existing) ... */
  const medianPath = [];
  for (let yearIdx = 0; yearIdx <= timeHorizon; yearIdx++) {
    // Iterate up to and including timeHorizon (e.g. 30 years means 31 data points: start + 30 ends)
    const valuesForYear = allPaths
      .map((path) => (path && path[yearIdx] !== undefined ? path[yearIdx] : 0))
      .sort((a, b) => a - b);
    medianPath.push(
      valuesForYear.length > 0
        ? valuesForYear[Math.floor(valuesForYear.length / 2)]
        : 0
    );
  }
  return medianPath;
}
function renderChart(svgElement, dataSets, timeHorizon, startBalance) {
  /* ... (keep existing) ... */
  svgElement.innerHTML = ""; // Clear previous chart
  const padding = { top: 20, right: 30, bottom: 50, left: 80 };
  const chartWidth =
    svgElement.width.baseVal.value - padding.left - padding.right;
  const chartHeight =
    svgElement.height.baseVal.value - padding.top - padding.bottom;

  let maxY = startBalance > 0 ? startBalance * 1.1 : 1000; // Initial sensible max Y
  if (dataSets && dataSets.length > 0 && dataSets[0].values.length > 0) {
    dataSets.forEach((dataSet) =>
      dataSet.values.forEach((val) => {
        if (typeof val === "number" && val > maxY) maxY = val;
      })
    );
    if (maxY < startBalance * 1.1 && startBalance > 0)
      maxY = startBalance * 1.1; // Ensure start balance is visible
  } else if (startBalance > 0) {
    maxY = startBalance * 1.1;
  } else {
    maxY = 1000; // Default if no data and no start balance
  }
  if (maxY === 0 && startBalance > 0) maxY = startBalance * 1.1;
  // Handle edge case where all values are 0 but start isn't
  else if (maxY === 0 && startBalance === 0) maxY = 100;

  const xScale = timeHorizon > 0 ? chartWidth / timeHorizon : chartWidth;
  const yScale = maxY > 0 ? chartHeight / maxY : 0; // Avoid division by zero if maxY is 0

  const ns = "http://www.w3.org/2000/svg";

  function createSVGElement(tag, attributes) {
    const el = document.createElementNS(ns, tag);
    for (const key in attributes) {
      el.setAttribute(key, attributes[key]);
    }
    return el;
  }

  function createText(
    x,
    y,
    anchor,
    content,
    rotation = 0,
    baseAdjust = 0,
    fontSize = "10px"
  ) {
    const text = createSVGElement("text", {
      x,
      y: y + baseAdjust,
      "text-anchor": anchor,
      style: `font-size: ${fontSize};`,
    });
    text.textContent = content;
    if (rotation)
      text.setAttribute("transform", `rotate(${rotation} ${x} ${y})`);
    return text;
  }

  // Axes
  svgElement.appendChild(
    createSVGElement("line", {
      x1: padding.left,
      y1: padding.top + chartHeight,
      x2: padding.left + chartWidth,
      y2: padding.top + chartHeight,
      stroke: "black",
    })
  );
  svgElement.appendChild(
    createSVGElement("line", {
      x1: padding.left,
      y1: padding.top,
      x2: padding.left,
      y2: padding.top + chartHeight,
      stroke: "black",
    })
  );

  // X-axis Ticks and Labels
  const xTickIncrement =
    timeHorizon >= 20 ? 5 : timeHorizon >= 10 ? 2 : timeHorizon > 0 ? 1 : 0;
  if (xTickIncrement > 0) {
    for (let i = 0; i <= timeHorizon; i += xTickIncrement) {
      const x = padding.left + i * xScale;
      svgElement.appendChild(
        createSVGElement("line", {
          x1: x,
          y1: padding.top + chartHeight,
          x2: x,
          y2: padding.top + chartHeight + 5,
          stroke: "black",
        })
      );
      svgElement.appendChild(
        createText(x, padding.top + chartHeight + 20, "middle", i)
      );
    }
  } else if (timeHorizon === 0) {
    svgElement.appendChild(
      createText(padding.left, padding.top + chartHeight + 20, "middle", 0)
    );
  }
  svgElement.appendChild(
    createText(
      padding.left + chartWidth / 2,
      svgElement.height.baseVal.value - 5,
      "middle",
      "Year",
      0,
      0,
      "12px"
    )
  );

  // Y-axis Ticks and Labels
  const numYTicks = 5;
  for (let i = 0; i <= numYTicks; i++) {
    const val = maxY * (i / numYTicks);
    const y = padding.top + chartHeight - (maxY > 0 ? val * yScale : 0); // If maxY is 0, place at bottom
    svgElement.appendChild(
      createSVGElement("line", {
        x1: padding.left - 5,
        y1: y,
        x2: padding.left,
        y2: y,
        stroke: "black",
      })
    );
    svgElement.appendChild(
      createText(
        padding.left - 10,
        y,
        "end",
        (val / 1000).toFixed(0) + "k",
        0,
        5
      )
    );
  }
  svgElement.appendChild(
    createText(
      padding.left / 3,
      padding.top + chartHeight / 2,
      "middle",
      "Portfolio Value ($)",
      -90,
      0,
      "12px"
    )
  );

  // Data Lines
  if (dataSets && dataSets.length > 0) {
    dataSets.forEach((dataSet) => {
      if (dataSet.values && dataSet.values.length > 0) {
        const polyline = createSVGElement("polyline", {
          fill: "none",
          stroke: dataSet.color,
          "stroke-width": "2",
        });
        let points = "";
        dataSet.values.forEach((val, index) => {
          if (typeof val !== "number" || isNaN(val)) val = 0; // Handle non-numeric or NaN
          const x = padding.left + index * xScale;
          const yVal = Math.max(0, val); // Ensure value is not negative for plotting height
          const y =
            padding.top +
            chartHeight -
            (maxY > 0 ? yVal * yScale : chartHeight); // If maxY is 0, all points at bottom
          points += `${x},${y} `;
        });
        polyline.setAttribute("points", points.trim());
        svgElement.appendChild(polyline);
      }
    });
  } else {
    svgElement.appendChild(
      createText(
        padding.left + chartWidth / 2,
        padding.top + chartHeight / 2,
        "middle",
        "No chart data available.",
        0,
        0,
        "14px"
      )
    );
  }
}

function displayResults(
  inputs,
  mcResultsBucket,
  mcResultsTR,
  histResultsBucket,
  histResultsTR
) {
  const resultsTableContainer = document.getElementById(
    "resultsTableContainer"
  );
  const chartSVG = document.getElementById("portfolioChart");
  const chartContainer = document.getElementById("chartContainer");
  const chartTitle = chartContainer.querySelector("h3");

  let tableHTML = `<table><thead><tr><th>Metric</th><th>Three-Bucket Strategy</th><th>Total Return Strategy</th></tr></thead><tbody>`;

  if (inputs.simulationMode === "monteCarlo") {
    tableHTML += `
            <tr><td>Probability of Success (Monte Carlo)</td><td>${fmtP(
              mcResultsBucket.probabilityOfSuccess
            )}</td><td>${fmtP(mcResultsTR.probabilityOfSuccess)}</td></tr>
            <tr><td>Median Ending Balance (Monte Carlo)</td><td>${fmtC(
              mcResultsBucket.medianEndingBalance
            )}</td><td>${fmtC(mcResultsTR.medianEndingBalance)}</td></tr>
            <tr><td>10th Percentile Ending Balance (MC)</td><td>${fmtC(
              mcResultsBucket.p10EndingBalance
            )}</td><td>${fmtC(mcResultsTR.p10EndingBalance)}</td></tr>
            <tr><td>90th Percentile Ending Balance (MC)</td><td>${fmtC(
              mcResultsBucket.p90EndingBalance
            )}</td><td>${fmtC(mcResultsTR.p90EndingBalance)}</td></tr>
        `;
    chartTitle.textContent = "Median Annual Portfolio Value (Monte Carlo Mode)";
    chartContainer.style.display = "block";
    const chartData = [
      {
        name: "Three-Bucket",
        values: mcResultsBucket.medianAnnualValues,
        color: "blue",
      },
      {
        name: "Total Return",
        values: mcResultsTR.medianAnnualValues,
        color: "red",
      },
    ];
    renderChart(chartSVG, chartData, inputs.timeHorizon, inputs.startBalance);
  } else {
    // Historical
    tableHTML += `
            <tr><td>Probability of Success (Historical)</td><td>${fmtP(
              histResultsBucket.probabilityOfSuccess
            )} (${histResultsBucket.totalPeriods} periods)</td><td>${fmtP(
      histResultsTR.probabilityOfSuccess
    )} (${histResultsTR.totalPeriods} periods)</td></tr>
        `;
    chartTitle.textContent =
      "Portfolio Value (Historical Mode - Chart N/A for aggregate)";
    chartSVG.innerHTML =
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Chart displays median Monte Carlo paths. Not applicable for historical aggregate.</text>';
    // chartContainer.style.display = "none"; // Or display message as above
  }
  tableHTML += `</tbody></table>`;
  resultsTableContainer.innerHTML = tableHTML;

  // Detailed Logs Display
  const detailedLogDiv = document.getElementById("detailedLogOutput");
  let logBucketData = null;
  let logTRData = null;
  let logBucketTitle = "Detailed Log: Three-Bucket Strategy";
  let logTRTitle = "Detailed Log: Total Return Strategy";

  if (inputs.simulationMode === "monteCarlo") {
    // Re-run median sim to get logs
    const medianBucketSim = simulateThreeBucketStrategy_Engine(
      { ...inputs, simulationMode: "monteCarlo" },
      null,
      mcResultsBucket.medianRunSeed
    );
    logBucketData = medianBucketSim.detailedLog;
    detailedLogBucketGlobal = logBucketData; // For CSV download

    const medianTRSim = simulateTotalReturnStrategy_Engine(
      { ...inputs, simulationMode: "monteCarlo" },
      null,
      mcResultsTR.medianRunSeed
    );
    logTRData = medianTRSim.detailedLog;
    detailedLogTRGlobal = logTRData; // For CSV download
    logBucketTitle += " (Median Monte Carlo Run)";
    logTRTitle += " (Median Monte Carlo Run)";
  } else {
    // Historical
    logBucketData = histResultsBucket.firstPeriodLog; // Log from the first historical period
    detailedLogBucketGlobal = logBucketData;

    logTRData = histResultsTR.firstPeriodLog;
    detailedLogTRGlobal = logTRData;
    logBucketTitle += " (First Historical Period Run)";
    logTRTitle += " (First Historical Period Run)";
  }

  if (logBucketData && logTRData) {
    detailedLogDiv.innerHTML = `
            <button type="button" class="collapsible">${logBucketTitle}</button>
            <div class="collapsible-content">
                <button class="download-button" onclick="downloadCSV(detailedLogBucketGlobal, '3_bucket_log.csv')">Download CSV</button>
                <div class="detailed-log-table-container">${generateDetailedLogTable(
                  logBucketData,
                  "3-bucket"
                )}</div>
            </div>
            <button type="button" class="collapsible">${logTRTitle}</button>
            <div class="collapsible-content">
                <button class="download-button" onclick="downloadCSV(detailedLogTRGlobal, 'total_return_log.csv')">Download CSV</button>
                <div class="detailed-log-table-container">${generateDetailedLogTable(
                  logTRData,
                  "total-return"
                )}</div>
            </div>
        `;
    detailedLogDiv.style.display = "block";
    addCollapsibleEventListeners();
  } else {
    detailedLogDiv.innerHTML =
      "<p>Detailed logs could not be generated for this mode/run.</p>";
    detailedLogDiv.style.display = "block";
  }
}

function generateDetailedLogTable(logData, strategyType) {
  /* ... (keep existing, but ensure headers match new logEntry fields if any) ... */
  if (!logData || logData.length === 0)
    return "<p>No detailed log data available for this run.</p>";
  // Make sure your logData entries contain all fields accessed here
  // e.g., entry.inflationForYear, entry.b3ReturnPercentDecision, entry.b3ReturnPercentEffective
  let headers, rows;
  if (strategyType === "3-bucket") {
    headers = `<th>Yr</th><th>Start Port.</th><th>W/D Amt</th><th>Inflation</th>
                       <th>B1 Start</th><th>B1 W/D</th><th>B1 Eff.Ret%</th><th>B1 Growth</th><th>B1 After Growth</th><th>B1 Target $</th><th>B1 Refill</th><th>B1 Src</th><th>B1 End</th>
                       <th>B2 Start</th><th>B2 W/D</th><th>B2 Eff.Ret%</th><th>B2 Growth</th><th>B2 After Growth</th><th>B2 Target $</th><th>B2 To B1</th><th>B2 Rebal.</th><th>B2 End</th>
                       <th>B3 Start</th><th>B3 W/D</th><th>B3 Nom.Ret% <mark>(Decision)</mark></th><th>B3 Eff.Ret%</th><th>B3 Growth</th><th>B3 After Growth</th><th>B3 To B1</th><th>B3 Rebal.</th><th>B3 End</th>
                       <th>Realloc Strat.</th><th>End Port.</th><th>Next Yr W/D Base</th>`;
    rows = logData
      .map(
        (entry) => `<tr>
                    <td>${fmtN(entry.year)}</td><td>${fmtC(
          entry.startPortfolio
        )}</td><td>${fmtC(entry.withdrawalForYear)}</td><td>${fmtP(
          entry.inflationForYear
        )}</td>
                    <td>${fmtC(entry.b1Start)}</td><td>${fmtC(
          entry.b1Withdrawal
        )}</td><td>${fmtP(entry.b1ReturnPercent)}</td><td>${fmtC(
          entry.b1GrowthAmount
        )}</td><td>${fmtC(entry.b1AfterGrowth)}</td><td>${fmtC(
          entry.b1TargetAmount
        )}</td><td>${fmtC(entry.b1RefillAmount)}</td><td>${
          entry.b1RefillSource || "N/A"
        }</td><td>${fmtC(entry.b1End)}</td>
                    <td>${fmtC(entry.b2Start)}</td><td>${fmtC(
          entry.b2Withdrawal
        )}</td><td>${fmtP(entry.b2ReturnPercent)}</td><td>${fmtC(
          entry.b2GrowthAmount
        )}</td><td>${fmtC(entry.b2AfterGrowth)}</td><td>${fmtC(
          entry.b2TargetAmount
        )}</td><td>${fmtC(entry.b2TransferToB1)}</td><td>${fmtC(
          entry.b2RebalanceTransfer
        )}</td><td>${fmtC(entry.b2End)}</td>
                    <td>${fmtC(entry.b3Start)}</td><td>${fmtC(
          entry.b3Withdrawal
        )}</td><td>${fmtP(entry.b3ReturnPercentDecision)}</td><td>${fmtP(
          entry.b3ReturnPercentEffective
        )}</td><td>${fmtC(entry.b3GrowthAmount)}</td><td>${fmtC(
          entry.b3AfterGrowth
        )}</td><td>${fmtC(entry.b3TransferToB1)}</td><td>${fmtC(
          entry.b3RebalanceTransfer
        )}</td><td>${fmtC(entry.b3End)}</td>
                    <td>${entry.reallocStrategy || "N/A"}</td><td>${fmtC(
          entry.endPortfolio
        )}</td><td>${fmtC(entry.nextYearWithdrawalBase)}</td>
                </tr>`
      )
      .join("");
  } else {
    // total-return
    headers = `<th>Yr</th><th>Start Port.</th><th>W/D Amt</th><th>Inflation</th><th>Port. After W/D</th>
                       <th>Stock Start</th><th>Stock W/D</th><th>Stock Eff.Ret%</th><th>Stock Growth</th><th>Stock After Growth</th><th>Stock Rebal.</th><th>Stock End</th>
                       <th>Bond Start</th><th>Bond W/D</th><th>Bond Eff.Ret%</th><th>Bond Growth</th><th>Bond After Growth</th><th>Bond Rebal.</th><th>Bond End</th>
                       <th>End Port.</th><th>Next Yr W/D Base</th>`;
    rows = logData
      .map(
        (entry) => `<tr>
                    <td>${fmtN(entry.year)}</td><td>${fmtC(
          entry.startPortfolio
        )}</td><td>${fmtC(entry.withdrawalForYear)}</td><td>${fmtP(
          entry.inflationForYear
        )}</td><td>${fmtC(entry.portfolioAfterWithdrawal)}</td>
                    <td>${fmtC(entry.stockStart)}</td><td>${fmtC(
          entry.stockWithdrawal
        )}</td><td>${fmtP(entry.stockReturnPercent)}</td><td>${fmtC(
          entry.stockGrowthAmount
        )}</td><td>${fmtC(entry.stockAfterGrowth)}</td><td>${fmtC(
          entry.rebalanceStockAmount
        )}</td><td>${fmtC(entry.stockEnd)}</td>
                    <td>${fmtC(entry.bondStart)}</td><td>${fmtC(
          entry.bondWithdrawal
        )}</td><td>${fmtP(entry.bondReturnPercent)}</td><td>${fmtC(
          entry.bondGrowthAmount
        )}</td><td>${fmtC(entry.bondAfterGrowth)}</td><td>${fmtC(
          entry.rebalanceBondAmount
        )}</td><td>${fmtC(entry.bondEnd)}</td>
                    <td>${fmtC(entry.endPortfolio)}</td><td>${fmtC(
          entry.nextYearWithdrawalBase
        )}</td>
                </tr>`
      )
      .join("");
  }
  return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

function downloadCSV(logData, filename) {
  /* ... (keep existing) ... */
  if (!logData || logData.length === 0) {
    alert("No data to download.");
    return;
  }
  const headers = Object.keys(logData[0]);
  const csvRows = [
    headers.join(","),
    ...logData.map((row) =>
      headers
        .map((header) => {
          let cell = row[header];
          if (typeof cell === "number" && isNaN(cell)) cell = "NaN";
          else if (cell === undefined) cell = "";
          else if (typeof cell === "string" && cell.includes(","))
            cell = `"${cell.replace(/"/g, '""')}"`;
          return cell;
        })
        .join(",")
    ),
  ];
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert("CSV download not supported by your browser.");
  }
}

// --- Event Listeners and UI Control ---
function addCollapsibleEventListeners() {
  /* ... (keep existing) ... */
  var coll = document.getElementsByClassName("collapsible");
  for (var i = 0; i < coll.length; i++) {
    coll[i].removeEventListener("click", toggleCollapsible); // Prevent multiple listeners
    coll[i].addEventListener("click", toggleCollapsible);
  }
}
function toggleCollapsible() {
  /* ... (keep existing) ... */
  this.classList.toggle("active");
  var content = this.nextElementSibling;
  if (content.style.display === "block") {
    content.style.display = "none";
  } else {
    content.style.display = "block";
  }
}

function toggleModeInputs() {
  const mode = document.querySelector(
    'input[name="simulationMode"]:checked'
  ).value;
  document.getElementById("monteCarloInputs").style.display =
    mode === "monteCarlo" ? "block" : "none";
  document.getElementById("historicalInputs").style.display =
    mode === "historical" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  addCollapsibleEventListeners();
  document.querySelectorAll('input[name="simulationMode"]').forEach((radio) => {
    radio.addEventListener("change", toggleModeInputs);
  });
  toggleModeInputs(); // Initial call to set visibility
});

// --- Main Simulation Trigger ---
function runSimulations() {
  const inputs = getInputs();
  const resultsStatusDiv = document.getElementById("resultsStatus");
  const resultsTableContainer = document.getElementById(
    "resultsTableContainer"
  );
  const chartSVG = document.getElementById("portfolioChart");
  const detailedLogDiv = document.getElementById("detailedLogOutput");
  const chartContainer = document.getElementById("chartContainer");

  // Basic Input Validations
  if (
    inputs.startBalance <= 0 ||
    inputs.initialWithdrawal < 0 ||
    inputs.timeHorizon <= 0
  ) {
    resultsStatusDiv.innerHTML =
      "<p style='color:red;'>Invalid inputs: Balance, Horizon > 0. Withdrawal >= 0.</p>";
    resultsTableContainer.innerHTML = "";
    chartSVG.innerHTML =
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Invalid inputs.</text>';
    detailedLogDiv.style.display = "none";
    return;
  }
  if (inputs.timeHorizon > 200) {
    resultsStatusDiv.innerHTML =
      "<p style='color:red;'>Time Horizon too large (max 200 years).</p>";
    resultsTableContainer.innerHTML = "";
    chartSVG.innerHTML =
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Time Horizon too large.</text>';
    detailedLogDiv.style.display = "none";
    return;
  }
  if (
    inputs.bucket1Years <= 0 ||
    inputs.bucket1RefillThresholdYears < 0 ||
    inputs.bucket1RefillThresholdYears > inputs.bucket1Years ||
    inputs.bucket2YearsBonds < 0
  ) {
    resultsStatusDiv.innerHTML =
      "<p style='color:red;'>Invalid Bucket strategy parameters.</p>";
    resultsTableContainer.innerHTML = "";
    chartSVG.innerHTML =
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Invalid Bucket inputs.</text>';
    detailedLogDiv.style.display = "none";
    return;
  }

  resultsStatusDiv.innerHTML = "<p>Running simulations... please wait.</p>";
  resultsTableContainer.innerHTML = ""; // Clear previous table
  chartContainer.style.display = "block"; // Ensure chart container is visible
  chartSVG.innerHTML =
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Calculating...</text>';
  detailedLogDiv.innerHTML = "<p>Calculating detailed logs...</p>";
  detailedLogDiv.style.display = "block";

  // Use setTimeout to allow UI to update before heavy computation
  setTimeout(() => {
    try {
      let mcResultsBucket = {},
        mcResultsTR = {};
      let histResultsBucket = {},
        histResultsTR = {};

      if (inputs.simulationMode === "monteCarlo") {
        if (inputs.numSimulations <= 0) {
          resultsStatusDiv.innerHTML =
            "<p style='color:red;'>Number of Monte Carlo simulations must be > 0.</p>";
          return;
        }
        const masterRunSeed = Date.now();
        mcResultsBucket = runMonteCarlo(
          simulateThreeBucketStrategy_Engine,
          inputs.numSimulations,
          inputs,
          {
            bucket1Years: inputs.bucket1Years,
            bucket1RefillThresholdYears: inputs.bucket1RefillThresholdYears,
            bucket2YearsBonds: inputs.bucket2YearsBonds,
          },
          masterRunSeed
        );
        mcResultsTR = runMonteCarlo(
          simulateTotalReturnStrategy_Engine,
          inputs.numSimulations,
          inputs,
          { trStockAllocationRatio: inputs.trStockAllocationRatio },
          masterRunSeed + inputs.numSimulations
        );
        resultsStatusDiv.innerHTML = "<p>Monte Carlo simulations complete.</p>";
      } else {
        // Historical
        historicalDataParsed = parseHistoricalData();
        if (historicalDataParsed.length === 0) {
          resultsStatusDiv.innerHTML =
            "<p style='color:red;'>Historical data could not be parsed or is empty.</p>";
          return;
        }
        if (historicalDataParsed.length < inputs.timeHorizon) {
          resultsStatusDiv.innerHTML = `<p style='color:red;'>Not enough historical data (${historicalDataParsed.length} years) for the selected time horizon (${inputs.timeHorizon} years).</p>`;
          return;
        }
        histResultsBucket = runHistoricalBacktest(
          simulateThreeBucketStrategy_Engine,
          historicalDataParsed,
          inputs,
          {
            bucket1Years: inputs.bucket1Years,
            bucket1RefillThresholdYears: inputs.bucket1RefillThresholdYears,
            bucket2YearsBonds: inputs.bucket2YearsBonds,
          }
        );
        histResultsTR = runHistoricalBacktest(
          simulateTotalReturnStrategy_Engine,
          historicalDataParsed,
          inputs,
          { trStockAllocationRatio: inputs.trStockAllocationRatio }
        );
        if (isNaN(histResultsBucket.probabilityOfSuccess)) {
          // Check if backtest had enough data
          resultsStatusDiv.innerHTML =
            "<p style='color:red;'>Not enough historical data for any rolling periods.</p>";
          return;
        }
        resultsStatusDiv.innerHTML = `<p>Historical backtesting complete across ${histResultsBucket.totalPeriods} rolling periods.</p>`;
      }

      displayResults(
        inputs,
        mcResultsBucket,
        mcResultsTR,
        histResultsBucket,
        histResultsTR
      );
    } catch (e) {
      console.error("Error during simulation or display:", e);
      resultsStatusDiv.innerHTML = `<p style='color:red;'>An error occurred: ${e.message}. Check console.</p>`;
      chartSVG.innerHTML =
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Error.</text>';
      detailedLogDiv.innerHTML = `<p style='color:red;'>An error occurred: ${e.message}. Check console.</p>`;
    }
  }, 50);
}
