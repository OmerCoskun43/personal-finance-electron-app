// renderer.js

// Aylık Gelir, Gider ve Bütçe Güncellemesi
const incomeElement = document.getElementById("monthly-income");
const expenseElement = document.getElementById("monthly-expense");
const budgetElement = document.getElementById("remaining-budget");
const cards = document.querySelectorAll(".card");

const differentDate = document.getElementById("differentDates");

const yearInput = document.getElementById("yearInput");

if (yearInput) {
  yearInput.innerHTML = new Date().getFullYear();
}

let incomeData;
let expenseData;
let expenseChart; // Grafik nesnesini tanımlayın

// Tarih formatlama fonksiyonu
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Ayı 2 basamaklı yap
  const day = String(date.getDate()).padStart(2, "0"); // Günü 2 basamaklı yap
  return `${day}-${month}-${year}`;
}

let startDate = null;
let endDate = null;

// Filtreleme İşlevi
const filterForm = document.getElementById("filter-form");
const clearButton = document.getElementById("clear-button");
const submitButton = document.getElementById("filter-btn");
// Tarih filtreleme işlevini ayarlayın
if (filterForm) {
  filterForm.addEventListener("submit", handleFilterSubmit);
}

// Filtreleme işlemi gerçekleştiğinde çalışacak fonksiyon
function handleFilterSubmit(event) {
  event.preventDefault(); // Formun varsayılan gönderimini engelle

  setFilterDates();
  updateDateDisplay();
  adjustCardPadding("10px 20px");
  loadData();
  toggleFilterButtons();
}

// Tarihleri ayarlayın
function setFilterDates() {
  startDate = document.getElementById("month-selector-1").value;
  endDate = document.getElementById("month-selector-2").value;
}

// Tarih aralığını görüntüle
function updateDateDisplay() {
  differentDate.style.display = "block";
  differentDate.innerHTML = `<span>Date range = </span> <em>${formatDate(
    startDate
  )} : ${formatDate(endDate)} </em>`;
}

// Kartların padding ayarını değiştir
function adjustCardPadding(padding) {
  cards.forEach((card) => {
    card.style.padding = padding;
  });
}

// Filtre butonlarını duruma göre göster/gizle
function toggleFilterButtons() {
  submitButton.style.display = "none";
  clearButton.style.display = "inline-block";
  const goalsList = document.getElementById("goals-list");
  goalsList.innerHTML = "";

  clearButton.addEventListener("click", handleClearFilters);
}

// Filtreleri temizle
function handleClearFilters() {
  const goalsList = document.getElementById("goals-list");
  goalsList.innerHTML = "";
  resetFilterDates();
  differentDate.style.display = "none";
  loadData();
  toggleFilterButtonsVisibility();
}

// Tarihleri sıfırla
function resetFilterDates() {
  startDate = null;
  endDate = null;
}

// Filtre butonlarının görünümünü ayarla
function toggleFilterButtonsVisibility() {
  submitButton.style.display = "inline-block";
  clearButton.style.display = "none";
}

// Gelir verileri alındığında
window.API.onMonthlyIncome((data) => {
  if (incomeElement) {
    if (startDate && endDate) {
      data = data.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });
    }

    const total = data.reduce((acc, item) => acc + item.amount, 0);
    incomeData = total;
    incomeElement.textContent = `$${total.toFixed(2)}`;
  }
});

// Kalan bütçeyi güncelleme fonksiyonu
const updateBudgetDisplay = (data) => {
  if (budgetElement) {
    // Tarih aralığına göre gelir ve giderleri filtrele
    let filteredIncomes = data.incomes;
    let filteredExpenses = data.expenses;

    if (startDate && endDate) {
      filteredIncomes = data.incomes.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });

      filteredExpenses = data.expenses.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });
    }

    const income = filteredIncomes.reduce((acc, item) => acc + item.amount, 0);
    const expense = filteredExpenses.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    const budget = income - expense;
    budgetElement.textContent = `$${budget.toFixed(2)}`;
  }
};

// Kalan bütçeyi güncellemek için API'den veri al
window.API.onRemaining((data) => {
  updateBudgetDisplay(data); // Verileri güncelle
});

// Harcama verileri alındığında
window.API.onMonthlyExpense((data) => {
  if (expenseElement) {
    const expenseTotals = {};
    if (startDate && endDate) {
      data = data.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
      });
    }

    data.forEach((item) => {
      if (!expenseTotals[item.description]) {
        expenseTotals[item.description] = 0;
      }
      expenseTotals[item.description] += item.amount;
    });

    const expenseLabels = Object.keys(expenseTotals);
    const expenseData = Object.values(expenseTotals);

    const total = expenseData.reduce((acc, amount) => acc + amount, 0);
    expenseElement.textContent = `$${total.toFixed(2)}`;

    if (expenseChart) {
      expenseChart.data.labels = expenseLabels;
      expenseChart.data.datasets[0].data = expenseData;
      expenseChart.update();
    }
  }
});

