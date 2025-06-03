-----------------------------------------------
COLUMN HEADERS FOR 3-BUCKET STRATEGY EXPLAINED
-----------------------------------------------

| Column Header          | What it Represents                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| **Year**               | Which year of the simulation you’re looking at (1, 2, 3, …).                                         |
| **Start Port.**        | Total portfolio value at the **beginning** of that year.                                             |
| **Withdrawal**         | Amount you pulled out for living expenses during that year.                                          |
| **B1 Start**           | Cash bucket (Bucket 1) balance at the start of the year.                                             |
| **B1 W/D**             | Portion of your withdrawal taken out of Bucket 1.                                                    |
| **B1 Ret%**            | Cash bucket’s percentage return that year (e.g., interest earned).                                   |
| **B1 Growth**          | Dollar amount the cash bucket gained or lost from returns.                                           |
| **B1 After Growth**    | Cash bucket balance **after** adding/subtracting growth.                                             |
| **B1 Target \$**       | How much cash you aim to keep in Bucket 1 (based on your “years of expenses” setting).               |
| **B1 Refill Amt**      | Dollars moved into Bucket 1 to bring it back up to its target.                                       |
| **B1 Refill Src**      | Where those refill dollars came from (e.g., from reallocating the overall portfolio or from B2).     |
| **B1 End**             | Cash bucket balance at the **end** of the year (after growth and any refilling).                     |
| **B2 Start**           | Bonds bucket (Bucket 2) balance at the start of the year.                                            |
| **B2 W/D**             | Portion of your withdrawal taken out of Bucket 2.                                                    |
| **B2 Ret%**            | Bond bucket’s percentage return that year.                                                           |
| **B2 Growth**          | Dollar amount the bond bucket gained or lost from returns.                                           |
| **B2 After Growth**    | Bond bucket balance after growth.                                                                    |
| **B2 Target \$**       | How much you aim to keep in Bucket 2 (based on its “years of expenses” setting).                     |
| **B2 To B1**           | Dollars transferred from Bucket 2 into Bucket 1 to refill it during down markets.                    |
| **B2 Rebal.**          | Dollars moved between B2 and B3 when rebalancing in up markets or after refills.                     |
| **B2 End**             | Bond bucket balance at the end of the year.                                                          |
| **B3 Start**           | Stock bucket (Bucket 3) balance at the start of the year.                                            |
| **B3 W/D**             | Portion of your withdrawal taken out of Bucket 3.                                                    |
| **B3 Ret% (Decision)** | Stock bucket’s return **used to decide** whether markets were “up” or “down” for rebalancing.        |
| **B3 Growth**          | Dollar amount the stock bucket gained or lost from returns.                                          |
| **B3 After Growth**    | Stock bucket balance after growth.                                                                   |
| **B3 To B1**           | Dollars moved from Bucket 3 into Bucket 1 (only if both B1 & B2 are empty).                          |
| **B3 Rebal.**          | Dollars moved from B2 into B3 (in down markets) or from B3 into B2 (in up markets) during rebalance. |
| **B3 End**             | Stock bucket balance at the end of the year.                                                         |
| **Realloc Strat.**     | Which refill/rebalancing rule was applied that year (e.g., “Market Up/Flat” or “Market Down”).       |
| **End Port.**          | Total portfolio value at the **end** of the year (sum of B1 + B2 + B3).                              |
| **Next Yr W/D**        | How much your annual withdrawal will be next year (inflation-adjusted).                              |


----------------------------------------------------
COLUMN HEADERS FOR TOTAL RETURN STRATEGY EXPLAINED
----------------------------------------------------

| Column Header          | What it Represents                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Yr**                 | Which year of the simulation you’re looking at (1, 2, 3, …).                                     |
| **Start Port.**        | Total portfolio value at the **beginning** of that year.                                         |
| **W/D Amt**            | Amount you pulled out for living expenses during that year.                                      |
| **Inflation**          | The inflation rate for that year (used to adjust future withdrawals).                            |
| **Port. After W/D**    | Portfolio value **after** subtracting that year’s withdrawal.                                    |
| **Stock Start**        | Stock holdings balance at the **start** of the year.                                             |
| **Stock W/D**          | Portion of your withdrawal taken out of stocks.                                                  |
| **Stock Eff.Ret%**     | Stock holdings’ effective percentage return for the year (adjusted for inflation if applicable). |
| **Stock Growth**       | Dollar amount the stock holdings gained or lost from returns.                                    |
| **Stock After Growth** | Stock balance **after** applying that year’s growth.                                             |
| **Stock Rebal.**       | Dollars moved between stocks and bonds to restore the target allocation.                         |
| **Stock End**          | Stock holdings balance at the **end** of the year.                                               |
| **Bond Start**         | Bond holdings balance at the **start** of the year.                                              |
| **Bond W/D**           | Portion of your withdrawal taken out of bonds.                                                   |
| **Bond Eff.Ret%**      | Bond holdings’ percentage return for the year.                                                   |
| **Bond Growth**        | Dollar amount the bond holdings gained or lost from returns.                                     |
| **Bond After Growth**  | Bond balance **after** applying that year’s growth.                                              |
| **Bond Rebal.**        | Dollars moved between bonds and stocks to restore the target allocation.                         |
| **Bond End**           | Bond holdings balance at the **end** of the year.                                                |
| **End Port.**          | Total portfolio value at the **end** of the year (sum of stocks + bonds).                        |
| **Next Yr W/D Base**   | Base amount for next year’s withdrawal (adjusted by inflation if using nominal dollars).         |

