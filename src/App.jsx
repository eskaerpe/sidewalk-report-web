import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const STATUS_LABELS = {
	PENDING: "Pending",
	REAL: "Real",
	COMPLETED: "Completed",
};

const STATUS_ORDER = {
	PENDING: 0,
	REAL: 1,
	COMPLETED: 2,
};

const CITY_CENTER = [-6.905, 107.611];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const ADMIN_TOKEN_KEY = "urbanfix.adminToken";
const ADMIN_PROFILE_KEY = "urbanfix.adminProfile";

L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2x,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

const cardBase = "rounded-3xl border border-[#3a281b1f] bg-white/80 p-4 shadow-[0_18px_50px_rgba(68,44,26,0.12)] backdrop-blur-sm md:p-6";
const fieldBase = "w-full rounded-2xl border border-[#3a281b1f] bg-white/80 px-4 py-3 text-sm text-[#1f1a17] outline-none transition focus:border-[#b1442c66] focus:ring-2 focus:ring-[#b1442c33]";

function getStorageValue(key) {
	if (typeof window === "undefined") {
		return "";
	}

	try {
		return window.localStorage.getItem(key) || "";
	} catch {
		return "";
	}
}

function setStorageValue(key, value) {
	if (typeof window === "undefined") {
		return;
	}

	try {
		if (value) {
			window.localStorage.setItem(key, value);
		} else {
			window.localStorage.removeItem(key);
		}
	} catch {
		return;
	}
}

function buildApiUrl(path) {
	return `${API_BASE_URL}${path}`;
}

function normalizeReport(report) {
	const upvotes = Array.isArray(report.upvotes) ? report.upvotes : [];

	return {
		...report,
		upvotes,
		upvoteCount: typeof report.upvoteCount === "number" ? report.upvoteCount : upvotes.length,
	};
}

