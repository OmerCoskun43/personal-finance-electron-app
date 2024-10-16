const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const sqlite3 = require("sqlite3").verbose();

// require("electron-reload")(__dirname);

// SQLite veritabanını oluşturma
const db = new sqlite3.Database("./personal-finance.db", (err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    // Tabloları oluşturma
    db.run(
      "CREATE TABLE IF NOT EXISTS incomes (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL, description TEXT, date TEXT)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL, description TEXT, date TEXT)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS budget (id INTEGER PRIMARY KEY, amount REAL)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY AUTOINCREMENT, amount REAL, description TEXT, date TEXT)"
    );

    console.log("Database connected successfully");
  }
});
let mainWindow;
const createWindow = () => {
  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 800,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
      sandbox: true,
      devTools: false,
    },
  });

  mainWindow.loadFile("./renderer/index.html");
  // mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// **Gelir işlemleri (Income)**

// SQLite'e gelir kaydetme
ipcMain.on("add-income", (event, incomeData) => {
  const { amount, description, date } = incomeData;

  db.run(
    "INSERT INTO incomes (amount, description, date) VALUES (?, ?, ?)",
    [amount, description, date],
    function (err) {
      if (err) {
        console.error("SQLite gelir ekleme hatası:", err);
      } else {
        event.sender.send("income-added", "Gelir başarıyla eklendi!");
      }
    }
  );
});

// SQLite'ten tüm gelirleri alma
ipcMain.on("get-incomes", (event) => {
  db.all("SELECT * FROM incomes", [], (err, rows) => {
    if (err) {
      console.error("SQLite gelirleri alma hatası:", err);
      return;
    }

    if (rows.length === 0) {
      console.warn("Veritabanında gelir yok!");
    }

    event.sender.send("income-list", rows);
  });
});

// **Gelir silme**
ipcMain.on("delete-income", (event, incomeId) => {
  db.run("DELETE FROM incomes WHERE id = ?", [incomeId], function (err) {
    if (err) {
      console.error("SQLite gelir silme hatası:", err);
    } else {
      event.sender.send("income-deleted", "Gelir başarıyla silindi!");
    }
  });
});

// **Gider işlemleri (Expense)**

// SQLite'e gider kaydetme
ipcMain.on("add-expense", (event, expenseData) => {
  const { amount, description, date } = expenseData;

  db.run(
    "INSERT INTO expenses (amount, description, date) VALUES (?, ?, ?)",
    [amount, description, date],
    function (err) {
      if (err) {
        console.error("SQLite gider ekleme hatası:", err);
      } else {
        event.sender.send("expense-added", "Gider başarıyla eklendi!");
      }
    }
  );
});

// SQLite'ten tüm giderleri alma
ipcMain.on("get-expenses", (event) => {
  db.all("SELECT * FROM expenses", [], (err, rows) => {
    if (err) {
      console.error("SQLite giderleri alma hatası:", err);
    } else {
      event.sender.send("expense-list", rows);
    }
  });
});

// **Gider silme**
ipcMain.on("delete-expense", (event, expenseId) => {
  db.run("DELETE FROM expenses WHERE id = ?", [expenseId], function (err) {
    if (err) {
      console.error("SQLite gider silme hatası:", err);
    } else {
      event.sender.send("expense-deleted", "Gider başarıyla silindi!");
    }
  });
});

// Aylık gider ve gelirleri alma (bu örnekte tüm gider ve gelirleri dönüyoruz, daha sonra aylık olarak filtreleme ekleyebilirsiniz)
ipcMain.on("monthly-expense", (event) => {
  db.all("SELECT * FROM expenses", [], (err, rows) => {
    if (err) {
      console.error("SQLite giderleri alma hatası:", err);
    } else {
      event.sender.send("expense-list-monthly", rows);
    }
  });
});

ipcMain.on("monthly-income", (event) => {
  db.all("SELECT * FROM incomes", [], (err, rows) => {
    if (err) {
      console.error("SQLite gelirleri alma hatası:", err);
    } else {
      event.sender.send("income-list-monthly", rows);
    }
  });
});

// 'remaining' adında bir ileti alındığında çalışacak
ipcMain.on("remaining", async (event) => {
  const data = {
    expenses: [],
    incomes: [],
  };

  try {
    // Giderleri al
    data.expenses = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM expenses", [], (err, rows) => {
        if (err) {
          console.error("SQLite giderleri alma hatası:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Gelirleri al
    data.incomes = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM incomes", [], (err, rows) => {
        if (err) {
          console.error("SQLite gelirleri alma hatası:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Her iki veri alındıktan sonra gönder
    event.sender.send("remaining-value", data);
  } catch (error) {
    console.error("Veri alma hatası:", error);
  }
});

// **Bütçe işlemleri (Budget)**

// SQLite'e bütçe ayarlama
ipcMain.on("set-budget", (event, budgetAmount) => {
  db.run(
    "INSERT OR REPLACE INTO budget (id, amount) VALUES (1, ?)",
    [budgetAmount],
    function (err) {
      if (err) {
        console.error("SQLite bütçe ayarlama hatası:", err);
      } else {
        event.sender.send("budget-set", "Bütçe başarıyla ayarlandı!");
      }
    }
  );
});

// SQLite'ten bütçe bilgisi alma
ipcMain.on("get-budget", (event) => {
  db.get("SELECT amount FROM budget WHERE id = 1", [], (err, row) => {
    if (err) {
      console.error("SQLite bütçe alma hatası:", err);
    } else {
      event.sender.send("budget-value", row ? row.amount : "0");
    }
  });
});

// **Hedef işlemleri (Goal)**

// SQLite'e hedef kaydetme
ipcMain.on("add-goal", (event, goalData) => {
  const { description, amount, date } = goalData;

  db.run(
    "INSERT INTO goals (description, amount, date) VALUES (?, ?, ?)",
    [description, amount, date],
    function (err) {
      if (err) {
        console.error("SQLite hedef ekleme hatası:", err);
      } else {
        event.sender.send("goal-added", "Hedef başarıyla eklendi!");
      }
    }
  );
});

// SQLite'ten tüm hedefleri alma
ipcMain.on("get-goals", (event) => {
  db.all("SELECT * FROM goals", [], (err, rows) => {
    if (err) {
      console.error("SQLite hedefleri alma hatası:", err);
    } else {
      event.sender.send("goal-list", rows);
    }
  });
});

// **Hedef silme**
ipcMain.on("delete-goal", (event, goalId) => {
  db.run("DELETE FROM goals WHERE id = ?", [goalId], function (err) {
    if (err) {
      console.error("SQLite hedef silme hatası:", err);
    } else {
      event.sender.send("goal-deleted", "Hedef başarıyla silindi!");
    }
  });
});

ipcMain.on("minimize", () => {
  mainWindow.minimize();
});

ipcMain.on("maximize", () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on("close", () => {
  mainWindow.close();
});

// Uygulama kapandığında veritabanını kapat
app.on("will-quit", () => {
  db.close((err) => {
    if (err) {
      console.error("Veritabanını kapatma hatası:", err);
    }
  });
});
