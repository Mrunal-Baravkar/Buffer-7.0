# 🔗 Dead Link Recovery System (DSA-Based)

A smart web-based system that detects broken (dead) links and recovers them using a **HashMap-based backend** and **BFS traversal (Graph)**.
Built with a **Google-like UI** and integrated with a **Java backend server**.

---

## 🚀 Features

* 🔍 Detects dead links dynamically
* ❌ Shows custom **404 Not Found page** (not browser default)
* 🔁 Recovers links using **HashMap (O(1)) lookup**
* 🌐 Uses **real-world URLs**
* 🧠 Implements **DSA concepts (Graph + BFS traversal)**
* 📊 Displays traversal + recovery logs in terminal
* 🎨 Clean Google-style UI (no visual hints of dead links)

---

## 🧠 How It Works

1. User clicks a link on the UI
2. JavaScript intercepts the click
3. Backend `/check` API verifies:

   * If link exists in **HashMap → DEAD**
   * Else → ACTIVE
4. If DEAD:

   * Show custom **404 UI + Recover button**
5. On clicking **Recover**:

   * Backend `/recover` API returns original working link
   * User is redirected

---

## 🗂️ Project Structure

```
DeadLinkRecovery/
│
├── index.html      # Frontend UI (Google-style layout)
├── style.css       # Styling (dark theme)
├── script.js       # Frontend logic + API calls
├── server.java     # Backend (HashMap + BFS traversal)
└── README.md       # Project documentation
```

---

## ⚙️ Technologies Used

* Frontend: HTML, CSS, JavaScript
* Backend: Java (HttpServer)
* Concepts: Graph, BFS, HashMap

---

## ▶️ How to Run

### 1. Start Backend Server

```bash
javac server.java
java server
```

---

### 2. Run Frontend

* Open `index.html` using **Live Server (VS Code)**
* OR open in browser

---

## 🧪 Example Flow

* Click a dead link →
  ➜ Shows **404 Not Found**
* Click "Recover Page" →
  ➜ Redirects to working site (e.g., Wikipedia)

---

## 📌 Notes

* Dead links are controlled using a **HashMap**
* HTTP status alone is not reliable (many sites return 200 for invalid pages)
* UI does NOT show which links are dead beforehand

---

## 🎯 Future Improvements

* Visual graph traversal
* Multiple recovery suggestions
* Link health analytics dashboard

---

## 👨‍💻 Author

* Built as a **DSA + Web Integration Project**
