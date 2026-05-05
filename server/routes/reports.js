import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { createHttpError } from "../utils/httpError.js";
import { extractClientIp, hashIp } from "../utils/ip.js";
import { serializeReport } from "../utils/reportSerializer.js";
import { validateReportPayload, validateStatusQuery, validateUpvotePayload } from "../utils/validation.js";

const router = Router();

router.post("/", async (req, res, next) => {
	try {
		const payload = validateReportPayload(req.body);
		const report = await prisma.report.create({
			data: {
				title: payload.title,
				description: payload.description,
				categories: payload.categories,
				latitude: payload.latitude,
				longitude: payload.longitude,
				imageUrl: payload.imageUrl,
				userEmail: payload.userEmail,
			},
			include: {
				upvotes: true,
			},
		});

		res.status(201).json(serializeReport(report));
	} catch (error) {
		next(error);
	}
});

router.get("/", async (req, res, next) => {
	try {
		const status = validateStatusQuery(req.query.status);
		const reports = await prisma.report.findMany({
			where: status ? { status } : undefined,
			include: {
				upvotes: {
					orderBy: {
						createdAt: "asc",
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		res.json(reports.map(serializeReport));
	} catch (error) {
		next(error);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const report = await prisma.report.findUnique({
			where: { id: req.params.id },
			include: {
				upvotes: {
					orderBy: {
						createdAt: "asc",
					},
				},
			},
		});

		if (!report) {
			throw createHttpError(404, "Report not found");
		}

		res.json(serializeReport(report));
	} catch (error) {
		next(error);
	}
});

router.post("/:id/upvote", async (req, res, next) => {
	try {
		const reportId = req.params.id;
		const payload = validateUpvotePayload(req.body);
		const rawIp = extractClientIp(req, payload.userIp);
		const anonymizedIp = hashIp(rawIp);

		const report = await prisma.report.findUnique({
			where: { id: reportId },
		});
		if (!report) {
			throw createHttpError(404, "Report not found");
		}

		let isNewUpvote = true;
		try {
			await prisma.upvote.create({
				data: {
					reportId,
					userIp: anonymizedIp,
				},
			});
		} catch (error) {
			if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
				isNewUpvote = false;
			} else {
				throw error;
			}
		}

		const totalUpvotes = await prisma.upvote.count({
			where: { reportId },
		});

		if (report.status === "PENDING" && totalUpvotes >= 5) {
			await prisma.report.update({
				where: { id: reportId },
				data: { status: "REAL" },
			});
		}

		const updatedReport = await prisma.report.findUnique({
			where: { id: reportId },
			include: {
				upvotes: {
					orderBy: {
						createdAt: "asc",
					},
				},
			},
		});

		res.json({
			report: serializeReport(updatedReport),
			isNewUpvote,
			totalUpvotes,
		});
	} catch (error) {
		next(error);
	}
});

export default router;
