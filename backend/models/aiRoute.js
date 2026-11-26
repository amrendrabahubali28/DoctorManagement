// aiRoute.js
import express from "express";
import { chatController } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/chat", chatController);

export default aiRouter;