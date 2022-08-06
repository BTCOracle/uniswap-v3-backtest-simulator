import { createSlice, current } from "@reduxjs/toolkit";
import { createSelector } from "reselect";
import { roundToNearestTick } from "../helpers/uniswap/liquidity";
import chartColors from "../data/colors.json";
import { round } from "../helpers/numbers";
