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
  let attempts1 = 0,
    attempts2 = 0;
  const MAX_ATTEMPTS = 1000;

  while (u1 === 0) {
    u1 = currentPRNG();
    attempts1++;
    if (attempts1 > MAX_ATTEMPTS) {
      console.warn(
        "generateStandardNormal: PRNG produced 0 for u1 after " +
          MAX_ATTEMPTS +
          " attempts. Forcing small non-zero value."
      );
      u1 = 1e-9;
      break;
    }
  }

  while (u2 === 0) {
    u2 = currentPRNG();
    attempts2++;
    if (attempts2 > MAX_ATTEMPTS) {
      console.warn(
        "generateStandardNormal: PRNG produced 0 for u2 after " +
          MAX_ATTEMPTS +
          " attempts. Forcing small non-zero value."
      );
      u2 = 1e-9;
      break;
    }
  }

  const R = Math.sqrt(-2.0 * Math.log(u1));
  const Theta = 2.0 * Math.PI * u2;
  return R * Math.cos(Theta);
}

function generateReturn(mean, stdDev) {
  return mean + generateStandardNormal() * stdDev;
}

// --- MODIFIED FORMATTING FUNCTIONS ---
const fmtC = (v, digits = 0) => {
  if (typeof v !== "number" || isNaN(v)) {
    return "N/A";
  }
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const fmtN = (v, digits = 0) => {
  // Added similar robustness to fmtN for consistency
  if (typeof v !== "number" || isNaN(v)) {
    return "N/A";
  }
  return v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const fmtP = (v, digits = 1) => {
  if (typeof v !== "number" || isNaN(v)) {
    return "N/A";
  }
  return (v * 100).toFixed(digits) + "%";
};

function getInputs() {
  const p = (id) => parseFloat(document.getElementById(id).value);
  const pc = (id) => p(id) / 100;
  return {
    startBalance: p("startBalance"),
    initialWithdrawal: p("initialWithdrawal"),
    timeHorizon: parseInt(p("timeHorizon")),
    inflationRate: pc("inflationRate"),
    numSimulations: parseInt(p("numSimulations")),
    stockReturnMean: pc("stockReturn"),
    stockReturnStdDev: pc("stockStdDev"),
    bondReturnMean: pc("bondReturn"),
    bondReturnStdDev: pc("bondStdDev"),
    cashReturnMean: pc("cashReturn"),
    cashReturnStdDev: pc("cashStdDev"),
    bucket1Years: p("bucket1Years"),
    bucket1RefillThresholdYears: p("bucket1RefillThreshold"),
    bucket2YearsBonds: p("bucket2YearsBonds"),
    trStockAllocationRatio: pc("trStockAllocation"),
  };
}

function simulateThreeBucketStrategy_Detailed(params, seed) {
  currentPRNG = mulberry32(seed);
  const detailedLog = [];
  let currentAnnualWithdrawal = params.initialWithdrawal;

  const bucket1TargetInitial = params.bucket1Years * currentAnnualWithdrawal;
  let bucket1Balance = Math.min(params.startBalance, bucket1TargetInitial);
  const remainingAfterB1 = Math.max(0, params.startBalance - bucket1Balance);
  const bucket2TargetInitial =
    params.bucket2YearsBonds * currentAnnualWithdrawal;
  let bucket2Balance = Math.min(remainingAfterB1, bucket2TargetInitial);
  let bucket3Balance = Math.max(0, remainingAfterB1 - bucket2Balance);

  let totalPortfolioStartOfYear = params.startBalance;
  const annualPortfolioValues = [params.startBalance];

  for (let year = 0; year < params.timeHorizon; year++) {
    const logEntry = {
      year: year + 1,
      startPortfolio: totalPortfolioStartOfYear,
      withdrawalForYear: currentAnnualWithdrawal,
      // Initialize all numeric fields that will be logged to ensure they exist
      b1Start: 0,
      b1Withdrawal: 0,
      b1ReturnPercent: 0,
      b1GrowthAmount: 0,
      b1AfterGrowth: 0,
      b1TargetAmount: 0,
      b1RefillAmount: 0,
      b1End: 0,
      b2Start: 0,
      b2Withdrawal: 0,
      b2ReturnPercent: 0,
      b2GrowthAmount: 0,
      b2AfterGrowth: 0,
      b2TargetAmount: 0,
      b2TransferToB1: 0,
      b2RebalanceTransfer: 0,
      b2End: 0,
      b3Start: 0,
      b3Withdrawal: 0,
      b3AnnualReturnForDecision: 0,
      b3ReturnPercent: 0,
      b3GrowthAmount: 0,
      b3AfterGrowth: 0,
      b3TransferToB1: 0,
      b3RebalanceTransfer: 0,
      b3End: 0,
      b1RefillSource: "N/A",
      reallocStrategy: "N/A",
      endPortfolio: 0,
      nextYearWithdrawal: 0,
    };

    logEntry.b1Start = bucket1Balance;
    logEntry.b2Start = bucket2Balance;
    logEntry.b3Start = bucket3Balance;

    const yearWithdrawal = currentAnnualWithdrawal;
    let withdrawalNeeded = yearWithdrawal;
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
      // Most values already initialized or set above, just ensure endPortfolio is 0
      logEntry.endPortfolio = 0;
      logEntry.nextYearWithdrawal =
        currentAnnualWithdrawal * (1 + params.inflationRate); // Still calculate for log
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

    const b1PreGrowth = bucket1Balance;
    logEntry.b1ReturnPercent = generateReturn(
      params.cashReturnMean,
      params.cashReturnStdDev
    );
    bucket1Balance *= 1 + logEntry.b1ReturnPercent;
    logEntry.b1GrowthAmount = bucket1Balance - b1PreGrowth;

    const b2PreGrowth = bucket2Balance;
    logEntry.b2ReturnPercent = generateReturn(
      params.bondReturnMean,
      params.bondReturnStdDev
    );
    bucket2Balance *= 1 + logEntry.b2ReturnPercent;
    logEntry.b2GrowthAmount = bucket2Balance - b2PreGrowth;

    const b3PreGrowth = bucket3Balance;
    logEntry.b3AnnualReturnForDecision = generateReturn(
      params.stockReturnMean,
      params.stockReturnStdDev
    );
    logEntry.b3ReturnPercent = logEntry.b3AnnualReturnForDecision;
    bucket3Balance *= 1 + logEntry.b3ReturnPercent;
    logEntry.b3GrowthAmount = bucket3Balance - b3PreGrowth;

    bucket1Balance = Math.max(0, bucket1Balance);
    bucket2Balance = Math.max(0, bucket2Balance);
    bucket3Balance = Math.max(0, bucket3Balance);
    logEntry.b1AfterGrowth = bucket1Balance;
    logEntry.b2AfterGrowth = bucket2Balance;
    logEntry.b3AfterGrowth = bucket3Balance;

    let totalPortfolioAfterGrowth =
      bucket1Balance + bucket2Balance + bucket3Balance;
    const b1TargetDollar = params.bucket1Years * yearWithdrawal;
    const b2TargetDollar = params.bucket2YearsBonds * yearWithdrawal;
    logEntry.b1TargetAmount = b1TargetDollar;
    logEntry.b2TargetAmount = b2TargetDollar;
    // b1RefillAmount, b1RefillSource, b2TransferToB1, b3TransferToB1, b2RebalanceTransfer, b3RebalanceTransfer initialized to 0 or 'N/A'

    if (logEntry.b3AnnualReturnForDecision >= 0) {
      logEntry.reallocStrategy = "Market Up/Flat: Holistic";
      let b1Old = bucket1Balance,
        b2Old = bucket2Balance,
        b3Old = bucket3Balance;

      bucket1Balance = Math.min(totalPortfolioAfterGrowth, b1TargetDollar);
      let remainingForB2B3 = totalPortfolioAfterGrowth - bucket1Balance;
      bucket2Balance = Math.min(remainingForB2B3, b2TargetDollar);
      bucket3Balance = remainingForB2B3 - bucket2Balance;

      logEntry.b1RefillAmount = bucket1Balance - b1Old;
      if (logEntry.b1RefillAmount > 0)
        logEntry.b1RefillSource = "Portfolio Realloc";
      else if (logEntry.b1RefillAmount < 0)
        logEntry.b1RefillSource = "Portfolio Realloc (Surplus to B2/B3)";
      else logEntry.b1RefillSource = "N/A";

      logEntry.b2RebalanceTransfer = bucket2Balance - b2Old;
      logEntry.b3RebalanceTransfer = bucket3Balance - b3Old;
    } else {
      logEntry.reallocStrategy = "Market Down: Conditional";
      const bucket1RefillTriggerLevel =
        params.bucket1RefillThresholdYears * yearWithdrawal;
      if (bucket1Balance < bucket1RefillTriggerLevel) {
        let amountToRefillB1 = Math.max(0, b1TargetDollar - bucket1Balance);
        if (amountToRefillB1 > 0) {
          const fromB2Refill = Math.min(amountToRefillB1, bucket2Balance);
          bucket1Balance += fromB2Refill;
          bucket2Balance -= fromB2Refill;
          if (fromB2Refill > 0) {
            logEntry.b1RefillAmount += fromB2Refill; // Note: +=, could be multiple sources if logic changed
            logEntry.b1RefillSource = "B2 Only";
            logEntry.b2TransferToB1 = -fromB2Refill;
          }
        }
      }
      let b2OldForRebalance = bucket2Balance;
      let b3OldForRebalance = bucket3Balance;
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

    currentAnnualWithdrawal *= 1 + params.inflationRate;
    logEntry.b1End = bucket1Balance;
    logEntry.b2End = bucket2Balance;
    logEntry.b3End = bucket3Balance;
    totalPortfolioStartOfYear =
      bucket1Balance + bucket2Balance + bucket3Balance;
    logEntry.endPortfolio = totalPortfolioStartOfYear;
    logEntry.nextYearWithdrawal = currentAnnualWithdrawal;
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

function simulateTotalReturnStrategy_Detailed(params, seed) {
  currentPRNG = mulberry32(seed);
  const detailedLog = [];
  let portfolioBalance = params.startBalance;
  let currentAnnualWithdrawal = params.initialWithdrawal;
  let stockBalance = portfolioBalance * params.trStockAllocationRatio;
  let bondBalance = portfolioBalance * (1 - params.trStockAllocationRatio);
  const annualPortfolioValues = [params.startBalance];

  for (let year = 0; year < params.timeHorizon; year++) {
    const logEntry = {
      year: year + 1,
      startPortfolio: portfolioBalance,
      withdrawalForYear: currentAnnualWithdrawal,
      // Initialize all numeric fields
      portfolioAfterWithdrawal: 0,
      stockStart: 0,
      stockWithdrawal: 0,
      stockReturnPercent: 0,
      stockGrowthAmount: 0,
      stockAfterGrowth: 0,
      rebalanceStockAmount: 0,
      stockEnd: 0,
      bondStart: 0,
      bondWithdrawal: 0,
      bondReturnPercent: 0,
      bondGrowthAmount: 0,
      bondAfterGrowth: 0,
      rebalanceBondAmount: 0,
      bondEnd: 0,
      endPortfolio: 0,
      nextYearWithdrawal: 0,
    };
    logEntry.stockStart = stockBalance;
    logEntry.bondStart = bondBalance;

    const yearWithdrawal = currentAnnualWithdrawal;
    if (portfolioBalance < yearWithdrawal && portfolioBalance <= 0) {
      // Ensure it's actually depleted
      // Values already initialized to 0 for this case.
      logEntry.endPortfolio = 0; // explicitly ensure
      logEntry.nextYearWithdrawal =
        currentAnnualWithdrawal * (1 + params.inflationRate);
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

    const originalPortfolioBeforeWithdraw = stockBalance + bondBalance;
    // stockWithdrawal & bondWithdrawal are initialized to 0 in logEntry
    if (originalPortfolioBeforeWithdraw > 0) {
      const stockProportion = stockBalance / originalPortfolioBeforeWithdraw;
      const bondProportion = bondBalance / originalPortfolioBeforeWithdraw;
      logEntry.stockWithdrawal = yearWithdrawal * stockProportion;
      logEntry.bondWithdrawal = yearWithdrawal * bondProportion;

      // Cap withdrawals at available balance if portfolio < withdrawal but > 0
      if (portfolioBalance < yearWithdrawal) {
        logEntry.stockWithdrawal = Math.min(
          logEntry.stockWithdrawal,
          stockBalance
        );
        logEntry.bondWithdrawal = Math.min(
          logEntry.bondWithdrawal,
          bondBalance
        );
      }

      stockBalance -= logEntry.stockWithdrawal;
      bondBalance -= logEntry.bondWithdrawal;
    }
    portfolioBalance = Math.max(0, stockBalance + bondBalance);
    logEntry.portfolioAfterWithdrawal = portfolioBalance;

    // If portfolio is now zero after withdrawal, no growth/rebalancing
    if (portfolioBalance === 0) {
      logEntry.endPortfolio = 0;
      logEntry.nextYearWithdrawal =
        currentAnnualWithdrawal * (1 + params.inflationRate);
      detailedLog.push(logEntry);
      annualPortfolioValues.push(0); // Push 0 for current year end
      // Fill remaining years with 0 if this is the end
      for (let y = year + 1; y < params.timeHorizon; y++)
        annualPortfolioValues.push(0);
      return {
        endingBalance: 0,
        success: false,
        annualValues: annualPortfolioValues,
        detailedLog: detailedLog,
      };
    }

    const stockPreGrowth = stockBalance;
    logEntry.stockReturnPercent = generateReturn(
      params.stockReturnMean,
      params.stockReturnStdDev
    );
    stockBalance *= 1 + logEntry.stockReturnPercent;
    logEntry.stockGrowthAmount = stockBalance - stockPreGrowth;

    const bondPreGrowth = bondBalance;
    logEntry.bondReturnPercent = generateReturn(
      params.bondReturnMean,
      params.bondReturnStdDev
    );
    bondBalance *= 1 + logEntry.bondReturnPercent;
    logEntry.bondGrowthAmount = bondBalance - bondPreGrowth;

    stockBalance = Math.max(0, stockBalance);
    bondBalance = Math.max(0, bondBalance);
    portfolioBalance = stockBalance + bondBalance;
    logEntry.stockAfterGrowth = stockBalance;
    logEntry.bondAfterGrowth = bondBalance;

    // rebalanceStockAmount & rebalanceBondAmount initialized to 0
    if (portfolioBalance > 0) {
      const targetStock = portfolioBalance * params.trStockAllocationRatio;
      const targetBond = portfolioBalance * (1 - params.trStockAllocationRatio);
      logEntry.rebalanceStockAmount = targetStock - stockBalance;
      logEntry.rebalanceBondAmount = targetBond - bondBalance;
      stockBalance = targetStock;
      bondBalance = targetBond;
    }

    currentAnnualWithdrawal *= 1 + params.inflationRate;
    logEntry.stockEnd = stockBalance;
    logEntry.bondEnd = bondBalance;
    logEntry.endPortfolio = portfolioBalance;
    logEntry.nextYearWithdrawal = currentAnnualWithdrawal;
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

function runMonteCarlo(
  simulationFunction,
  numSimulations,
  baseParams,
  strategySpecificParams,
  initialSeedForSet
) {
  const allParams = { ...baseParams, ...strategySpecificParams };
  const simResults = [];
  let successfulRuns = 0;

  for (let i = 0; i < numSimulations; i++) {
    const seed = initialSeedForSet + i;
    const result = simulationFunction(allParams, seed);
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
      : 0; // Adjusted p90 index
  const p90 = endingBalances.length > 0 ? endingBalances[p90idx] : 0;

  const allAnnualValuePaths = simResults.map((r) => r.annualValues);
  const medianAnnualValues = calculateMedianPath(
    allAnnualValuePaths,
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
  dataSets.forEach((dataSet) =>
    dataSet.values.forEach((val) => {
      if (typeof val === "number" && val > maxY) maxY = val;
    })
  ); // Check val is number
  if (maxY < startBalance * 1.1 && startBalance > 0) maxY = startBalance * 1.1;
  if (maxY === 0 && startBalance > 0) maxY = startBalance * 1.1;
  else if (maxY === 0 && startBalance === 0) maxY = 100;

  const xScale = timeHorizon > 0 ? chartWidth / timeHorizon : chartWidth; // Avoid division by zero
  const yScale = maxY > 0 ? chartHeight / maxY : 0;

  const ns = "http://www.w3.org/2000/svg";
  function createText(x, y, anchor, content, rotation = 0, baseAdjust = 0) {
    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y + baseAdjust);
    text.setAttribute("text-anchor", anchor);
    text.textContent = content;
    if (rotation)
      text.setAttribute("transform", `rotate(${rotation} ${x} ${y})`);
    return text;
  }
  const xAxisLine = document.createElementNS(ns, "line");
  xAxisLine.setAttribute("x1", padding.left);
  xAxisLine.setAttribute("y1", padding.top + chartHeight);
  xAxisLine.setAttribute("x2", padding.left + chartWidth);
  xAxisLine.setAttribute("y2", padding.top + chartHeight);
  xAxisLine.setAttribute("stroke", "black");
  svgElement.appendChild(xAxisLine);
  const yAxisLine = document.createElementNS(ns, "line");
  yAxisLine.setAttribute("x1", padding.left);
  yAxisLine.setAttribute("y1", padding.top);
  yAxisLine.setAttribute("x2", padding.left);
  yAxisLine.setAttribute("y2", padding.top + chartHeight);
  yAxisLine.setAttribute("stroke", "black");
  svgElement.appendChild(yAxisLine);

  const xTickIncrement =
    timeHorizon >= 20 ? 5 : timeHorizon >= 10 ? 2 : timeHorizon > 0 ? 1 : 0;
  if (xTickIncrement > 0) {
    for (let i = 0; i <= timeHorizon; i += xTickIncrement) {
      const x = padding.left + i * xScale;
      const tick = document.createElementNS(ns, "line");
      tick.setAttribute("x1", x);
      tick.setAttribute("y1", padding.top + chartHeight);
      tick.setAttribute("x2", x);
      tick.setAttribute("y2", padding.top + chartHeight + 5);
      tick.setAttribute("stroke", "black");
      svgElement.appendChild(tick);
      svgElement.appendChild(
        createText(x, padding.top + chartHeight + 20, "middle", i)
      );
    }
  } else if (timeHorizon === 0) {
    // Handle timeHorizon = 0 case for x-axis
    const x = padding.left;
    svgElement.appendChild(
      createText(x, padding.top + chartHeight + 20, "middle", 0)
    );
  }

  svgElement.appendChild(
    createText(
      padding.left + chartWidth / 2,
      svgElement.height.baseVal.value - 10,
      "middle",
      "Year"
    )
  );

  const numYTicks = 5;
  for (let i = 0; i <= numYTicks; i++) {
    const val = maxY * (i / numYTicks);
    const y = padding.top + chartHeight - (maxY > 0 ? val * yScale : 0);
    const tick = document.createElementNS(ns, "line");
    tick.setAttribute("x1", padding.left - 5);
    tick.setAttribute("y1", y);
    tick.setAttribute("x2", padding.left);
    tick.setAttribute("y2", y);
    tick.setAttribute("stroke", "black");
    svgElement.appendChild(tick);
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
      -90
    )
  );

  dataSets.forEach((dataSet) => {
    const polyline = document.createElementNS(ns, "polyline");
    let points = "";
    dataSet.values.forEach((val, index) => {
      if (typeof val !== "number" || isNaN(val)) val = 0; // Ensure val is numeric for plotting
      const x = padding.left + index * xScale;
      const y =
        padding.top +
        chartHeight -
        (maxY > 0 ? Math.max(0, val) * yScale : chartHeight);
      points += `${x},${y} `;
    });
    polyline.setAttribute("points", points.trim());
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", dataSet.color);
    polyline.setAttribute("stroke-width", "2");
    svgElement.appendChild(polyline);
  });
}

function displayResults(
  inputs,
  resultsBucket,
  resultsTotalReturn,
  detailedLogBucket,
  detailedLogTR
) {
  const resultsTableDiv = document.getElementById("resultsTable");
  resultsTableDiv.innerHTML = `
              <table><thead><tr><th>Metric</th><th>Three-Bucket Strategy</th><th>Total Return Strategy</th></tr></thead><tbody>
                  <tr><td>Probability of Success</td><td>${fmtP(
                    resultsBucket.probabilityOfSuccess
                  )}</td><td>${fmtP(
    resultsTotalReturn.probabilityOfSuccess
  )}</td></tr>
                  <tr><td>Median Ending Balance</td><td>${fmtC(
                    resultsBucket.medianEndingBalance
                  )}</td><td>${fmtC(
    resultsTotalReturn.medianEndingBalance
  )}</td></tr>
                  <tr><td>10th Percentile Ending Balance</td><td>${fmtC(
                    resultsBucket.p10EndingBalance
                  )}</td><td>${fmtC(
    resultsTotalReturn.p10EndingBalance
  )}</td></tr>
                  <tr><td>90th Percentile Ending Balance</td><td>${fmtC(
                    resultsBucket.p90EndingBalance
                  )}</td><td>${fmtC(
    resultsTotalReturn.p90EndingBalance
  )}</td></tr>
              </tbody></table>`;
  let msg = "<p><strong>Comparison:</strong> ";
  if (
    resultsBucket.probabilityOfSuccess > resultsTotalReturn.probabilityOfSuccess
  )
    msg += "Three-Bucket had higher success probability. ";
  else if (
    resultsTotalReturn.probabilityOfSuccess > resultsBucket.probabilityOfSuccess
  )
    msg += "Total Return had higher success probability. ";
  else msg += "Similar success probability. ";
  if (
    resultsBucket.medianEndingBalance > resultsTotalReturn.medianEndingBalance
  )
    msg += "Three-Bucket had higher median ending balance.";
  else if (
    resultsTotalReturn.medianEndingBalance > resultsBucket.medianEndingBalance
  )
    msg += "Total Return had higher median ending balance.";
  else msg += "Similar median ending balance.";
  resultsTableDiv.innerHTML += msg + "</p>";

  const chartSVG = document.getElementById("portfolioChart");
  const chartData = [
    {
      name: "Three-Bucket",
      values: resultsBucket.medianAnnualValues,
      color: "blue",
    },
    {
      name: "Total Return",
      values: resultsTotalReturn.medianAnnualValues,
      color: "red",
    },
  ];
  renderChart(chartSVG, chartData, inputs.timeHorizon, inputs.startBalance);

  const detailedLogDiv = document.getElementById("detailedLogOutput");
  try {
    detailedLogDiv.innerHTML = `
                  <button type="button" class="collapsible">Detailed Log: Three-Bucket Strategy (Median Run of this Simulation Set)</button>
                  <div class="collapsible-content">
                      <button class="download-button" onclick="downloadCSV(detailedLogBucketGlobal, '3_bucket_median_run.csv')">Download CSV</button>
                      <div class="detailed-log-table-container">${generateDetailedLogTable(
                        detailedLogBucket,
                        "3-bucket"
                      )}</div>
                  </div>
                  <button type="button" class="collapsible">Detailed Log: Total Return Strategy (Median Run of this Simulation Set)</button>
                  <div class="collapsible-content">
                      <button class="download-button" onclick="downloadCSV(detailedLogTRGlobal, 'total_return_median_run.csv')">Download CSV</button>
                      <div class="detailed-log-table-container">${generateDetailedLogTable(
                        detailedLogTR,
                        "total-return"
                      )}</div>
                  </div>
              `;
    detailedLogDiv.style.display = "block";
    addCollapsibleEventListeners();
  } catch (e) {
    console.error("Error rendering detailed logs:", e);
    detailedLogDiv.innerHTML = `<p style='color:red;'>Error generating detailed log display: ${e.message}. Check console.</p>`;
    detailedLogDiv.style.display = "block";
  }
}

let detailedLogBucketGlobal, detailedLogTRGlobal;

function generateDetailedLogTable(logData, strategyType) {
  if (!logData || logData.length === 0)
    return "<p>No detailed log data available for this run.</p>";

  let headers, rows;
  if (strategyType === "3-bucket") {
    headers = `<th>Year</th><th>Start Port.</th><th>Withdrawal</th>
                         <th>B1 Start</th><th>B1 W/D</th><th>B1 Ret%</th><th>B1 Growth</th><th>B1 After Growth</th><th>B1 Target $</th><th>B1 Refill Amt</th><th>B1 Refill Src</th><th>B1 End</th>
                         <th>B2 Start</th><th>B2 W/D</th><th>B2 Ret%</th><th>B2 Growth</th><th>B2 After Growth</th><th>B2 Target $</th><th>B2 To B1</th><th>B2 Rebal.</th><th>B2 End</th>
                         <th>B3 Start</th><th>B3 W/D</th><th>B3 Ret% <mark>(Decision)</mark></th><th>B3 Growth</th><th>B3 After Growth</th><th>B3 To B1</th><th>B3 Rebal.</th><th>B3 End</th>
                         <th>Realloc Strat.</th><th>End Port.</th><th>Next Yr W/D</th>`;
    rows = logData
      .map((entry) => {
        if (!entry)
          return '<tr><td colspan="29">Error: Corrupted log entry</td></tr>';
        return `<tr>
                      <td>${
                        entry.year !== undefined ? entry.year : "N/A"
                      }</td><td>${fmtC(entry.startPortfolio)}</td><td>${fmtC(
          entry.withdrawalForYear
        )}</td>
                      <td>${fmtC(entry.b1Start)}</td><td>${fmtC(
          entry.b1Withdrawal
        )}</td><td>${fmtP(entry.b1ReturnPercent)}</td><td>${fmtC(
          entry.b1GrowthAmount
        )}</td><td>${fmtC(entry.b1AfterGrowth)}</td><td>${fmtC(
          entry.b1TargetAmount
        )}</td><td>${fmtC(entry.b1RefillAmount)}</td><td>${
          entry.b1RefillSource !== undefined ? entry.b1RefillSource : "N/A"
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
        )}</td><td>${fmtP(entry.b3AnnualReturnForDecision)}</td><td>${fmtC(
          entry.b3GrowthAmount
        )}</td><td>${fmtC(entry.b3AfterGrowth)}</td><td>${fmtC(
          entry.b3TransferToB1
        )}</td><td>${fmtC(entry.b3RebalanceTransfer)}</td><td>${fmtC(
          entry.b3End
        )}</td>
                      <td>${entry.reallocStrategy || "N/A"}</td><td>${fmtC(
          entry.endPortfolio
        )}</td><td>${fmtC(entry.nextYearWithdrawal)}</td>
                  </tr>`;
      })
      .join("");
  } else {
    headers = `<th>Year</th><th>Start Port.</th><th>Withdrawal</th><th>Port. After W/D</th>
                         <th>Stock Start</th><th>Stock W/D</th><th>Stock Ret%</th><th>Stock Growth</th><th>Stock After Growth</th><th>Stock Rebal.</th><th>Stock End</th>
                         <th>Bond Start</th><th>Bond W/D</th><th>Bond Ret%</th><th>Bond Growth</th><th>Bond After Growth</th><th>Bond Rebal.</th><th>Bond End</th>
                         <th>End Port.</th><th>Next Yr W/D</th>`;
    rows = logData
      .map((entry) => {
        if (!entry)
          return '<tr><td colspan="19">Error: Corrupted log entry</td></tr>';
        return `<tr>
                      <td>${
                        entry.year !== undefined ? entry.year : "N/A"
                      }</td><td>${fmtC(entry.startPortfolio)}</td><td>${fmtC(
          entry.withdrawalForYear
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
          entry.nextYearWithdrawal
        )}</td>
                  </tr>`;
      })
      .join("");
  }
  return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
}

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
          if (typeof cell === "number" && isNaN(cell))
            cell = "NaN"; // Handle NaN for CSV
          else if (cell === undefined) cell = ""; // Handle undefined for CSV
          else if (typeof cell === "string" && cell.includes(","))
            cell = `"${cell.replace(/"/g, '""')}"`; // Escape quotes
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
document.addEventListener("DOMContentLoaded", addCollapsibleEventListeners);

function runSimulations() {
  const inputs = getInputs();
  const resultsTableDiv = document.getElementById("resultsTable");
  const chartSVG = document.getElementById("portfolioChart");
  const detailedLogDiv = document.getElementById("detailedLogOutput");

  if (
    inputs.startBalance <= 0 ||
    inputs.initialWithdrawal < 0 ||
    inputs.timeHorizon <= 0 ||
    inputs.numSimulations <= 0
  ) {
    resultsTableDiv.innerHTML =
      "<p style='color:red;'>Invalid inputs: Balance, Horizon, Simulations > 0. Withdrawal >= 0.</p>";
    chartSVG.innerHTML =
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Invalid inputs.</text>';
    detailedLogDiv.style.display = "none";
    return;
  }
  if (inputs.timeHorizon > 200) {
    // Add a practical limit for time horizon to prevent excessive loops
    resultsTableDiv.innerHTML =
      "<p style='color:red;'>Time Horizon too large (max 200 years).</p>";
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
    // Allow 0 for refill threshold
    resultsTableDiv.innerHTML =
      "<p style='color:red;'>Invalid Bucket strategy parameters.</p>";
    chartSVG.innerHTML =
      '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Invalid Bucket inputs.</text>';
    detailedLogDiv.style.display = "none";
    return;
  }

  resultsTableDiv.innerHTML = "<p>Running simulations... please wait.</p>";
  chartSVG.innerHTML =
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Calculating...</text>';
  detailedLogDiv.innerHTML = "<p>Calculating detailed logs...</p>";
  detailedLogDiv.style.display = "block";

  const masterRunSeed = Date.now();

  setTimeout(() => {
    try {
      const resultsBucket = runMonteCarlo(
        simulateThreeBucketStrategy_Detailed,
        inputs.numSimulations,
        inputs,
        {
          bucket1Years: inputs.bucket1Years,
          bucket1RefillThresholdYears: inputs.bucket1RefillThresholdYears,
          bucket2YearsBonds: inputs.bucket2YearsBonds,
        },
        masterRunSeed
      );

      const resultsTotalReturn = runMonteCarlo(
        simulateTotalReturnStrategy_Detailed,
        inputs.numSimulations,
        inputs,
        {
          trStockAllocationRatio: inputs.trStockAllocationRatio,
        },
        masterRunSeed + inputs.numSimulations
      );

      const detailedSimBucket = simulateThreeBucketStrategy_Detailed(
        inputs,
        resultsBucket.medianRunSeed
      );
      detailedLogBucketGlobal = detailedSimBucket.detailedLog;

      const detailedSimTR = simulateTotalReturnStrategy_Detailed(
        inputs,
        resultsTotalReturn.medianRunSeed
      );
      detailedLogTRGlobal = detailedSimTR.detailedLog;

      displayResults(
        inputs,
        resultsBucket,
        resultsTotalReturn,
        detailedSimBucket.detailedLog,
        detailedSimTR.detailedLog
      );
    } catch (e) {
      console.error("Error during simulation or display:", e);
      resultsTableDiv.innerHTML = `<p style='color:red;'>An error occurred: ${e.message}. Check console.</p>`;
      chartSVG.innerHTML =
        '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">Error.</text>';
      detailedLogDiv.innerHTML = `<p style='color:red;'>An error occurred during simulation: ${e.message}. Check console.</p>`;
    }
  }, 50);
}
