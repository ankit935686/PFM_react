const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

app.use(
	cors({
		origin: env.frontendUrl,
	})
);
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/profile', profileRoutes);

app.use((req, res) => {
	res.status(404).json({
		message: `Route not found: ${req.method} ${req.originalUrl}`,
	});
});

const startServer = async () => {
	await connectDB(env.mongoUri);

	app.listen(env.port, () => {
		console.log(`Backend running on http://localhost:${env.port}`);
	});
};

startServer();
