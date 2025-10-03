// --- Global Variables ---
let detailedLogBucketGlobal, detailedLogTRGlobal;
let historicalDataParsed = []; // To store parsed historical data from custom input
const BUILT_IN_HISTORICAL_DATA_CSV = `Year,StockReturn,BondReturn,CashReturn,Inflation
1928,0.4381,0.0084,0.0308,-0.0116
1929,-0.0830,0.0420,0.0316,0.0058
1930,-0.2512,0.0454,0.0455,-0.0640
1931,-0.4384,-0.0256,0.0231,-0.0932
1932,-0.0864,0.0879,0.0107,-0.1027
1933,0.4998,0.0186,0.0096,0.0076
1934,-0.0119,0.0796,0.0028,0.0152
1935,0.4674,0.0447,0.0017,0.0299
1936,0.3194,0.0502,0.0017,0.0145
1937,-0.3534,0.0138,0.0028,0.0286
1938,0.2928,0.0421,0.0007,-0.0278
1939,-0.0110,0.0441,0.0005,0.0000
1940,-0.1067,0.0540,0.0004,0.0071
1941,-0.1277,-0.0202,0.0013,0.0993
1942,0.1917,0.0229,0.0034,0.0903
1943,0.2506,0.0249,0.0038,0.0296
1944,0.1903,0.0258,0.0038,0.0230
1945,0.3582,0.0380,0.0038,0.0225
1946,-0.0843,0.0313,0.0038,0.1813
1947,0.0520,0.0092,0.0060,0.0884
1948,0.0570,0.0195,0.0105,0.0299
1949,0.1830,0.0466,0.0112,-0.0207
1950,0.3081,0.0043,0.0120,0.0593
1951,0.2368,-0.0030,0.0152,0.0600
1952,0.1815,0.0227,0.0172,0.0075
1953,-0.0121,0.0414,0.0189,0.0075
1954,0.5256,0.0329,0.0094,-0.0074
1955,0.3260,-0.0134,0.0172,0.0037
1956,0.0744,-0.0226,0.0262,0.0299
1957,-0.1046,0.0680,0.0322,0.0290
1958,0.4372,-0.0210,0.0177,0.0176
1959,0.1206,-0.0265,0.0339,0.0173
1960,0.0034,0.1164,0.0287,0.0136
1961,0.2664,0.0206,0.0235,0.0067
1962,-0.0881,0.0569,0.0277,0.0133
1963,0.2261,0.0168,0.0316,0.0164
1964,0.1642,0.0373,0.0355,0.0097
1965,0.1240,0.0072,0.0395,0.0192
1966,-0.0997,0.0291,0.0486,0.0346
1967,0.2380,-0.0158,0.0429,0.0304
1968,0.1081,0.0327,0.0534,0.0472
1969,-0.0824,-0.0501,0.0667,0.0620
1970,0.0356,0.1675,0.0639,0.0557
1971,0.1422,0.0979,0.0433,0.0327
1972,0.1876,0.0282,0.0406,0.0341
1973,-0.1431,0.0366,0.0704,0.0871
1974,-0.2590,0.0199,0.0785,0.1234
1975,0.3700,0.0361,0.0579,0.0694
1976,0.2383,0.1598,0.0498,0.0486
1977,-0.0698,0.0129,0.0526,0.0670
1978,0.0651,-0.0078,0.0718,0.0902
1979,0.1852,0.0067,0.1005,0.1329
1980,0.3174,-0.0299,0.1139,0.1252
1981,-0.0470,0.0820,0.1404,0.0892
1982,0.2042,0.3281,0.1060,0.0383
1983,0.2234,0.0320,0.0862,0.0379
1984,0.0615,0.1373,0.0954,0.0395
1985,0.3124,0.2571,0.0747,0.0380
1986,0.1849,0.2428,0.0597,0.0110
1987,0.0581,-0.0496,0.0578,0.0443
1988,0.1654,0.0822,0.0667,0.0442
1989,0.3148,0.1769,0.0811,0.0465
1990,-0.0306,0.0624,0.0750,0.0611
1991,0.3023,0.1500,0.0538,0.0306
1992,0.0749,0.0936,0.0343,0.0290
1993,0.0997,0.1421,0.0300,0.0275
1994,0.0133,-0.0804,0.0425,0.0267
1995,0.3720,0.2348,0.0549,0.0254
1996,0.2268,0.0143,0.0501,0.0332
1997,0.3310,0.0994,0.0506,0.0170
1998,0.2834,0.1492,0.0478,0.0161
1999,0.2089,-0.0825,0.0464,0.0268
2000,-0.0903,0.1666,0.0582,0.0339
2001,-0.1185,0.0557,0.0340,0.0155
2002,-0.2197,0.1512,0.0161,0.0238
2003,0.2836,0.0038,0.0101,0.0188
2004,0.1074,0.0449,0.0137,0.0326
2005,0.0483,0.0287,0.0315,0.0342
2006,0.1561,0.0196,0.0473,0.0254
2007,0.0548,0.1021,0.0436,0.0408
2008,-0.3655,0.2010,0.0137,0.0009
2009,0.2594,-0.1112,0.0015,0.0272
2010,0.1482,0.0846,0.0014,0.0150
2011,0.0210,0.1604,0.0005,0.0296
2012,0.1589,0.0297,0.0009,0.0174
2013,0.3215,-0.0910,0.0006,0.0150
2014,0.1352,0.1075,0.0003,0.0076
2015,0.0138,0.0128,0.0005,0.0073
2016,0.1177,0.0069,0.0032,0.0207
2017,0.2161,0.0280,0.0093,0.0211
2018,-0.0423,-0.0002,0.0194,0.0191
2019,0.3121,0.0964,0.0206,0.0229
2020,0.1802,0.1133,0.0035,0.0136
2021,0.2847,-0.0442,0.0005,0.0704
2022,-0.1804,-0.1783,0.0202,0.0645
2023,0.2606,0.0388,0.0507,0.0335
2024,0.2488,-0.0164,0.0497,0.0275`;

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
  while (u1 === 0) u1 = currentPRNG();
  while (u2 === 0) u2 = currentPRNG();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

