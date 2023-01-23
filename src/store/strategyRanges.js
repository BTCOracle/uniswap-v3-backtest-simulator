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

  return false;
}

export const updateStrategyRangeInputVal = (range) => {

  return (dispatch, getState) => {
    const baseDecimal = getState().pool.value.baseToken.decimals;
    const quoteDecimal = getState().pool.value.quoteToken.decimals;
    const feeTier = getState().pool.value.feeTier;
    dispatch(setStrategyRangeInputVal({key: range.key, id: range.id, value: roundToNearestTick( range.value, feeTier, baseDecimal, quoteDecimal), percent: range.percent}));
  }
}

export const strategyRanges = createSlice({
  name: "strategyRanges",
  initialState: initialState,
  reducers: {
    crementStrategyRangeInputVal: (state, action) => {
      const index = state.findIndex(i => i.id === action.payload.id);
      if (index >= 0) {

        const key = action.payload.key;
        const crement = action.payload.crement;
        const newValue = parseFloat(state[index].inputs[key].value) + parseFloat(crement);

        if (validateStrategyRangeValue(state[index], key, newValue)) {
          state[index].liquidityMultiplier = calcContrentratedLiquidityMultiplier(state[index].inputs['min'].value, state[index].inputs['max'].value);
        }
      }
    
    },
    setStrategyRangeType: (state, action) => {
      state.type = action.payload;
    }, 
    toggleStrategyRangeInputVals: (state, action) => {

      if (action.payload.baseToken) {

        const currentPrice = action.payload.baseToken.currentPrice;
        const baseDecimal = action.payload.baseToken.decimals;
        const quoteDecimal = action.payload.quoteToken.decimals;
        const feeTier = action.payload.feeTier;

        const max1 = 1 / state.strategies[0].inputs["min"].value;
        const min1 = 1 / state.strategies[0].inputs["max"].value;
        const max2 = 1 / state.strategies[1].inputs["min"].value;
        const min2 = 1 / state.strategies[1].inputs["max"].value;

        let s1Min, s1Max, s2Min, s2Max;

        s1Min = roundToNearestTick(min1, feeTier, baseDecimal, quoteDecimal);
        s1Max = roundToNearestTick(max1, feeTier, baseDecimal, quoteDecimal);
        s2Min = roundToNearestTick(min2, feeTier, baseDecimal, quoteDecimal);
        s2Max = roundToNearestTick(max2, feeTier, baseDecimal, quoteDecimal);

        state.strategies[0].inputs["min"].value = s1Min;
        state.strategies[0].inputs["max"].value = s1Max;
        state.strategies[1].inputs["min"].value = s2Min;
        state.strategies[1].inputs["max"].value = s2Max;

        state.strategies[0].inputs["min"].percent = round(((s1Min- currentPrice) / currentPrice) * 100, 1);
        state.strategies[0].inputs["max"].percent = round(((s1Max - currentPrice) / currentPrice) * 100, 1);
        state.strategies[1].inputs["min"].percent = round(((s2Min - currentPrice) / currentPrice) * 100, 1);
        state.strategies[1].inputs["max"].percent = round(((s2Max - currentPrice) / currentPrice) * 100, 1);
        

        state.strategies[0].liquidityMultiplier = calcContrentratedLiquidityMultiplier(state.strategies[0].inputs['min'].value, state.strategies[0].inputs['max'].value);
        state.strategies[1].liquidityMultiplier = calcContrentratedLiquidityMultiplier(state.strategies[1].inputs['min'].value, state.strategies[1].inputs['max'].value);
      }

    },
    setDefaultStrategyRangeInputVals: (state, action) => {

      if (action.payload.baseToken) {

        const currentPrice = action.payload.baseToken.currentPrice;
        const baseDecimal = action.payload.baseToken.decimals;
        const quoteDecimal = action.payload.quoteToken.decimals;
        const std = action.payload.std;
        const feeTier = action.payload.feeTier;
        let s1Min, s1Max, s2Min, s2Max;

        if (!isNaN(std) && std === 1) { 

          s1Min = roundToNearestTick(currentPrice * 0.9, feeTier, baseDecimal, quoteDecimal);
          s1Max = roundToNearestTick(currentPrice * 1.1, feeTier, baseDecimal, quoteDecimal);
          s2Min = roundToNearestTick(currentPrice * 1.1, feeTier, baseDecimal, quoteDecimal);
          s2Max = roundToNearestTick(currentPrice * 1.2, feeTier, baseDecimal, quoteDecimal);
        }
        else {
          
          const stdP = (std / currentPrice) * 100;
          const multiplier = stdP < 2 ? 8 : 1;

          s1Min = roundToNearestTick(currentPrice - (multiplier * std), feeTier, baseDecimal, quoteDecimal);
          s1Max = roundToNearestTick(currentPrice + (multiplier * std), feeTier, baseDecimal, quoteDecimal);
          s2Min = roundToNearestTick(currentPrice - ((multiplier * 2) * std), feeTier, baseDecimal, quoteDecimal);
          s2Max = roundToNearestTick(currentPrice + ((multiplier * 2)  * std), feeTier, baseDecimal, quoteDecimal);
        }

        state.strategies[0].inputs["min"].value = s1Min;
        state.strategies[0].inputs["max"].value = s1Max;
        state.strategies[1].inputs["min"].value = s2Min;
        state.strategies[1].inputs["max"].value = s2Max;

        console.log(s1Min, s1Max, currentPrice);

        state.strategies[0].inputs["min"].percent = round(((s1Min - currentPrice) / currentPrice) * 100, 1);
        state.strategies[0].inputs["max"].percent = round(((s1Max - currentPrice) / currentPrice) * 100, 1);
        state.strategies[1].inputs["min"].percent = round(((s2Min - currentPrice) / currentPrice) * 100, 1);
        state.strategies[1].inputs["max"].percent = round(((s2Max - currentPrice) / currentPrice) * 100, 1);

        state.strategies[0].liquidityMultiplier = calcContrentratedLiquidityMultiplier(state.strategies[0].inputs['min'].value, state.strategies[0].inputs['max'].value);
        state.strategies[1].liquidityMultiplier = calcContrentratedLiquidityMultiplier(state.strategies[1].inputs['min'].value, state.strategies[1].inputs['max'].value);

      }

    },
    setStrategyRangeInputVal: (state, action) => {

      const index = state.strategies.findIndex(i => i.id === action.payload.id);
      if (index >= 0) {
        const key = action.payload.key;
        const value = action.payload.value;
        state.strategies[index].inputs[key].value = value;
        state.strategies[index].inputs[key].percent = action.payload.percent;
        state.strategies[index].liquidityMultiplier = calcContrentratedLiquidityMultiplier(state.strategies[index].inputs['min'].value, state.strategies[index].inputs['max'].value);
      }
      
    },
    setStrategyRangeInputPerc: (state, action) => {

      const index = state.strategies.findIndex(i => i.id === action.payload.id);
      if (index >= 0) {

        const key = action.payload.key;
        state.strategies[index].inputs[key].percent = action.payload.percent;
        state.strategies[index].inputs[key].value = action.payload.value;
        state.strategies[index].liquidityMultiplier = calcContrentratedLiquidityMultiplier(state.strategies[index].inputs['min'].value, state.strategies[index].inputs['max'].value);
      }
    },
    setStrategyRangeSelected: (state, action) => {
      const index = state.strategies.findIndex(i => i.id === action.payload);
      if (index >=0) {
        state.strategies[index].selected = state.strategies[index].selected === true ? false : true;
