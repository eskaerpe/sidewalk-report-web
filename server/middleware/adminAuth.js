import { createHttpError } from "../utils/httpError.js";

export function adminAuth(req, _res, next) {
	const configuredToken = process.env.ADMIN_TOKEN;
	if (!configuredToken) {
		next(createHttpError(500, "ADMIN_TOKEN is not configured"));
		return;
	}

	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		next(createHttpError(401, "Missing bearer token"));
		return;
	}

	const token = authHeader.slice("Bearer ".length).trim();
	if (token !== configuredToken) {
		next(createHttpError(403, "Invalid admin token"));
		return;
	}

	next();
}