function generateReturn(mean, stdDev) {
  if (stdDev === 0) return mean;
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
  const historicalDataSource =
    simulationMode === "historical"
      ? document.querySelector('input[name="historicalDataSource"]:checked')
          .value
      : null;

  let inputs = {
    simulationMode: simulationMode,
    dollarBasis: dollarBasis,
    historicalDataSource: historicalDataSource, // New
    startBalance: p("startBalance"),
    initialWithdrawal: p("initialWithdrawal"),
    timeHorizon: parseInt(p("timeHorizon")),
  };

  if (simulationMode === "monteCarlo") {
    inputs = {
      ...inputs,
      inflationRateMean: pc("inflationRate"),
      inflationRateStdDev: pc("inflationStdDev"),
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
    // historicalDataParsed will be populated based on historicalDataSource choice
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

function parseHistoricalDataCSV(csvString) {
  // Renamed and generalized
  const rawData = csvString.trim();
  if (!rawData) {
    // Alert is handled by calling function if needed
    return [];
  }
  const lines = rawData.split("\n");
  const parsed = [];
  try {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.toLowerCase().startsWith("year")) continue;
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
    if (parsed.length === 0)
      throw new Error("No valid data rows found in CSV.");
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
    parsed.sort((a, b) => a.year - b.year);
    return parsed;
  } catch (e) {
    // Error is handled by calling function
    console.error("Historical data parsing error:", e);
    throw e; // Re-throw to be caught by runSimulations
  }
}

function getRollingPeriods(fullHistoricalData, timeHorizon) {
  const periods = [];
  if (!fullHistoricalData || fullHistoricalData.length < timeHorizon) {
    return [];
  }
  for (let i = 0; i <= fullHistoricalData.length - timeHorizon; i++) {
    periods.push(fullHistoricalData.slice(i, i + timeHorizon));
  }
  return periods;
}

// --- Simulation Logic (Core) ---
function applyYearlyEvents(
  portfolio,
  currentYearData,
  annualWithdrawalAmount,
  params
) {
  let yearStockReturn = currentYearData.stockReturn;
  let yearBondReturn = currentYearData.bondReturn;
  let yearCashReturn = currentYearData.cashReturn;

  if (params.dollarBasis === "real") {
    yearStockReturn =
      (1 + yearStockReturn) / (1 + currentYearData.inflation) - 1;
    yearBondReturn = (1 + yearBondReturn) / (1 + currentYearData.inflation) - 1;
    yearCashReturn = (1 + yearCashReturn) / (1 + currentYearData.inflation) - 1;
  }

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

  // Effective returns are those used for growth calculations
  return {
    effectiveStockReturn: yearStockReturn,
    effectiveBondReturn: yearBondReturn,
    effectiveCashReturn: yearCashReturn,
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
  let currentNominalWithdrawal = params.initialWithdrawal;

  const bucket1TargetInitial = params.bucket1Years * params.initialWithdrawal;
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
      startPortfolio: totalPortfolioStartOfYear,
      b1GrowthAmount: 0,
      b2GrowthAmount: 0,
      b3GrowthAmount: 0,
      b1RefillAmount: 0,
      b2TransferToB1: 0,
      b3TransferToB1: 0,
      b2RebalanceTransfer: 0,
      b3RebalanceTransfer: 0,
    };

    let yearMarketData;
    let actualWithdrawalForThisYear;

    if (params.simulationMode === "monteCarlo") {
      const generatedInflation = generateReturn(
        params.inflationRateMean,
        params.inflationRateStdDev
      );
      yearMarketData = {
        stockReturn: generateReturn(
          params.stockReturnMean,
          params.stockReturnStdDev
        ), // Nominal
        bondReturn: generateReturn(
          params.bondReturnMean,
          params.bondReturnStdDev
        ), // Nominal
        cashReturn: generateReturn(
          params.cashReturnMean,
          params.cashReturnStdDev
        ), // Nominal
        inflation: generatedInflation,
      };
      actualWithdrawalForThisYear =
        params.dollarBasis === "nominal"
          ? currentNominalWithdrawal * (1 + generatedInflation)
          : params.initialWithdrawal;
    } else {
      yearMarketData = historicalPeriodData[year]; // Contains nominal returns and inflation
      actualWithdrawalForThisYear =
        params.dollarBasis === "nominal"
          ? currentNominalWithdrawal * (1 + yearMarketData.inflation)
          : params.initialWithdrawal;
    }
    logEntry.withdrawalForYear = actualWithdrawalForThisYear;
    logEntry.inflationForYear = yearMarketData.inflation;
    logEntry.b3ReturnPercentDecision = yearMarketData.stockReturn; // Decision based on nominal stock return

    logEntry.b1Start = bucket1Balance;
    logEntry.b2Start = bucket2Balance;
    logEntry.b3Start = bucket3Balance;
    let withdrawalNeeded = actualWithdrawalForThisYear;

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
      if (params.dollarBasis === "nominal")
        currentNominalWithdrawal = actualWithdrawalForThisYear;
      logEntry.nextYearWithdrawalBase =
        params.dollarBasis === "nominal"
          ? currentNominalWithdrawal
          : params.initialWithdrawal;
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

    const b1PreGrowth = bucket1Balance,
      b2PreGrowth = bucket2Balance,
      b3PreGrowth = bucket3Balance;
    let portfolioForGrowth = {
      b1Balance: bucket1Balance,
      b2Balance: bucket2Balance,
      b3Balance: bucket3Balance,
    };
    const { effectiveStockReturn, effectiveBondReturn, effectiveCashReturn } =
      applyYearlyEvents(
        portfolioForGrowth,
        yearMarketData,
        actualWithdrawalForThisYear,
        params
      );

    bucket1Balance = Math.max(0, portfolioForGrowth.b1Balance);
    bucket2Balance = Math.max(0, portfolioForGrowth.b2Balance);
    bucket3Balance = Math.max(0, portfolioForGrowth.b3Balance);

    logEntry.b1GrowthAmount = bucket1Balance - b1PreGrowth;
    logEntry.b2GrowthAmount = bucket2Balance - b2PreGrowth;
    logEntry.b3GrowthAmount = bucket3Balance - b3PreGrowth;
    logEntry.b1ReturnPercent = effectiveCashReturn;
    logEntry.b2ReturnPercent = effectiveBondReturn;
    logEntry.b3ReturnPercentEffective = effectiveStockReturn;

    logEntry.b1AfterGrowth = bucket1Balance;
    logEntry.b2AfterGrowth = bucket2Balance;
    logEntry.b3AfterGrowth = bucket3Balance;

    const b1TargetDollar = params.bucket1Years * actualWithdrawalForThisYear;
    const b2TargetDollar =
      params.bucket2YearsBonds * actualWithdrawalForThisYear;
    logEntry.b1TargetAmount = b1TargetDollar;
    logEntry.b2TargetAmount = b2TargetDollar;

    let totalPortfolioAfterGrowth =
      bucket1Balance + bucket2Balance + bucket3Balance;

    if (logEntry.b3ReturnPercentDecision >= 0) {
      logEntry.reallocStrategy = "Market Up/Flat: Holistic";
      let b1Old = bucket1Balance,
        b2Old = bucket2Balance,
        b3Old = bucket3Balance;
      bucket1Balance = Math.min(totalPortfolioAfterGrowth, b1TargetDollar);
      let remainingForB2B3 = totalPortfolioAfterGrowth - bucket1Balance;
      bucket2Balance = Math.min(remainingForB2B3, b2TargetDollar);
      bucket3Balance = Math.max(0, remainingForB2B3 - bucket2Balance);
      logEntry.b1RefillAmount = bucket1Balance - b1Old;
      if (logEntry.b1RefillAmount > 0)
        logEntry.b1RefillSource = "Portfolio Realloc";
      else if (logEntry.b1RefillAmount < 0)
        logEntry.b1RefillSource = "Surplus to B2/B3";
      logEntry.b2RebalanceTransfer =
        bucket2Balance -
        b2Old -
        (logEntry.b1RefillAmount < 0 && b1TargetDollar - b1Old < 0
          ? b1TargetDollar - b1Old
          : 0); // Approximate change not due to B1 refill
      logEntry.b3RebalanceTransfer =
        bucket3Balance -
        b3Old -
        (logEntry.b1RefillAmount < 0 && b1TargetDollar - b1Old < 0 ? 0 : 0); // Approximate change not due to B1 refill
    } else {
      logEntry.reallocStrategy = "Market Down: Conditional";
      const bucket1RefillTriggerLevel =
        params.bucket1RefillThresholdYears * actualWithdrawalForThisYear;
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
      let b2OldForRebalance = bucket2Balance,
        b3OldForRebalance = bucket3Balance;
      if (bucket2Balance > b2TargetDollar) {
        const excessB2 = bucket2Balance - b2TargetDollar;
        bucket2Balance -= excessB2;
        bucket3Balance += excessB2;
      }
      logEntry.b2RebalanceTransfer = bucket2Balance - b2OldForRebalance;
      logEntry.b3RebalanceTransfer = bucket3Balance - b3OldForRebalance;
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
      currentNominalWithdrawal = actualWithdrawalForThisYear;
    }
    logEntry.nextYearWithdrawalBase =
      params.dollarBasis === "nominal"
        ? currentNominalWithdrawal
        : params.initialWithdrawal;

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
  let currentNominalWithdrawal = params.initialWithdrawal;

  let stockBalance = portfolioBalance * params.trStockAllocationRatio;
  let bondBalance = portfolioBalance * (1 - params.trStockAllocationRatio);
  const annualPortfolioValues = [params.startBalance];

  for (let year = 0; year < params.timeHorizon; year++) {
    const logEntry = {
      year: year + 1,
      startPortfolio: portfolioBalance,
      stockGrowthAmount: 0,
      bondGrowthAmount: 0,
      rebalanceStockAmount: 0,
      rebalanceBondAmount: 0,
    };

    let yearMarketData;
    let actualWithdrawalForThisYear;

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
        cashReturn: 0,
        inflation: generatedInflation,
      };
      actualWithdrawalForThisYear =
        params.dollarBasis === "nominal"
          ? currentNominalWithdrawal * (1 + generatedInflation)
          : params.initialWithdrawal;
    } else {
      yearMarketData = historicalPeriodData[year];
      actualWithdrawalForThisYear =
        params.dollarBasis === "nominal"
          ? currentNominalWithdrawal * (1 + yearMarketData.inflation)
          : params.initialWithdrawal;
    }
    logEntry.withdrawalForYear = actualWithdrawalForThisYear;
    logEntry.inflationForYear = yearMarketData.inflation;

    logEntry.stockStart = stockBalance;
    logEntry.bondStart = bondBalance;
    if (
      portfolioBalance < actualWithdrawalForThisYear &&
      portfolioBalance <= 0
    ) {
      logEntry.endPortfolio = 0;
      if (params.dollarBasis === "nominal")
        currentNominalWithdrawal = actualWithdrawalForThisYear;
      logEntry.nextYearWithdrawalBase =
        params.dollarBasis === "nominal"
          ? currentNominalWithdrawal
          : params.initialWithdrawal;
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
    const totalToWithdrawActually = Math.min(
      actualWithdrawalForThisYear,
      portfolioBalance
    );
    if (portfolioBalance > 0) {
      stockWithdrawal =
        totalToWithdrawActually * (stockBalance / portfolioBalance);
      bondWithdrawal =
        totalToWithdrawActually * (bondBalance / portfolioBalance);
    } else {
      // portfolio is zero, withdrawal is zero
      stockWithdrawal = 0;
      bondWithdrawal = 0;
    }

    stockBalance -= stockWithdrawal;
    bondBalance -= bondWithdrawal;
    logEntry.stockWithdrawal = stockWithdrawal;
    logEntry.bondWithdrawal = bondWithdrawal;
    portfolioBalance = Math.max(0, stockBalance + bondBalance);
    logEntry.portfolioAfterWithdrawal = portfolioBalance;

    if (portfolioBalance === 0) {
      logEntry.endPortfolio = 0;
      if (params.dollarBasis === "nominal")
        currentNominalWithdrawal = actualWithdrawalForThisYear;
      logEntry.nextYearWithdrawalBase =
        params.dollarBasis === "nominal"
          ? currentNominalWithdrawal
          : params.initialWithdrawal;
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

    const stockPreGrowth = stockBalance,
      bondPreGrowth = bondBalance;
    let portfolioForGrowth = { stockBalance, bondBalance };
    const { effectiveStockReturn, effectiveBondReturn } = applyYearlyEvents(
      portfolioForGrowth,
      yearMarketData,
      actualWithdrawalForThisYear,
      params
    );

    stockBalance = Math.max(0, portfolioForGrowth.stockBalance);
    bondBalance = Math.max(0, portfolioForGrowth.bondBalance);
    portfolioBalance = stockBalance + bondBalance;

    logEntry.stockGrowthAmount = stockBalance - stockPreGrowth;
    logEntry.bondGrowthAmount = bondBalance - bondPreGrowth;
    logEntry.stockReturnPercent = effectiveStockReturn;
    logEntry.bondReturnPercent = effectiveBondReturn;
    logEntry.stockAfterGrowth = stockBalance;
    logEntry.bondAfterGrowth = bondBalance;

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
      currentNominalWithdrawal = actualWithdrawalForThisYear;
    }
    logEntry.nextYearWithdrawalBase =
      params.dollarBasis === "nominal"
        ? currentNominalWithdrawal
        : params.initialWithdrawal;

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
  };
  const simResults = [];
  let successfulRuns = 0;

  for (let i = 0; i < numSimulations; i++) {
    const seed = initialSeedForSet + i;
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
  };
  const rollingPeriods = getRollingPeriods(
    fullHistoricalData,
    baseParams.timeHorizon
  );
  if (rollingPeriods.length === 0) {
    return {
      probabilityOfSuccess: NaN,
      detailedLogs: [],
      firstPeriodLog: null,
      successfulPeriods: 0,
      totalPeriods: 0,
    };
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
      firstPeriodDetailedLog = result.detailedLog;
    }
  }
  const probabilityOfSuccess =
    rollingPeriods.length > 0 ? successfulRuns / rollingPeriods.length : 0;
  return {
    probabilityOfSuccess,
    firstPeriodLog: firstPeriodDetailedLog,
    successfulPeriods: successfulRuns,
    totalPeriods: rollingPeriods.length,
  }; // Added successfulPeriods
}

