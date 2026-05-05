import app from "./app.js";

const port = Number(process.env.API_PORT || process.env.PORT || 3001);

app.listen(port, () => {
	console.log(`UrbanFix API running on http://localhost:${port}`);
});