async function apiRequest(path, options = {}) {
	const headers = new Headers(options.headers || {});
	if (options.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	const response = await fetch(buildApiUrl(path), {
		...options,
		headers,
	});

	const text = await response.text();
	let data = null;
	if (text) {
		try {
			data = JSON.parse(text);
		} catch {
			data = null;
		}
	}

	if (!response.ok) {
		throw new Error(data?.error?.message || `Request failed with status ${response.status}`);
	}

	return data;
}

function App() {
	const [reports, setReports] = useState([]);
	const [isLoadingReports, setIsLoadingReports] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [adminToken, setAdminToken] = useState(() => getStorageValue(ADMIN_TOKEN_KEY));
	const [adminProfile, setAdminProfile] = useState(() => {
		const storedProfile = getStorageValue(ADMIN_PROFILE_KEY);
		if (!storedProfile) {
			return null;
		}

		try {
			return JSON.parse(storedProfile);
		} catch {
			return null;
		}
	});

	useEffect(() => {
		setStorageValue(ADMIN_TOKEN_KEY, adminToken);
	}, [adminToken]);

	useEffect(() => {
		setStorageValue(ADMIN_PROFILE_KEY, adminProfile ? JSON.stringify(adminProfile) : "");
	}, [adminProfile]);

	const reloadReports = async () => {
		setIsLoadingReports(true);
		setLoadError("");

		try {
			const data = await apiRequest("/api/reports");
			setReports(data.map(normalizeReport));
		} catch (error) {
			setReports([]);
			setLoadError(error.message || "Failed to load reports");
		} finally {
			setIsLoadingReports(false);
		}
	};

	useEffect(() => {
		void reloadReports();
	}, []);

	const upsertReport = (updatedReport) => {
		const normalizedReport = normalizeReport(updatedReport);
		setReports((currentReports) => {
			const existingIndex = currentReports.findIndex((report) => report.id === normalizedReport.id);
			if (existingIndex === -1) {
				return [normalizedReport, ...currentReports];
			}

			return currentReports.map((report) => (report.id === normalizedReport.id ? normalizedReport : report));
		});
		return normalizedReport;
	};

	const createReport = async (payload) => {
		const response = await apiRequest("/api/reports", {
			method: "POST",
			body: JSON.stringify({
				title: payload.title,
				description: payload.description,
				categories: payload.categories,
				latitude: payload.latitude,
				longitude: payload.longitude,
				imageUrl: payload.imageUrl,
				isAnonymous: payload.isAnonymous,
				userEmail: payload.userEmail,
			}),
		});

		const createdReport = upsertReport(response);
		setReports((currentReports) => [createdReport, ...currentReports.filter((report) => report.id !== createdReport.id)]);
		return createdReport;
	};

	const addUpvote = async (reportId, userIp) => {
		const response = await apiRequest(`/api/reports/${reportId}/upvote`, {
			method: "POST",
			body: JSON.stringify({ userIp }),
		});

		const updatedReport = upsertReport(response.report);
		return {
			report: updatedReport,
			isNewUpvote: response.isNewUpvote,
			totalUpvotes: response.totalUpvotes,
		};
	};

	const completeReport = async (reportId, resolutionImageUrl) => {
		if (!adminToken) {
			throw new Error("Admin login is required");
		}

		const response = await apiRequest(`/api/admin/reports/${reportId}/complete`, {
			method: "PATCH",
			headers: {
				Authorization: `Bearer ${adminToken}`,
			},
			body: JSON.stringify({ resolutionImageUrl }),
		});

		return upsertReport(response);
	};

	const loginAdmin = async ({ username, password }) => {
		const response = await apiRequest("/api/admin/login", {
			method: "POST",
			body: JSON.stringify({ username, password }),
		});

		setAdminToken(response.token);
		setAdminProfile(response.admin || { username });
		return response;
	};

	const logoutAdmin = () => {
		setAdminToken("");
		setAdminProfile(null);
	};

	return (
		<div className="mx-auto w-[min(1180px,calc(100vw-20px))] pb-14 pt-4 md:w-[min(1180px,calc(100vw-32px))] md:pt-8">
			<header className="mb-6 flex flex-col gap-5 md:mb-8 md:flex-row md:items-end md:justify-between">
				<div>
					<p className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">UrbanFix</p>
					<h1 className="max-w-[12ch] font-display text-4xl leading-tight md:text-6xl">Turn local complaints into visible progress.</h1>
				</div>
				<nav
					className="flex flex-wrap gap-2.5"
					aria-label="Primary">
					<NavLink to="/">Forum</NavLink>
					<NavLink to="/submit">Submit</NavLink>
					<NavLink to="/map">City Map</NavLink>
					<NavLink to="/admin">Admin</NavLink>
				</nav>
			</header>

			{loadError ? (
				<section className={`${cardBase} mb-4 border-[#b1442c52] bg-[#fff8f0]`}>
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div>
							<p className="text-[11px] uppercase tracking-[0.16em] text-[#b1442c]">API status</p>
							<p className="text-sm text-[#6a5d55] md:text-base">{loadError}</p>
						</div>
						<button
							className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#b1442c] to-[#8f2f2f] px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
							type="button"
							onClick={() => void reloadReports()}>
							Retry
						</button>
					</div>
				</section>
			) : null}

			{isLoadingReports ? (
				<section className={`${cardBase} mb-4`}>
					<p className="text-sm text-[#6a5d55] md:text-base">Loading reports from the backend...</p>
				</section>
			) : null}

			<main className="grid gap-4 md:gap-5">
				<Routes>
					<Route
						path="/"
						element={
							<HomePage
								reports={reports}
								isLoadingReports={isLoadingReports}
							/>
						}
					/>
					<Route
						path="/submit"
						element={
							<SubmitPage
								onCreateReport={createReport}
								reports={reports}
								isLoadingReports={isLoadingReports}
							/>
						}
					/>
					<Route
						path="/map"
						element={
							<MapViewPage
								reports={reports}
								isLoadingReports={isLoadingReports}
							/>
						}
					/>
					<Route
						path="/admin"
						element={
							<AdminPage
								reports={reports}
								onCompleteReport={completeReport}
								onLogin={loginAdmin}
								onLogout={logoutAdmin}
								adminToken={adminToken}
								adminProfile={adminProfile}
								isLoadingReports={isLoadingReports}
							/>
						}
					/>
					<Route
						path="/upvote/:id"
						element={
							<UpvotePage
								reports={reports}
								onAddUpvote={addUpvote}
								isLoadingReports={isLoadingReports}
							/>
						}
					/>
					<Route
						path="*"
						element={
							<Navigate
								to="/"
								replace
							/>
						}
					/>
				</Routes>
			</main>
		</div>
	);
}

function NavLink({ to, children }) {
	return (
		<Link
			className="rounded-full border border-[#3a281b1f] bg-white/50 px-4 py-3 text-sm font-semibold text-[#1f1a17] shadow-inner shadow-white/50 transition hover:-translate-y-0.5"
			to={to}>
			{children}
		</Link>
	);
}

function HomePage({ reports, isLoadingReports }) {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");

	const filteredReports = useMemo(() => {
		return reports.filter((report) => {
			const normalizedSearch = searchTerm.toLowerCase();
			const matchesSearch = report.title.toLowerCase().includes(normalizedSearch) || report.description.toLowerCase().includes(normalizedSearch) || report.categories.some((category) => category.toLowerCase().includes(normalizedSearch));

			const matchesStatus = statusFilter === "ALL" || report.status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}, [reports, searchTerm, statusFilter]);

	const pendingCount = reports.filter((report) => report.status === "PENDING").length;
	const realCount = reports.filter((report) => report.status === "REAL").length;
	const completedCount = reports.filter((report) => report.status === "COMPLETED").length;
	const hasNoReports = !isLoadingReports && reports.length === 0;

	return (
		<section className="grid gap-4 md:gap-5">
			<section className={`${cardBase} grid gap-5 md:grid-cols-[1.3fr_0.9fr]`}>
				<div>
					<p className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">Home / Forum</p>
					<h2 className="font-display text-3xl leading-tight md:text-4xl">Recent city issues, ranked by community validation.</h2>
					<p className="mt-2 text-sm text-[#6a5d55] md:text-base">Browse new reports, verify what is real, and see which issues are already fixed.</p>
				</div>

				<div className="grid grid-cols-3 gap-3 sm:grid-cols-3 md:grid-cols-3">
					<Metric
						label="Pending"
						value={pendingCount}
					/>
					<Metric
						label="Real"
						value={realCount}
					/>
					<Metric
						label="Completed"
						value={completedCount}
					/>
				</div>
			</section>

			<section className={`${cardBase} grid gap-4 md:grid-cols-2`}>
				<label className="grid gap-2">
					<span className="text-sm text-[#6a5d55]">Search reports</span>
					<input
						className={fieldBase}
						type="search"
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Pothole, sidewalk, school light..."
					/>
				</label>

				<label className="grid gap-2">
					<span className="text-sm text-[#6a5d55]">Status</span>
					<select
						className={fieldBase}
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value)}>
						<option value="ALL">All statuses</option>
						<option value="PENDING">Pending</option>
						<option value="REAL">Real</option>
						<option value="COMPLETED">Completed</option>
					</select>
				</label>
			</section>

			<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{hasNoReports ? (
					<div className={`${cardBase} sm:col-span-2 lg:col-span-3`}>
						<p className="text-sm text-[#6a5d55] md:text-base">No reports are available yet. Submit the first issue to populate the forum.</p>
					</div>
				) : null}

				{filteredReports.map((report) => (
					<article
						className={`${cardBase} p-5`}
						key={report.id}>
						<div className="mb-3 flex items-center justify-between gap-3">
							<StatusBadge status={report.status} />
							<span className="text-sm text-[#6a5d55]">{report.upvoteCount} upvotes</span>
						</div>

						<h3 className="font-display text-2xl leading-tight">{report.title}</h3>
						<p className="mt-2 text-sm text-[#6a5d55] md:text-base">{report.description}</p>

						<div className="mt-4 flex flex-wrap gap-2.5">
							{report.categories.map((category) => (
								<span
									className="rounded-full border border-[#3a281b24] bg-white/70 px-3 py-2 text-xs font-semibold text-[#1f1a17] md:text-sm"
									key={category}>
									{category}
								</span>
							))}
						</div>

						<div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<span className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">Coordinates</span>
								<p className="text-sm font-semibold md:text-base">
									{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
								</p>
							</div>
							<Link
								className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#3a281b1f] bg-white/70 px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
								to={`/upvote/${report.id}`}>
								Verify
							</Link>
						</div>
					</article>
				))}
			</section>

			{!isLoadingReports && filteredReports.length === 0 ? (
				<section className={cardBase}>
					<p className="text-sm text-[#6a5d55] md:text-base">No reports match the current search and filter.</p>
				</section>
			) : null}
		</section>
	);
}

function Metric({ label, value }) {
	return (
		<div className="rounded-2xl border border-[#3a281b17] bg-[#fff8f0] p-4">
			<strong className="block text-3xl leading-none">{value}</strong>
			<span className="text-sm text-[#6a5d55]">{label}</span>
		</div>
	);
}

function SubmitPage({ onCreateReport, reports, isLoadingReports }) {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [locationError, setLocationError] = useState("");
	const [isLocating, setIsLocating] = useState(false);
	const [form, setForm] = useState({
		title: "",
		description: "",
		userEmail: "",
		imageUrl: "",
		latitude: -6.9,
		longitude: 107.61,
		categories: ["Pothole"],
		isAnonymous: true,
	});

	const selectedPosition = useMemo(() => {
		const latitude = Number(form.latitude);
		const longitude = Number(form.longitude);

		return [Number.isFinite(latitude) ? latitude : CITY_CENTER[0], Number.isFinite(longitude) ? longitude : CITY_CENTER[1]];
	}, [form.latitude, form.longitude]);

	const [draftPosition, setDraftPosition] = useState(selectedPosition);

	useEffect(() => {
		setDraftPosition(selectedPosition);
	}, [selectedPosition]);

	const setCoordinates = (latitude, longitude) => {
		setForm((currentForm) => ({
			...currentForm,
			latitude: Number(latitude.toFixed(6)),
			longitude: Number(longitude.toFixed(6)),
		}));
	};

	const toggleCategory = (category) => {
		setForm((currentForm) => ({
			...currentForm,
			categories: currentForm.categories.includes(category) ? currentForm.categories.filter((item) => item !== category) : [...currentForm.categories, category],
		}));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setIsSubmitting(true);
		setSubmitError("");

		try {
			const createdReport = await onCreateReport({
				...form,
				latitude: Number(form.latitude),
				longitude: Number(form.longitude),
			});
			navigate(`/upvote/${createdReport.id}`);
		} catch (error) {
			setSubmitError(error.message || "Unable to submit report");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleUseCurrentLocation = () => {
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			setLocationError("Geolocation is not supported in this browser.");
			return;
		}

		setIsLocating(true);
		setLocationError("");

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setDraftPosition([position.coords.latitude, position.coords.longitude]);
				setIsLocating(false);
			},
			(error) => {
				setLocationError(error.message || "Unable to get current location.");
				setIsLocating(false);
			},
			{ enableHighAccuracy: true, timeout: 8000 },
		);
	};

	const handleConfirmCrosshairLocation = () => {
		setCoordinates(draftPosition[0], draftPosition[1]);
	};

	return (
		<section className="grid gap-4 md:gap-5">
			<section className={cardBase}>
				<p className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">Submission Form</p>
				<h2 className="font-display text-3xl leading-tight md:text-4xl">Capture the issue once, then let the community confirm it.</h2>
				<p className="mt-2 text-sm text-[#6a5d55] md:text-base">The form supports anonymous reporting, category selection, media links, and a live Leaflet map picker for fast coordinate capture.</p>
			</section>

			{submitError ? (
				<section className={`${cardBase} border-[#b1442c52] bg-[#fff8f0]`}>
					<p className="text-sm text-[#b1442c]">{submitError}</p>
				</section>
			) : null}

			<form
				className={`${cardBase} grid gap-4`}
				onSubmit={handleSubmit}>
				<div className="grid gap-3 md:grid-cols-2 md:gap-4">
					<label className="grid gap-2 md:col-span-2">
						<span className="text-sm text-[#6a5d55]">Issue title</span>
						<input
							className={fieldBase}
							required
							value={form.title}
							onChange={(event) => setForm({ ...form, title: event.target.value })}
							placeholder="Streetlight flickers near the school gate"
						/>
					</label>

					<label className="grid gap-2 md:col-span-2">
						<span className="text-sm text-[#6a5d55]">Description</span>
						<textarea
							className={fieldBase}
							required
							rows={5}
							value={form.description}
							onChange={(event) => setForm({ ...form, description: event.target.value })}
							placeholder="Explain what residents are seeing and why it matters."
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm text-[#6a5d55]">Email contact</span>
						<input
							className={fieldBase}
							type="email"
							disabled={form.isAnonymous}
							value={form.userEmail}
							onChange={(event) => setForm({ ...form, userEmail: event.target.value })}
							placeholder="citizen@example.com"
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm text-[#6a5d55]">Image URL</span>
						<input
							className={fieldBase}
							value={form.imageUrl}
							onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
							placeholder="https://..."
						/>
					</label>

					{/* <label className="grid gap-2">
						<span className="text-sm text-[#6a5d55]">Latitude</span>
						<input
							className={fieldBase}
							type="number"
							step="0.000001"
							value={form.latitude}
							onChange={(event) => setForm({ ...form, latitude: event.target.value })}
						/>
					</label>

					<label className="grid gap-2">
						<span className="text-sm text-[#6a5d55]">Longitude</span>
						<input
							className={fieldBase}
							type="number"
							step="0.000001"
							value={form.longitude}
							onChange={(event) => setForm({ ...form, longitude: event.target.value })}
						/>
					</label> */}

					<label className="flex items-center gap-3 md:col-span-2">
						<input
							className="h-4 w-4 rounded border-[#3a281b33] text-[#b1442c]"
							type="checkbox"
							checked={form.isAnonymous}
							onChange={(event) => setForm({ ...form, isAnonymous: event.target.checked })}
						/>
						<span className="text-sm text-[#6a5d55]">Submit anonymously</span>
					</label>
				</div>

				<fieldset className="border-0 p-0">
					<legend className="mb-2 text-sm font-semibold">Categories</legend>
					<div className="flex flex-wrap gap-2.5">
						{["Pothole", "Broken Light", "Blocked Sidewalk", "Accessibility", "Road Damage"].map((category) => (
							<button
								className={
									form.categories.includes(category)
										? "rounded-full bg-[#b1442c24] px-4 py-2 text-xs font-semibold text-[#b1442c] transition hover:-translate-y-0.5 md:text-sm"
										: "rounded-full border border-[#3a281b24] bg-white/70 px-4 py-2 text-xs font-semibold text-[#1f1a17] transition hover:-translate-y-0.5 md:text-sm"
								}
								type="button"
								key={category}
								onClick={() => toggleCategory(category)}>
								{category}
							</button>
						))}
					</div>
				</fieldset>

				<section className="grid gap-4 rounded-3xl border border-dashed border-[#3a281b29] bg-white/60 p-4 md:gap-5">
					<div>
						<p className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">Map Picker</p>
						<h3 className="font-display text-2xl">Use the crosshair, then confirm</h3>
						<p className="mt-2 text-sm text-[#6a5d55] md:text-base">Move the map until the target point is under the crosshair, then press Select this location.</p>
						<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<button
								className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#3a281b1f] bg-white/80 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
								type="button"
								disabled={isLocating}
								onClick={handleUseCurrentLocation}>
								{isLocating ? "Locating..." : "📍 Use my location"}
							</button>
							<div className="rounded-2xl border border-[#b1442c33] bg-[#b1442c0a] px-3 py-2 sm:text-right">
								<p className="text-xs uppercase tracking-[0.08em] text-[#6a5d55]">Crosshair target</p>
								<p className="font-display text-lg text-[#1f1a17]">{draftPosition[0].toFixed(6)}</p>
								<p className="font-display text-lg text-[#1f1a17]">{draftPosition[1].toFixed(6)}</p>
								<p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#6a5d55]">Selected</p>
								<p className="text-sm text-[#1f1a17]">
									{selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
								</p>
							</div>
						</div>

						{locationError ? <p className="mt-2 text-sm text-[#b1442c]">{locationError}</p> : null}
					</div>
					<div className="map-picker-wrapper overflow-hidden rounded-2xl border border-[#3a281b1f]">
						<MapContainer
							className="map-canvas"
							center={draftPosition}
							zoom={15}
							scrollWheelZoom>
							<TileLayer
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
							<SubmitMapCentering position={draftPosition} />
							<SubmitMapTargetTracker onTargetChange={setDraftPosition} />
							{!isLoadingReports &&
								reports.map((report) => (
									<Marker
										key={`existing-${report.id}`}
										position={[report.latitude, report.longitude]}
										opacity={0.65}>
										<Popup>
											<strong>{report.title}</strong>
											<br />
											Status: {STATUS_LABELS[report.status]}
											<br />
											<button
												className="mt-2 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#243b53] to-[#2d5b61] px-3 py-1 text-xs font-bold text-white transition hover:-translate-y-0.5"
												type="button"
												onClick={(event) => {
													event.stopPropagation();
													setDraftPosition([report.latitude, report.longitude]);
													setCoordinates(report.latitude, report.longitude);
												}}>
												Use this location
											</button>
										</Popup>
									</Marker>
								))}
							<Marker
								position={selectedPosition}
								draggable
								eventHandlers={{
									dragend: (event) => {
										const markerPosition = event.target.getLatLng();
										setCoordinates(markerPosition.lat, markerPosition.lng);
										setDraftPosition([markerPosition.lat, markerPosition.lng]);
									},
								}}>
								<Popup>Selected issue location</Popup>
							</Marker>
						</MapContainer>
						<div className="map-picker-crosshair">
							<div className="crosshair-vertical" />
							<div className="crosshair-horizontal" />
							<div className="crosshair-dot" />
						</div>
					</div>
					<div className="mt-3 text-center">
						<button
							className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#243b53] to-[#2d5b61] px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
							type="button"
							onClick={handleConfirmCrosshairLocation}>
							Select this location
						</button>
					</div>
				</section>

				<button
					className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#b1442c] to-[#8f2f2f] px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
					type="submit"
					disabled={isSubmitting}>
					{isSubmitting ? "Submitting..." : "Submit report"}
				</button>
			</form>
		</section>
	);
}

function SubmitMapTargetTracker({ onTargetChange }) {
	useMapEvents({
		moveend: (event) => {
			const center = event.target.getCenter();
			onTargetChange([center.lat, center.lng]);
		},
	});

	return null;
}

function SubmitMapCentering({ position }) {
	const map = useMap();

	useEffect(() => {
		map.setView(position, map.getZoom(), { animate: true });
	}, [map, position]);

	return null;
}

function UpvotePage({ reports, onAddUpvote, isLoadingReports }) {
	const navigate = useNavigate();
	const { id } = useParams();
	const report = reports.find((item) => item.id === id);
	const [userIp, setUserIp] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [upvoteError, setUpvoteError] = useState("");

	if (isLoadingReports) {
		return (
			<section className={cardBase}>
				<p className="text-sm text-[#6a5d55] md:text-base">Loading report details...</p>
			</section>
		);
	}

	if (!report) {
		return (
			<section className={`${cardBase} grid place-items-center gap-2 py-10 text-center`}>
				<h2 className="font-display text-3xl">Report not found</h2>
				<p className="text-sm text-[#6a5d55] md:text-base">The report identifier is missing or the item was removed.</p>
				<button
					className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#3a281b1f] bg-white/70 px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5"
					type="button"
					onClick={() => navigate("/")}>
					Return home
				</button>
			</section>
		);
	}

	const handleUpvote = () => {
		if (!userIp.trim()) {
			setMessage("Enter a user IP to simulate the validation flow.");
			return;
		}

		setIsSubmitting(true);
		setUpvoteError("");
		setMessage("");

		void onAddUpvote(report.id, userIp.trim())
			.then((result) => {
				setMessage(result.isNewUpvote ? `Upvote recorded. Total votes: ${result.totalUpvotes}.` : "This validation was already recorded for that report.");
				setUserIp("");
			})
			.catch((error) => {
				setUpvoteError(error.message || "Unable to record upvote");
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	};

	return (
		<section className="grid gap-4 md:gap-5">
			<section className={cardBase}>
				<p className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">Upvote Verification</p>
				<h2 className="font-display text-3xl leading-tight md:text-4xl">Confirm whether this report is real.</h2>
				<p className="mt-2 text-sm text-[#6a5d55] md:text-base">This flow mirrors backend logic by allowing unique IP submissions before status can move from Pending to Real.</p>
			</section>

			<section className={`${cardBase} grid gap-5 md:grid-cols-[1.4fr_0.8fr]`}>
				<div>
					<StatusBadge status={report.status} />
					<h3 className="mt-3 font-display text-3xl leading-tight">{report.title}</h3>
					<p className="mt-2 text-sm text-[#6a5d55] md:text-base">{report.description}</p>
					<div className="mt-4 flex flex-wrap gap-2.5">
						{report.categories.map((category) => (
							<span
								className="rounded-full border border-[#3a281b24] bg-white/70 px-3 py-2 text-xs font-semibold text-[#1f1a17] md:text-sm"
								key={category}>
								{category}
							</span>
						))}
					</div>
				</div>

				<div className="rounded-3xl border border-[#3a281b1f] bg-white/85 p-4 md:p-5">
					<label className="grid gap-2">
						<span className="text-sm text-[#6a5d55]">Validation IP</span>
						<input
							className={fieldBase}
							value={userIp}
							onChange={(event) => setUserIp(event.target.value)}
							placeholder="203.0.113.42"
						/>
					</label>

					<button
						className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#b1442c] to-[#8f2f2f] px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
						type="button"
						disabled={isSubmitting}
						onClick={handleUpvote}>
						{isSubmitting ? "Recording..." : "Confirm issue"}
					</button>

					<p className="mt-3 text-sm text-[#6a5d55]">{message}</p>
					{upvoteError ? <p className="mt-2 text-sm text-[#b1442c]">{upvoteError}</p> : null}
					<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<Metric
							label="Current votes"
							value={report.upvoteCount}
						/>
						<Metric
							label="Threshold"
							value="5"
						/>
					</div>
				</div>
			</section>
		</section>
	);
}

function MapViewPage({ reports, isLoadingReports }) {
	const [statusFilter, setStatusFilter] = useState("ALL");
	const visibleReports = reports.filter((report) => statusFilter === "ALL" || report.status === statusFilter);
	const hasNoReports = !isLoadingReports && visibleReports.length === 0;

	return (
		<section className="grid gap-4 md:gap-5">
			<section className={`${cardBase} grid gap-4 md:grid-cols-[1fr_auto] md:items-end`}>
				<div>
					<p className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">City Map View</p>
					<h2 className="font-display text-3xl leading-tight md:text-4xl">A clustered map canvas for report density and status filters.</h2>
					<p className="mt-2 text-sm text-[#6a5d55] md:text-base">This map uses Leaflet + react-leaflet-cluster so nearby reports are grouped and easier to inspect on mobile and desktop.</p>
				</div>

				<label className="grid gap-2 md:min-w-56">
					<span className="text-sm text-[#6a5d55]">Filter</span>
					<select
						className={fieldBase}
						value={statusFilter}
						onChange={(event) => setStatusFilter(event.target.value)}>
						<option value="ALL">All statuses</option>
						<option value="PENDING">Pending</option>
						<option value="REAL">Real</option>
						<option value="COMPLETED">Completed</option>
					</select>
				</label>
			</section>

			<section className={`${cardBase} p-3 md:p-4`}>
				{hasNoReports ? <div className="mb-3 rounded-2xl border border-dashed border-[#3a281b29] bg-white/60 p-4 text-sm text-[#6a5d55] md:text-base">No reports available for the selected filter.</div> : null}
				<MapContainer
					className="map-canvas"
					center={CITY_CENTER}
					zoom={13}
					scrollWheelZoom>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>

					<MarkerClusterGroup
						chunkedLoading
						maxClusterRadius={40}>
						{visibleReports.map((report) => (
							<Marker
								key={report.id}
								position={[report.latitude, report.longitude]}>
								<Popup>
									<strong>{report.title}</strong>
									<br />
									Status: {STATUS_LABELS[report.status]}
									<br />
									Categories: {report.categories.join(", ")}
									<br />
									Upvotes: {report.upvoteCount}
								</Popup>
							</Marker>
						))}
					</MarkerClusterGroup>
				</MapContainer>
			</section>
		</section>
	);
}

function AdminPage({ reports, onCompleteReport, onLogin, onLogout, adminToken, adminProfile, isLoadingReports }) {
	const [loginForm, setLoginForm] = useState({ username: "", password: "" });
	const [loginError, setLoginError] = useState("");
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [activeReportId, setActiveReportId] = useState("");
	const [resolutionImageUrl, setResolutionImageUrl] = useState("");
	const [completionMessage, setCompletionMessage] = useState("");
	const [completionError, setCompletionError] = useState("");

	const sortedReports = useMemo(() => {
		return [...reports].sort((left, right) => {
			const statusDifference = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
			if (statusDifference !== 0) {
				return statusDifference;
			}

			return right.upvoteCount - left.upvoteCount;
		});
	}, [reports]);

	const activeReport = sortedReports.find((report) => report.id === activeReportId);

	const handleLogin = async (event) => {
		event.preventDefault();
		setIsLoggingIn(true);
		setLoginError("");

		try {
			await onLogin(loginForm);
			setLoginForm({ username: "", password: "" });
		} catch (error) {
			setLoginError(error.message || "Unable to sign in");
		} finally {
			setIsLoggingIn(false);
		}
	};

	const handleComplete = async () => {
		if (!activeReportId || !resolutionImageUrl.trim()) {
			setCompletionError("Select a report and provide a resolution image URL.");
			return;
		}

		setCompletionError("");
		setCompletionMessage("");

		try {
			await onCompleteReport(activeReportId, resolutionImageUrl.trim());
			setResolutionImageUrl("");
			setCompletionMessage("Report marked completed with proof.");
		} catch (error) {
			setCompletionError(error.message || "Unable to complete report");
		}
	};

	if (isLoadingReports && !adminToken) {
		return (
			<section className={cardBase}>
				<p className="text-sm text-[#6a5d55] md:text-base">Loading admin dashboard...</p>
			</section>
		);
	}

	if (!adminToken) {
		return (
			<section className={`${cardBase} grid gap-4 md:grid-cols-[1fr_0.8fr]`}>
				<div>
					<p className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">Admin Dashboard</p>
					<h2 className="font-display text-3xl leading-tight md:text-4xl">Sign in with the single admin credential.</h2>
					<p className="mt-2 text-sm text-[#6a5d55] md:text-base">The backend returns a bearer token after validating the username and password stored in .env.</p>
				</div>

				<form
					className="rounded-3xl border border-[#3a281b1f] bg-white/85 p-4 md:p-5"
					onSubmit={handleLogin}>
					<label className="grid gap-2">
						<span className="text-sm text-[#6a5d55]">Username</span>
						<input
							className={fieldBase}
							value={loginForm.username}
							onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
							placeholder="admin"
						/>
					</label>

					<label className="mt-3 grid gap-2">
						<span className="text-sm text-[#6a5d55]">Password</span>
						<input
							className={fieldBase}
							type="password"
							value={loginForm.password}
							onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
							placeholder="••••••••"
						/>
					</label>

					<button
						className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#b1442c] to-[#8f2f2f] px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
						type="submit"
						disabled={isLoggingIn}>
						{isLoggingIn ? "Signing in..." : "Sign in"}
					</button>

					{loginError ? <p className="mt-3 text-sm text-[#b1442c]">{loginError}</p> : null}
				</form>
			</section>
		);
	}

	return (
		<section className="grid gap-4 md:gap-5">
			<section className={cardBase}>
				<p className="text-[11px] uppercase tracking-[0.16em] text-[#6a5d55]">Admin Dashboard</p>
				<h2 className="font-display text-3xl leading-tight md:text-4xl">Prioritize real issues and close them with proof.</h2>
				<p className="mt-2 text-sm text-[#6a5d55] md:text-base">Completion requires a resolution image URL so the original user upload remains untouched.</p>
				<div className="mt-4 flex flex-wrap items-center gap-3">
					<span className="rounded-full bg-[#1f7a4f24] px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-[#1f7a4f]">Signed in as {adminProfile?.username || "admin"}</span>
					<button
						className="rounded-full border border-[#3a281b1f] bg-white/70 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
						type="button"
						onClick={onLogout}>
						Logout
					</button>
				</div>
			</section>

			<section className={`${cardBase} grid gap-4 md:grid-cols-[1fr_0.8fr]`}>
				<div className="grid gap-3">
					<h3 className="font-display text-2xl">Priority queue</h3>
					{sortedReports.map((report) => (
						<button
							className={
								activeReportId === report.id
									? "flex items-center justify-between gap-3 rounded-2xl border border-[#b1442c52] bg-[#b1442c14] p-4 text-left transition hover:-translate-y-0.5"
									: "flex items-center justify-between gap-3 rounded-2xl border border-[#3a281b1f] bg-white/70 p-4 text-left transition hover:-translate-y-0.5"
							}
							key={report.id}
							type="button"
							onClick={() => setActiveReportId(report.id)}>
							<div>
								<strong className="font-display text-xl leading-tight">{report.title}</strong>
								<p className="mt-1 text-sm text-[#6a5d55]">
									{report.status} · {report.upvoteCount} upvotes
								</p>
							</div>
							<StatusBadge status={report.status} />
						</button>
					))}
				</div>

				<div className="rounded-3xl border border-[#3a281b1f] bg-white/85 p-4 md:p-5">
					<label className="grid gap-2">
						<span className="text-sm text-[#6a5d55]">Report ID</span>
						<select
							className={fieldBase}
							value={activeReportId}
							onChange={(event) => setActiveReportId(event.target.value)}>
							<option value="">Select a report</option>
							{sortedReports.map((report) => (
								<option
									key={report.id}
									value={report.id}>
									{report.title}
								</option>
							))}
						</select>
					</label>

					{activeReport ? (
						<div className="mt-3 rounded-2xl border border-[#3a281b1f] bg-[#fff8f0] p-4 text-sm text-[#6a5d55]">
							<p className="font-semibold text-[#1f1a17]">{activeReport.title}</p>
							<p className="mt-1">Current status: {STATUS_LABELS[activeReport.status]}</p>
							<p>Upvotes: {activeReport.upvoteCount}</p>
						</div>
					) : null}

					<label className="mt-3 grid gap-2">
						<span className="text-sm text-[#6a5d55]">Resolution image URL</span>
						<input
							className={fieldBase}
							value={resolutionImageUrl}
							onChange={(event) => setResolutionImageUrl(event.target.value)}
							placeholder="https://.../after-fix.jpg"
						/>
					</label>

					<button
						className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#b1442c] to-[#8f2f2f] px-5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5"
						type="button"
						onClick={handleComplete}>
						Mark completed
					</button>
					<p className="mt-3 text-sm text-[#6a5d55]">This action mirrors the API rule: completion requires an image proof URL.</p>
					{completionMessage ? <p className="mt-2 text-sm text-[#1f7a4f]">{completionMessage}</p> : null}
					{completionError ? <p className="mt-2 text-sm text-[#b1442c]">{completionError}</p> : null}
				</div>
			</section>
		</section>
	);
}

function StatusBadge({ status }) {
	const statusClass = status === "PENDING" ? "bg-[#8d620024] text-[#8d6200]" : status === "REAL" ? "bg-[#1f7a4f24] text-[#1f7a4f]" : "bg-[#243b5324] text-[#243b53]";

	return <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] ${statusClass}`}>{STATUS_LABELS[status]}</span>;
}

export default App;
