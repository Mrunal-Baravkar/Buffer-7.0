# DeadLink Recovery System

A smart web-based system that detects broken (dead) links and recovers them using a **HashMap-based backend** and **BFS traversal**.
Built with a **Google-like UI** and integrated with a **Java backend server**.

---

## Problem Statement

While browsing the web, users frequently encounter broken or outdated links (404 errors), which leads to poor user experience and loss of important information.
This project aims to **detect such dead links in real-time and intelligently recover them**, instead of leaving users stuck on error pages.

---
## Data Structures Used

### HashMap

* Stores link status (**ACTIVE / DEAD**)
* Maps dead links to recovery links
* Provides **O(1)** lookup time

### Graph

* Represents relationships between links

### BFS Traversal

* Used to find the **nearest valid working link**

---

## How It Works

1. User clicks a link on the UI

2. JavaScript intercepts the request

3. Backend `/check` API verifies link status using HashMap:

   * If link is marked as **DEAD → show custom 404 page**
   * If link is **ACTIVE → redirect normally**

4. HashMap contains:

   * Active links
   * Dead links mapped to their recovery links

5. On clicking **Recover Page**:

   * `/recover` API uses **BFS traversal on graph**
   * Finds nearest valid (active) link
   * Redirects user to recovered page

---

## Features

* Detects dead links dynamically
* Displays custom **404 Not Found page** (instead of browser default)
* Recovers links using **HashMap (O(1) lookup)**
* Stores both **active and dead links** in the system
* Uses **real-world URLs**
* Implements **DSA concepts (Graph + BFS traversal)**
* Displays traversal and recovery logs in terminal
* Clean **Google-style UI** (no prior indication of dead links)

---


## Project Structure

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

## Technologies Used

* Frontend: HTML, CSS, JavaScript
* Backend: Java (HttpServer)
* Concepts: Graph, BFS, HashMap

---

## How to Run

### 1. Start Backend Server

```bash
javac server.java
java server
```

---

### 2. Run Frontend

* Open `index.html` using **Live Server (VS Code)**
  OR
* Open directly in your browser

---

## Example Flow

* Click a dead link
  → Custom **404 Not Found** page appears

* Click **Recover Page**
  → Redirects to a working link (e.g., Wikipedia)

---

## Video Demo

https://drive.google.com/file/d/1gGcFg41YDL7ocyDjtM4wuXTaVF3zDthU/view?usp=drivesdk

---

## Future Improvements

* Visual graph traversal representation
* Multiple recovery suggestions
* Link health analytics dashboard
* AI-based link prediction

---

## Team Members

* Gauri Kondawar
* Mrunal Baravkar
---

## Author

Built as a **DSA + Web Integration Project** combining real-world web problems with efficient data structures.
