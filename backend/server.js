const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const profileRoutes = require('./routes/profileRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const savingsRoutes = require('./routes/savingsRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const groupRoutes = require('./routes/groupRoutes');

const app = express();

app.use(
	cors({
		origin: env.frontendUrl,
	})
);
app.use(express.json({ limit: '10mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/groups', groupRoutes);

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
