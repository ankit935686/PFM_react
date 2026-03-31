export const sidebarItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'reports', label: 'Reports' },
  { key: 'budgets', label: 'Budgets' },
  { key: 'goals', label: 'Goals' },
  { key: 'settings', label: 'Settings' },
];

export const statCards = [
  {
    key: 'balance',
    title: 'Total Balance',
    value: 12842.6,
    trend: '+7.2%',
    trendDirection: 'up',
  },
  {
    key: 'income',
    title: 'Income',
    value: 5231.29,
    trend: '+2.5%',
    trendDirection: 'up',
  },
  {
    key: 'expenses',
    title: 'Expenses',
    value: 3842.0,
    trend: '-1.8%',
    trendDirection: 'down',
  },
  {
    key: 'savings',
    title: 'Savings',
    value: 1684.0,
    trend: '+12.0%',
    trendDirection: 'up',
  },
];

export const monthlySpending = [
  { month: 'Jan', amount: 720 },
  { month: 'Feb', amount: 860 },
  { month: 'Mar', amount: 910 },
  { month: 'Apr', amount: 790 },
  { month: 'May', amount: 980 },
  { month: 'Jun', amount: 1100 },
  { month: 'Jul', amount: 990 },
  { month: 'Aug', amount: 1180 },
  { month: 'Sep', amount: 1220 },
  { month: 'Oct', amount: 1060 },
  { month: 'Nov', amount: 960 },
  { month: 'Dec', amount: 1140 },
];

export const categoryDistribution = [
  { name: 'Needs', value: 42, color: '#3B82F6' },
  { name: 'Savings', value: 26, color: '#22C55E' },
  { name: 'Investments', value: 18, color: '#F59E0B' },
  { name: 'Lifestyle', value: 14, color: '#A855F7' },
];

export const transactions = [
  {
    id: 'TRX-1001',
    date: '2026-03-28',
    title: 'Salary Credit',
    category: 'Income',
    status: 'Completed',
    amount: 3200,
  },
  {
    id: 'TRX-1002',
    date: '2026-03-27',
    title: 'Rent Payment',
    category: 'Housing',
    status: 'Completed',
    amount: -900,
  },
  {
    id: 'TRX-1003',
    date: '2026-03-25',
    title: 'Mutual Fund SIP',
    category: 'Investments',
    status: 'Processing',
    amount: -250,
  },
  {
    id: 'TRX-1004',
    date: '2026-03-24',
    title: 'Freelance Payment',
    category: 'Income',
    status: 'Completed',
    amount: 420,
  },
  {
    id: 'TRX-1005',
    date: '2026-03-22',
    title: 'Electricity Bill',
    category: 'Utilities',
    status: 'Completed',
    amount: -120,
  },
  {
    id: 'TRX-1006',
    date: '2026-03-20',
    title: 'Card Payment',
    category: 'Credit',
    status: 'Pending',
    amount: -300,
  },
  {
    id: 'TRX-1007',
    date: '2026-03-18',
    title: 'Dining Out',
    category: 'Lifestyle',
    status: 'Completed',
    amount: -95,
  },
  {
    id: 'TRX-1008',
    date: '2026-03-16',
    title: 'Travel Booking',
    category: 'Travel',
    status: 'Failed',
    amount: -220,
  },
];
