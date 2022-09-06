import { createSlice, current } from "@reduxjs/toolkit";
import { createSelector } from "reselect";
import { roundToNearestTick } from "../helpers/uniswap/liquidity";
import chartColors from "../data/colors.json";
import { round } from "../helpers/numbers";

const initialState ={type: "amount", strategies: [
  {id: "S1", name: "Strategy 1", color: chartColors['uniswap'].S1, 
    inputs: { min: { value: 1, name: "Min", label: "Min Range S1", percent: 0 }, max: {value: 1, name: "Max", label: "Max Range S1", percent: 0 } },
    liquidityMultiplier: 1, selected: true, leverage: 1, rangesEditable: true, tokenratio: {token0: 0.5, token1: 0.5}, hedging: {type: "short", leverage: 1, amount: 0}
  }, 
  {id: "S2", name: "Strategy 2", color: chartColors['uniswap'].S2, 
    inputs:  { min: { value: 1, name: "Min", label: "Min Range S1", percent: 0 }, max: {value: 1, name: "Max", label: "Max Range S2", percent: 0 } },
    liquidityMultiplier: 1, selected: false, leverage: 1, rangesEditable: true, tokenratio: {token0: 0.5, token1: 0.5}, hedging: {type: "short", leverage: 1, amount: 0}
  },
  {id: "v2", name: "Unbounded", color: chartColors['uniswap'].v2, 
    inputs:  { min: { value: Math.pow(1.0001, -887220), name: "Min", label: "Min Range V2", percent: 0 }, max: {value: Math.pow(1.0001, 887220), name: "Max", label: "Max Range V2", percent: 0 } },
    liquidityMultiplier: 1, selected: true, leverage: 1, rangesEditable: false, tokenratio: {token0: 0.5, token1: 0.5}, hedging: {type: "short", leverage: 1, amount: 0}
  }]} ;

const calcContrentratedLiquidityMultiplier = (min, max) => {
  return Math.round((1 / (1 - Math.pow((min / max), 0.25))) * 100) / 100;
}

export const validateStrategyRangeValue = (strategy, key, value) => {
  if (key === 'min') {
    return strategy.inputs["max"].value > value ? true : false;
  }
  else if (key === 'max') {
    return strategy.inputs["min"].value < value ? true : false;
  }
