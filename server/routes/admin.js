import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { createHttpError } from "../utils/httpError.js";
import { serializeReport } from "../utils/reportSerializer.js";
import { validateCompletionPayload, validateStatusQuery } from "../utils/validation.js";

const router = Router();

router.get("/reports", async (req, res, next) => {
	try {
		const status = validateStatusQuery(req.query.status);
		const reports = await prisma.report.findMany({
			where: status ? { status } : undefined,
			include: {
				_count: {
					select: { upvotes: true },
				},
			},
			orderBy: [{ status: "asc" }, { upvotes: { _count: "desc" } }, { createdAt: "desc" }],
		});

		res.json(reports.map(serializeReport));
	} catch (error) {
		next(error);
	}
});

router.patch("/reports/:id/complete", async (req, res, next) => {
	try {
		const { resolutionImageUrl } = validateCompletionPayload(req.body);
		const existingReport = await prisma.report.findUnique({
			where: { id: req.params.id },
		});
		if (!existingReport) {
			throw createHttpError(404, "Report not found");
		}

		const report = await prisma.report.update({
			where: { id: req.params.id },
			data: {
				status: "COMPLETED",
				resolutionImageUrl,
			},
			include: {
				_count: {
					select: { upvotes: true },
				},
			},
		});

		res.json(serializeReport(report));
	} catch (error) {
		next(error);
	}
});

export default router;
