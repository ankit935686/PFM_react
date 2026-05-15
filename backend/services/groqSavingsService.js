const buildSavingsInsights = async ({ summary, breakdown, goals, history, monthlyTrend }) => {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }

  const prompt = {
    month: summary?.monthLabel,
    summary: {
      currentMonthSavings: summary?.currentMonthSavings || 0,
      savingsRatePercentage: summary?.savingsRatePercentage || 0,
      totalActiveGoals: summary?.totalActiveGoals || 0,
      monthOverMonthGrowth: summary?.monthOverMonthGrowth,
      totalLifetimeSavings: summary?.totalLifetimeSavings || 0,
    },
    breakdown: {
      income: breakdown?.income || 0,
      expenses: breakdown?.expenses || 0,
      netSavings: breakdown?.netSavings || 0,
      highestSpendingCategory: breakdown?.highestSpendingCategory?.name || null,
      highestSpendingAmount: breakdown?.highestSpendingCategory?.amount || 0,
      reductionTarget: breakdown?.categoryReductionTarget || 0,
      previousMonthSavings: breakdown?.previousMonth?.savings || 0,
    },
    goals: (goals || []).map((goal) => ({
      goalName: goal.goalName,
      targetAmount: goal.targetAmount,
      currentSavedAmount: goal.currentSavedAmount,
      remainingAmount: goal.remainingAmount,
      progressPercent: goal.progressPercent,
      monthlyRequired: goal.monthlyRequired,
      estimatedCompletionMonths: goal.estimatedCompletionMonths,
      targetDate: goal.targetDate,
      category: goal.category,
      isOnTrack: goal.isOnTrack,
    })),
    history: (history || []).slice(-6).map((item) => ({
      monthKey: item.monthKey,
      monthlySavings: item.monthlySavings,
      totalIncome: item.totalIncome,
      totalExpenses: item.totalExpenses,
    })),
    monthlyTrend: (monthlyTrend || []).slice(-12).map((item) => ({
      monthKey: item.monthKey,
      savings: item.savings,
      income: item.income,
      expenses: item.expenses,
    })),
    instructions: {
      tone: 'professional fintech advisor',
      responseFormat: {
        summary: '1-2 sentence overview',
        recommendations: ['array of 3-5 concise recommendations'],
        predictions: ['array of 1-3 goal completion or trend predictions'],
        categoriesToReduce: ['array of category + reason strings'],
      },
    },
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        temperature: 0.35,
        max_tokens: 350,
        messages: [
          {
            role: 'system',
            content:
              'You are a concise personal finance analyst. Return valid JSON only, no markdown, no code fences.',
          },
          {
            role: 'user',
            content: JSON.stringify(prompt),
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return null;
    }

    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
        categoriesToReduce: Array.isArray(parsed.categoriesToReduce) ? parsed.categoriesToReduce : [],
      };
    } catch (_parseError) {
      return {
        summary: content,
        recommendations: [],
        predictions: [],
        categoriesToReduce: [],
      };
    }
  } catch (_error) {
    return null;
  }
};

module.exports = {
  buildSavingsInsights,
};
