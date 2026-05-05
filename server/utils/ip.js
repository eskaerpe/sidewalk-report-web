import { createHash } from "node:crypto";

function normalizeIp(ip) {
	if (!ip) {
		return null;
	}

	const first = String(ip).split(",")[0].trim();
	if (first.startsWith("::ffff:")) {
		return first.replace("::ffff:", "");
	}

	return first;
}

export function extractClientIp(req, bodyIp) {
	const fromBody = normalizeIp(bodyIp);
	if (fromBody) {
		return fromBody;
	}

	const forwarded = normalizeIp(req.headers["x-forwarded-for"]);
	if (forwarded) {
		return forwarded;
	}

	const realIp = normalizeIp(req.headers["x-real-ip"]);
	if (realIp) {
		return realIp;
	}

	return normalizeIp(req.ip) || "0.0.0.0";
}

export function hashIp(ip) {
	return createHash("sha256").update(ip).digest("hex");
}
