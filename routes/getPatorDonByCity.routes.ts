import express from "express";
import { bycity } from "../controllers/bycity.controller.ts";
const PorDBycity = express.Router();

PorDBycity.get("/getByCity", bycity);
export default PorDBycity;
