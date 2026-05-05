import { Router } from "express";
import { createHttpError } from "../utils/httpError.js";
import { validateAdminLoginPayload } from "../utils/validation.js";

const router = Router();

router.post("/", async (req, res, next) => {
	try {
		const configuredUsername = process.env.ADMIN_USERNAME;
		const configuredPassword = process.env.ADMIN_PASSWORD;
		const configuredToken = process.env.ADMIN_TOKEN;

		if (!configuredUsername || !configuredPassword || !configuredToken) {
			throw createHttpError(500, "Admin credentials are not configured");
		}

		const credentials = validateAdminLoginPayload(req.body);
		if (credentials.username !== configuredUsername || credentials.password !== configuredPassword) {
			throw createHttpError(401, "Invalid admin credentials");
		}

		res.json({
			token: configuredToken,
			admin: {
				username: configuredUsername,
			},
		});
	} catch (error) {
		next(error);
	}
});

export default router;
