export function serializeReport(report) {
	const upvotes = report.upvotes || [];
	const upvoteCount = typeof report.upvoteCount === "number" ? report.upvoteCount : typeof report._count?.upvotes === "number" ? report._count.upvotes : upvotes.length;

	return {
		id: report.id,
		title: report.title,
		description: report.description,
		categories: report.categories,
		latitude: report.latitude,
		longitude: report.longitude,
		imageUrl: report.imageUrl,
		resolutionImageUrl: report.resolutionImageUrl,
		userEmail: report.userEmail,
		status: report.status,
		createdAt: report.createdAt,
		updatedAt: report.updatedAt,
		upvoteCount,
		upvotes: upvotes.map((upvote) => ({
			id: upvote.id,
			userIp: upvote.userIp,
			createdAt: upvote.createdAt,
		})),
	};
}