// Harcama Kategorileri Grafiği (Chart.js)
const ctx = document.getElementById("expenseChart")?.getContext("2d");
if (ctx) {
  expenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Rent", "Groceries", "Transport", "Entertainment", "Other"],
      datasets: [
        {
          data: [1500, 500, 300, 100, 100], // Başlangıç verileri
          backgroundColor: [
            "#4CAF50",
            "#FF9800",
            "#2196F3",
            "#F44336",
            "#9C27B0",
          ],
          hoverOffset: 12,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 50,
            boxHeight: 15,
            font: {
              size: 18,
            },
          },
        },
      },
    },
  });
}

// DOM öğeleri henüz mevcut değilse, bu kısımlar null dönebilir
const loadData = () => {
  console.log("Veri yükleniyor...");
  window.API.getIncomes(); // Gelirleri al
  window.API.getExpenses(); // Giderleri al
  window.API.getBudget(); // Bütçeyi al
  window.API.getGoals(); // Hedefleri al
  window.API.monthlyExpense();
  window.API.monthlyIncome();
  window.API.monthlyRemaining();
};

// Gelir Ekleme
const incomeForm = document.getElementById("income-form");
if (incomeForm) {
  incomeForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Formun varsayılan gönderimini engelle

    const incomeSource = document.getElementById("income-source").value;
    const incomeAmount = document.getElementById("income-amount").value;
    const incomeDate = document.getElementById("income-date").value; // Tarih alanı

    // Gelir verisini gönder
    window.API.addIncome({
      description: incomeSource,
      amount: parseFloat(incomeAmount),
      date: incomeDate, // Formdan alınan tarihi formatlı şekilde
    });
    loadData();
    // Formu sıfırla
    incomeForm.reset();
  });
}

// Gider Ekleme
const expenseForm = document.getElementById("expense-form");
if (expenseForm) {
  expenseForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Formun varsayılan gönderimini engelle

    const expenseCategory = document.getElementById("expense-category").value;
    const expenseAmount = document.getElementById("expense-amount").value;
    const expenseDate = document.getElementById("expense-date").value; // Tarih alanı

    // Gider verisini gönder
    window.API.addExpense({
      description: expenseCategory,
      amount: parseFloat(expenseAmount),
      date: expenseDate, // Formdan alınan tarihi formatlı şekilde
    });

    loadData();

    // Formu sıfırla
    expenseForm.reset();
  });
}

// Bütçeyi Ayarlama
const budgetForm = document.getElementById("budget-form");
if (budgetForm) {
  budgetForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Formun varsayılan gönderimini engelle

    const budgetAmount = document.getElementById("budget-amount").value;

    // Bütçe verisini gönder
    window.API.setBudget(parseFloat(budgetAmount));

    loadData();

    // Formu sıfırla
    budgetForm.reset();
  });
}

// Hedef Ekleme
const goalForm = document.getElementById("goal-form");
if (goalForm) {
  goalForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Formun varsayılan gönderimini engelle

    const goalDescription = document.getElementById("goal-description").value;
    const goalAmount = document.getElementById("goal-amount").value;
    const goalDate = document.getElementById("goal-date").value; // Tarih alanı

    // Hedef verisini gönder
    window.API.addGoal({
      description: goalDescription,
      amount: parseFloat(goalAmount),
      date: goalDate, // Formdan alınan tarihi formatlı şekilde
    });
    const goalsList = document.getElementById("goals-list");

    if (goalsList) {
      goalsList.innerHTML = ""; // Listeyi temizle
    }

    loadData();

    // Formu sıfırla
    goalForm.reset();
  });
}

