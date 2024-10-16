const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("API", {
  // Gelir ekleme
  addIncome: (incomeData) => ipcRenderer.send("add-income", incomeData),

  // Gelirleri alma
  getIncomes: () => ipcRenderer.send("get-incomes"),

  // Gelir silme
  deleteIncome: (incomeId) => ipcRenderer.send("delete-income", incomeId),

  // Gider ekleme
  addExpense: (expenseData) => ipcRenderer.send("add-expense", expenseData),

  // Gider silme
  deleteExpense: (expenseId) => ipcRenderer.send("delete-expense", expenseId),

  // Giderleri alma
  getExpenses: () => ipcRenderer.send("get-expenses"),

  // Bütçe ayarlama
  setBudget: (budgetAmount) => ipcRenderer.send("set-budget", budgetAmount),

  // Bütçeyi alma
  getBudget: () => ipcRenderer.send("get-budget"),

  // Hedef ekleme
  addGoal: (goalData) => ipcRenderer.send("add-goal", goalData),

  // Hedef silme
  deleteGoal: (goalId) => ipcRenderer.send("delete-goal", goalId),

  // Hedefleri alma
  getGoals: () => ipcRenderer.send("get-goals"),

  //! Controls
  minimize: () => ipcRenderer.send("minimize"),
  maximize: () => ipcRenderer.send("maximize"),
  close: () => ipcRenderer.send("close"),

  monthlyExpense: () => ipcRenderer.send("monthly-expense"),
  monthlyIncome: () => ipcRenderer.send("monthly-income"),
  monthlyRemaining: () => ipcRenderer.send("remaining"),

  // IPC olaylarını dinleme
  onIncomeList: (callback) =>
    ipcRenderer.on("income-list", (event, incomes) => callback(incomes)),
  onExpenseList: (callback) =>
    ipcRenderer.on("expense-list", (event, expenses) => callback(expenses)),
  onBudgetValue: (callback) =>
    ipcRenderer.on("budget-value", (event, budgetAmount) =>
      callback(budgetAmount)
    ),
  onGoalList: (callback) =>
    ipcRenderer.on("goal-list", (event, goals) => callback(goals)),
  onMonthlyExpense: (callback) =>
    ipcRenderer.on("expense-list-monthly", (event, monthlyExpense) =>
      callback(monthlyExpense)
    ),
  onMonthlyIncome: (callback) =>
    ipcRenderer.on("income-list-monthly", (event, monthlyIncome) =>
      callback(monthlyIncome)
    ),
  onRemaining: (callback) =>
    ipcRenderer.on("remaining-value", (event, remainingValue) =>
      callback(remainingValue)
    ),
});
