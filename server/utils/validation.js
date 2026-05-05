import { createHttpError } from "./httpError.js";

function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}

function toFiniteNumber(value) {
	const number = typeof value === "number" ? value : Number(value);
	return Number.isFinite(number) ? number : null;
}

export function validateReportPayload(payload) {
	if (!payload || typeof payload !== "object") {
		throw createHttpError(400, "Request body is required");
	}

	if (!isNonEmptyString(payload.title)) {
		throw createHttpError(400, "title is required");
	}

	if (!isNonEmptyString(payload.description)) {
		throw createHttpError(400, "description is required");
	}

	if (!Array.isArray(payload.categories) || payload.categories.length === 0) {
		throw createHttpError(400, "categories must be a non-empty array");
	}

	const cleanCategories = payload.categories.map((category) => String(category).trim()).filter(Boolean);
	if (cleanCategories.length === 0) {
		throw createHttpError(400, "categories must contain at least one valid value");
	}

	const latitude = toFiniteNumber(payload.latitude);
	const longitude = toFiniteNumber(payload.longitude);
	if (latitude === null || longitude === null) {
		throw createHttpError(400, "latitude and longitude must be valid numbers");
	}

	return {
		title: payload.title.trim(),
		description: payload.description.trim(),
		categories: cleanCategories,
		latitude,
		longitude,
		imageUrl: isNonEmptyString(payload.imageUrl) ? payload.imageUrl.trim() : null,
		userEmail: payload.isAnonymous ? null : isNonEmptyString(payload.userEmail) ? payload.userEmail.trim() : null,
	};
}

export function validateUpvotePayload(payload) {
	if (!payload || typeof payload !== "object") {
		return { userIp: null };
	}

	return {
		userIp: isNonEmptyString(payload.userIp) ? payload.userIp.trim() : null,
	};
}

export function validateCompletionPayload(payload) {
	if (!payload || typeof payload !== "object") {
		throw createHttpError(400, "Request body is required");
	}

	if (!isNonEmptyString(payload.resolutionImageUrl)) {
		throw createHttpError(400, "resolutionImageUrl is required");
	}

	return {
		resolutionImageUrl: payload.resolutionImageUrl.trim(),
	};
}

export function validateAdminLoginPayload(payload) {
	if (!payload || typeof payload !== "object") {
		throw createHttpError(400, "Request body is required");
	}

	if (!isNonEmptyString(payload.username)) {
		throw createHttpError(400, "username is required");
	}

	if (!isNonEmptyString(payload.password)) {
		throw createHttpError(400, "password is required");
	}

	return {
		username: payload.username.trim(),
		password: payload.password.trim(),
	};
}

export function validateStatusQuery(statusValue) {
	if (typeof statusValue === "undefined") {
		return null;
	}

	const normalized = String(statusValue).trim().toUpperCase();
	if (!["PENDING", "REAL", "COMPLETED"].includes(normalized)) {
		throw createHttpError(400, "Invalid status filter");
	}

	return normalized;
}