// Gelir verileri alındığında
window.API.onIncomeList((incomes) => {
  const incomeList = document.getElementById("income-list");
  if (incomeList) {
    incomeList.innerHTML = ""; // Listeyi temizle
    const total = incomes.reduce((acc, item) => acc + item.amount, 0);
    incomes.forEach((income) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `
        <span>${income.description}</span>
        <em>$${income.amount.toFixed(2)}</em>
        <em>(${formatDate(income.date)})</em>
        <strong><button class="delete-income" data-id="${
          income.id
        }">Delete</button></strong>
      `; // Tarihi formatla
      incomeList.prepend(listItem); // Listenin başına ekle
    });
    const listİtem = document.createElement("li");
    listİtem.classList.add("total");
    listİtem.innerHTML = `
      <span>Total:</span>
      <strong>$${total.toFixed(2)}</strong>
    `;
    incomeList.appendChild(listİtem);

    function deleteIncome(incomeId) {
      window.API.deleteIncome(incomeId)
        .then(() => {
          console.log("Income deleted successfully.");
          loadData(); // Verileri yeniden yükle
        })
        .catch((error) => {
          console.error("Error deleting income:", error);
        });
    }

    // Delete butonları için olay dinleyicisini ekle
    const deleteButtons = document.querySelectorAll(".delete-income");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const incomeId = button.getAttribute("data-id"); // Gelirin ID'sini al
        // Geliri sil
        if (confirm("Are you sure you want to delete this income?")) {
          deleteIncome(incomeId);
        }
      });
    });
  }
});

// Gider verileri alındığında
window.API.onExpenseList((expenses) => {
  const expenseList = document.getElementById("expense-list");
  if (expenseList) {
    expenseList.innerHTML = ""; // Listeyi temizle
    const total = expenses.reduce((acc, item) => acc + item.amount, 0);
    expenses.forEach((expense) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `
        <span>${expense.description}</span>
        <em>$${expense.amount.toFixed(2)}</em>
        <em>(${formatDate(expense.date)})</em>
        <strong><button class="delete-expense" data-id="${
          expense.id
        }">Delete</button></strong>
      `; // Tarihi formatla
      expenseList.prepend(listItem); // Listenin başına ekle
    });
    const listİtem = document.createElement("li");
    listİtem.classList.add("total");
    listİtem.innerHTML = `
      <span>Total:</span>
      <strong>$${total.toFixed(2)}</strong>
    `;
    expenseList.appendChild(listİtem);
    function deleteExpense(expenseId) {
      window.API.deleteExpense(expenseId)
        .then(() => {
          console.log("Expense deleted successfully.");
          loadData(); // Verileri yeniden yükle
        })
        .catch((error) => {
          console.error("Error deleting expense:", error);
        });
    }

    const deleteButtons = document.querySelectorAll(".delete-expense");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const expenseId = button.getAttribute("data-id"); // Gelirin ID'sini al
        // Geliri sil
        if (confirm("Are you sure you want to delete this expense?")) {
          deleteExpense(expenseId);
        }
      });
    });
  }

  // Gider silme fonksiyonu
});

// Bütçe verisi alındığında
window.API.onBudgetValue((budgetAmount) => {
  const currentBudget = document.getElementById("current-budget");
  if (currentBudget) {
    currentBudget.textContent = `$${budgetAmount}`;
  }
});

// Hedef verileri alındığında
window.API.onGoalList((goals) => {
  const goalsList = document.getElementById("goals-list");
  const total = goals.reduce((acc, item) => acc + item.amount, 0);
  if (goalsList) {
    // goalsList.innerHTML = ""; // Listeyi temizle

    goals.forEach((goal) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `
        <span>${goal.description}</span>
        <em>$${goal.amount.toFixed(2)}</em>
        <em>(${formatDate(goal.date)})</em>
        <strong><button class="delete-goal" data-id="${
          goal.id
        }">Delete</button></strong>
        
      `; // Tarihi formatla
      goalsList.prepend(listItem); // Listenin başına ekle
    });
    const listİtem = document.createElement("li");
    listİtem.classList.add("total");
    listİtem.id = "goal-total";
    listİtem.innerHTML = `
      <span>Total:</span>
      <strong>$${total.toFixed(2)}</strong>
    `;
    goalsList.appendChild(listİtem);
  }

  // Gider silme fonksiyonu
  function deleteGoal(goalId) {
    window.API.deleteGoal(goalId)
      .then(() => {
        console.log("Goal deleted successfully.");
        loadData(); // Verileri yeniden yükle
      })
      .catch((error) => {
        console.error("Error deleting goal:", error);
      });
  }
  const deleteButtons = document.querySelectorAll(".delete-goal");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const goalId = button.getAttribute("data-id"); // Gelirin ID'sini al
      // Geliri sil
      if (confirm("Are you sure you want to delete this goal?")) {
        deleteGoal(goalId);
      }
    });
  });
});

//! Controls
const minimize = document.getElementById("minimize");
const maximize = document.getElementById("maximize");
const close = document.getElementById("close");

minimize.addEventListener("click", () => {
  window.API.minimize();
});

maximize.addEventListener("click", () => {
  window.API.maximize();
});

close.addEventListener("click", () => {
  window.API.close();
});

// Sayfa yüklendiğinde verileri yükle
window.onload = () => {
  loadData();
};