// --- Charting and Display ---
function calculateMedianPath(allPaths, timeHorizon) {
  const medianPath = [];
  for (let yearIdx = 0; yearIdx <= timeHorizon; yearIdx++) {
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
  svgElement.innerHTML = "";
  const padding = { top: 20, right: 30, bottom: 50, left: 80 };
  const chartWidth =
    svgElement.width.baseVal.value - padding.left - padding.right;
  const chartHeight =
    svgElement.height.baseVal.value - padding.top - padding.bottom;

  let maxY = startBalance > 0 ? startBalance * 1.1 : 1000;
  if (dataSets && dataSets.length > 0 && dataSets[0].values.length > 0) {
    dataSets.forEach((dataSet) =>
      dataSet.values.forEach((val) => {
        if (typeof val === "number" && val > maxY) maxY = val;
      })
    );
    if (maxY < startBalance * 1.1 && startBalance > 0)
      maxY = startBalance * 1.1;
  } else if (startBalance > 0) {
    maxY = startBalance * 1.1;
  } else {
    maxY = 1000;
  }
  if (maxY === 0 && startBalance > 0) maxY = startBalance * 1.1;
  else if (maxY === 0 && startBalance === 0) maxY = 100;

  const xScale = timeHorizon > 0 ? chartWidth / timeHorizon : chartWidth;
  const yScale = maxY > 0 ? chartHeight / maxY : 0;

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

  const numYTicks = 5;
  for (let i = 0; i <= numYTicks; i++) {
    const val = maxY * (i / numYTicks);
    const y = padding.top + chartHeight - (maxY > 0 ? val * yScale : 0);
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
          if (typeof val !== "number" || isNaN(val)) val = 0;
          const x = padding.left + index * xScale;
          const yVal = Math.max(0, val);
          const y =
            padding.top +
            chartHeight -
            (maxY > 0 ? yVal * yScale : chartHeight);
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
            <tr><td>Probability of Success (Historical)</td>
                <td>${fmtP(histResultsBucket.probabilityOfSuccess)} (${
      histResultsBucket.successfulPeriods
    } out of ${histResultsBucket.totalPeriods} periods)</td>
                <td>${fmtP(histResultsTR.probabilityOfSuccess)} (${
      histResultsTR.successfulPeriods
    } out of ${histResultsTR.totalPeriods} periods)</td>
            </tr>
        `;
    chartTitle.textContent =
      "Portfolio Value (Historical Mode - Chart N/A for aggregate)";
    chartSVG.innerHTML =
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Chart displays median Monte Carlo paths. Not applicable for historical aggregate.</text>';
  }
  tableHTML += `</tbody></table>`;
  resultsTableContainer.innerHTML = tableHTML;

  const detailedLogDiv = document.getElementById("detailedLogOutput");
  let logBucketData = null;
  let logTRData = null;
  let logBucketTitle = "Detailed Log: Three-Bucket Strategy";
  let logTRTitle = "Detailed Log: Total Return Strategy";

  if (inputs.simulationMode === "monteCarlo") {
    const medianBucketSim = simulateThreeBucketStrategy_Engine(
      { ...inputs, simulationMode: "monteCarlo" },
      null,
      mcResultsBucket.medianRunSeed
    );
    logBucketData = medianBucketSim.detailedLog;
    detailedLogBucketGlobal = logBucketData;

    const medianTRSim = simulateTotalReturnStrategy_Engine(
      { ...inputs, simulationMode: "monteCarlo" },
      null,
      mcResultsTR.medianRunSeed
    );
    logTRData = medianTRSim.detailedLog;
    detailedLogTRGlobal = logTRData;
    logBucketTitle += " (Median Monte Carlo Run)";
    logTRTitle += " (Median Monte Carlo Run)";
  } else {
    logBucketData = histResultsBucket.firstPeriodLog;
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

// ⮟⮟⮟ REPLACE THIS ENTIRE BLOCK IN script.js ⮟⮟⮟

// ==== [1] DETAILED LOG TOOLTIP DEFINITIONS & TABLE GENERATOR ====

const BUCKET_STRATEGY_TOOLTIPS = {
  Yr: "Which year of the simulation you’re looking at (1, 2, 3, …).",
  "Start Port.": "Total portfolio value at the beginning of that year.",
  "W/D Amt": "Amount you pulled out for living expenses during that year.",
  Inflation:
    "The inflation rate for that year (used to adjust future withdrawals in Nominal mode).",
  "B1 Start": "Cash bucket (Bucket 1) balance at the start of the year.",
  "B1 W/D": "Portion of your withdrawal taken out of Bucket 1.",
  "B1 Eff.Ret%":
    "Cash bucket’s percentage return that year. In Real Dollars mode, this return is adjusted for inflation.",
  "B1 Growth": "Dollar amount the cash bucket gained or lost from returns.",
  "B1 After Growth": "Cash bucket balance after adding/subtracting growth.",
  "B1 Target $":
    "How much cash you aim to keep in Bucket 1 (based on your “years of expenses” setting).",
  "B1 Refill":
    "Dollars moved into Bucket 1 to bring it back up to its target.",
  "B1 Src":
    "Where those refill dollars came from (e.g., from reallocating the overall portfolio or from B2).",
  "B1 End":
    "Cash bucket balance at the end of the year (after growth and any refilling).",
  "B2 Start": "Bonds bucket (Bucket 2) balance at the start of the year.",
  "B2 W/D": "Portion of your withdrawal taken out of Bucket 2.",
  "B2 Eff.Ret%":
    "Bond bucket’s percentage return that year. In Real Dollars mode, this return is adjusted for inflation.",
  "B2 Growth": "Dollar amount the bond bucket gained or lost from returns.",
  "B2 After Growth": "Bond bucket balance after growth.",
  "B2 Target $":
    "How much you aim to keep in Bucket 2 (based on its “years of expenses” setting).",
  "B2 To B1":
    "Dollars transferred from Bucket 2 into Bucket 1 to refill it during down markets.",
  "B2 Rebal.":
    "Dollars moved between B2 and B3 when rebalancing in up markets or after refills.",
  "B2 End": "Bond bucket balance at the end of the year.",
  "B3 Start": "Stock bucket (Bucket 3) balance at the start of the year.",
  "B3 W/D": "Portion of your withdrawal taken out of Bucket 3.",
  "B3 Nom.Ret% (Decision)":
    "Stock bucket’s nominal return used to decide whether markets were “up” or “down” for rebalancing.",
  "B3 Eff.Ret%":
    "Stock bucket’s percentage return that year. In Real Dollars mode, this return is adjusted for inflation.",
  "B3 Growth": "Dollar amount the stock bucket gained or lost from returns.",
  "B3 After Growth": "Stock bucket balance after growth.",
  "B3 To B1":
    "Dollars moved from Bucket 3 into Bucket 1 (only if both B1 & B2 are empty).",
  "B3 Rebal.":
    "Dollars moved from B2 into B3 (in down markets) or from B3 into B2 (in up markets) during rebalance.",
  "B3 End": "Stock bucket balance at the end of the year.",
  "Realloc Strat.":
    "Which refill/rebalancing rule was applied that year (e.g., “Market Up/Flat” or “Market Down”).",
  "End Port.": "Total portfolio value at the end of the year (sum of B1 + B2 + B3).",
  "Next Yr W/D Base":
    "How much your annual withdrawal will be next year (inflation-adjusted).",
};

const TOTAL_RETURN_STRATEGY_TOOLTIPS = {
  Yr: "Which year of the simulation you’re looking at (1, 2, 3, …).",
  "Start Port.": "Total portfolio value at the beginning of that year.",
  "W/D Amt": "Amount you pulled out for living expenses during that year.",
  Inflation:
    "The inflation rate for that year (used to adjust future withdrawals in Nominal mode).",
  "Port. After W/D":
    "Portfolio value after subtracting that year’s withdrawal.",
  "Stock Start": "Stock holdings balance at the start of the year.",
  "Stock W/D": "Portion of your withdrawal taken out of stocks.",
  "Stock Eff.Ret%":
    "Stock holdings’ effective percentage return for the year (adjusted for inflation if applicable).",
  "Stock Growth":
    "Dollar amount the stock holdings gained or lost from returns.",
  "Stock After Growth": "Stock balance after applying that year’s growth.",
  "Stock Rebal.":
    "Dollars moved between stocks and bonds to restore the target allocation.",
  "Stock End": "Stock holdings balance at the end of the year.",
  "Bond Start": "Bond holdings balance at the start of the year.",
  "Bond W/D": "Portion of your withdrawal taken out of bonds.",
  "Bond Eff.Ret%":
    "Bond holdings’ percentage return for the year (adjusted for inflation if applicable).",
  "Bond Growth":
    "Dollar amount the bond holdings gained or lost from returns.",
  "Bond After Growth": "Bond balance after applying that year’s growth.",
  "Bond Rebal.":
    "Dollars moved between bonds and stocks to restore the target allocation.",
  "Bond End": "Bond holdings balance at the end of the year.",
  "End Port.": "Total portfolio value at the end of the year (sum of stocks + bonds).",
  "Next Yr W/D Base":
    "Base amount for next year’s withdrawal (adjusted by inflation if using nominal dollars).",
};

function generateDetailedLogTable(logData, strategyType) {
  if (!logData || logData.length === 0)
    return "<p>No detailed log data available for this run.</p>";

  const tooltips =
    strategyType === "3-bucket"
      ? BUCKET_STRATEGY_TOOLTIPS
      : TOTAL_RETURN_STRATEGY_TOOLTIPS;

  const createHeader = (textWithMarkup) => {
    const key = textWithMarkup.replace(/<.*?>/g, ""); // Strip HTML for map lookup
    const tooltipText = tooltips[key];
    if (tooltipText) {
      return `<th>${textWithMarkup}<span class="tooltip">?<span class="tooltiptext">${tooltipText}</span></span></th>`;
    }
    return `<th>${textWithMarkup}</th>`;
  };

  let headerTexts, rows;
  if (strategyType === "3-bucket") {
    headerTexts = [
      "Yr",
      "Start Port.",
      "W/D Amt",
      "Inflation",
      "B1 Start",
      "B1 W/D",
      "B1 Eff.Ret%",
      "B1 Growth",
      "B1 After Growth",
      "B1 Target $",
      "B1 Refill",
      "B1 Src",
      "B1 End",
      "B2 Start",
      "B2 W/D",
      "B2 Eff.Ret%",
      "B2 Growth",
      "B2 After Growth",
      "B2 Target $",
      "B2 To B1",
      "B2 Rebal.",
      "B2 End",
      "B3 Start",
      "B3 W/D",
      "B3 Nom.Ret% <mark>(Decision)</mark>",
      "B3 Eff.Ret%",
      "B3 Growth",
      "B3 After Growth",
      "B3 To B1",
      "B3 Rebal.",
      "B3 End",
      "Realloc Strat.",
      "End Port.",
      "Next Yr W/D Base",
    ];
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
    headerTexts = [
      "Yr",
      "Start Port.",
      "W/D Amt",
      "Inflation",
      "Port. After W/D",
      "Stock Start",
      "Stock W/D",
      "Stock Eff.Ret%",
      "Stock Growth",
      "Stock After Growth",
      "Stock Rebal.",
      "Stock End",
      "Bond Start",
      "Bond W/D",
      "Bond Eff.Ret%",
      "Bond Growth",
      "Bond After Growth",
      "Bond Rebal.",
      "Bond End",
      "End Port.",
      "Next Yr W/D Base",
    ];
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
  const headers = headerTexts.map(createHeader).join("");
  return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

// ⮝⮝⮝ REPLACE THIS ENTIRE BLOCK IN script.js ⮝⮝⮝

function downloadCSV(logData, filename) {
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
  var coll = document.getElementsByClassName("collapsible");
  for (var i = 0; i < coll.length; i++) {
    coll[i].removeEventListener("click", toggleCollapsible);
    coll[i].addEventListener("click", toggleCollapsible);
  }
}
function toggleCollapsible() {
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

  if (mode === "historical") {
    toggleHistoricalDataSourceInputs(); // Also update visibility of custom data textarea
  } else {
    document.getElementById("customHistoricalDataSection").style.display =
      "none"; // Hide if not historical
  }
}

function toggleHistoricalDataSourceInputs() {
  const dataSource = document.querySelector(
    'input[name="historicalDataSource"]:checked'
  ).value;
  document.getElementById("customHistoricalDataSection").style.display =
    dataSource === "custom" ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  addCollapsibleEventListeners();
  document.querySelectorAll('input[name="simulationMode"]').forEach((radio) => {
    radio.addEventListener("change", toggleModeInputs);
  });
  document
    .querySelectorAll('input[name="historicalDataSource"]')
    .forEach((radio) => {
      radio.addEventListener("change", toggleHistoricalDataSourceInputs);
    });
  toggleModeInputs();
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
  // ... (other validations remain the same) ...
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
  resultsTableContainer.innerHTML = "";
  chartContainer.style.display = "block";
  chartSVG.innerHTML =
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Calculating...</text>';
  detailedLogDiv.innerHTML = "<p>Calculating detailed logs...</p>";
  detailedLogDiv.style.display = "block";

  setTimeout(() => {
    try {
      let mcResultsBucket = {},
        mcResultsTR = {};
      let histResultsBucket = {},
        histResultsTR = {};
      let activeHistoricalData = [];

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
        if (inputs.historicalDataSource === "builtIn") {
          activeHistoricalData = parseHistoricalDataCSV(
            BUILT_IN_HISTORICAL_DATA_CSV
          );
        } else {
          // custom
          const customDataString =
            document.getElementById("historicalData").value;
          if (!customDataString.trim()) {
            resultsStatusDiv.innerHTML =
              "<p style='color:red;'>Custom historical data is selected but the text area is empty.</p>";
            return;
          }
          activeHistoricalData = parseHistoricalDataCSV(customDataString);
        }

        if (activeHistoricalData.length === 0) {
          // This check handles errors from parseHistoricalDataCSV as well
          resultsStatusDiv.innerHTML =
            "<p style='color:red;'>Historical data could not be parsed or is empty. Check console for details if providing custom data.</p>";
          return;
        }
        if (activeHistoricalData.length < inputs.timeHorizon) {
          resultsStatusDiv.innerHTML = `<p style='color:red;'>Not enough historical data (${activeHistoricalData.length} years) for the selected time horizon (${inputs.timeHorizon} years).</p>`;
          return;
        }
        histResultsBucket = runHistoricalBacktest(
          simulateThreeBucketStrategy_Engine,
          activeHistoricalData,
          inputs,
          {
            bucket1Years: inputs.bucket1Years,
            bucket1RefillThresholdYears: inputs.bucket1RefillThresholdYears,
            bucket2YearsBonds: inputs.bucket2YearsBonds,
          }
        );
        histResultsTR = runHistoricalBacktest(
          simulateTotalReturnStrategy_Engine,
          activeHistoricalData,
          inputs,
          { trStockAllocationRatio: inputs.trStockAllocationRatio }
        );
        if (isNaN(histResultsBucket.probabilityOfSuccess)) {
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
