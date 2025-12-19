import { combineReducers } from "@reduxjs/toolkit";

// adjust import paths if your slices are in a different folder
import auth from "../store/slices/authSlice";
import materials from "../store/slices/materialSlice";
import adminProjects from "../store/slices/adminProjectsSlice";
import adminUsers from "../store/slices/adminUsersSlice";
import adminAllocations from "../store/slices/adminAllocationsSlice";
import workspace from "../store/slices/workspaceSlice";
import workspaceUi from "../store/slices/workspaceUiSlice";
import inventory from "../store/slices/inventorySlice";
import bom from "../store/slices/bomSlice";
import history from "../store/slices/historySlice";
import procurement from "../store/slices/procurementSlice";
import app from "../store/slices/appSlice";
import vehicles from "../store/slices/vehicleSlice";

const rootReducer = combineReducers({
  auth,
  materials,
  adminProjects,
  adminUsers,
  adminAllocations,
  workspace,
  workspaceUi,
  inventory,
  bom,
  history,
  procurement,
  app,
  vehicles,
});

export default rootReducer;
