export function errorHandler(error, _req, res, _next) {
	if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
		res.status(409).json({
			error: {
				message: "Duplicate record",
				code: error.code,
			},
		});
		return;
	}

	const statusCode = Number(error.statusCode) || 500;
	const response = {
		error: {
			message: error.message || "Internal server error",
		},
	};

	if (error.details) {
		response.error.details = error.details;
	}

	if (process.env.NODE_ENV !== "production" && error.stack) {
		response.error.stack = error.stack;
	}

	res.status(statusCode).json(response);
}
