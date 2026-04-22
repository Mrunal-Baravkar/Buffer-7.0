import com.sun.net.httpserver.*;
import java.io.*;
import java.net.*;
import java.util.*;

/**
 *  Dead Link Recovery Server — server.java
 *  Runs on http://localhost:8000
 *
 *  Endpoints:
 *   GET /check?url=<URL>   - "OK" / "404"
 *   GET /recover?url=<URL> - <recovery_url> / "NONE"
 *   GET /bfs               - Triggers BFS traversal in terminal
 *
 *  DSA: HashMap for dead-link storage + BFS graph traversal
 */

public class server {

    //  DEAD LINK → RECOVERY URL  (HashMap - PRIMARY detection)
    static final Map<String, String> DEAD_LINK_MAP = new HashMap<>();

    //  WEBSITE GRAPH  (Adjacency List for BFS)
    //  key   = a website node (bare domain/path)
    //  value = list of outgoing links from that page
  
    static final Map<String, List<String>> GRAPH = new LinkedHashMap<>();


    //  STATIC INITIALIZER

    static {

        // Dead Link HashMap  (dead URL → recovery URL)
        // These are the ONLY source of truth for dead detection.
        // HTTP status codes are NOT used — HashMap is primary.
        DEAD_LINK_MAP.put(
            "https://india.gov.in/topics/education",
            "https://www.education.gov.in"
        );
        DEAD_LINK_MAP.put(
            "https://india.gov.in/topics/health",
            "https://www.mohfw.gov.in"
        );
        DEAD_LINK_MAP.put(
            "https://mospi.gov.in/sdgs-broken",
            "https://mospi.gov.in"
        );
        DEAD_LINK_MAP.put(
            "https://csc.gov.in/old-portal",
            "https://csc.gov.in"
        );

        // Graph: Adjacency List 
        GRAPH.put("india.gov.in", Arrays.asList(
            "india.gov.in/topics/agriculture",
            "india.gov.in/topics/education",      // DEAD
            "india.gov.in/topics/health",          // DEAD
            "india.gov.in/topics/infrastructure"
        ));
        GRAPH.put("mha.gov.in", Arrays.asList(
            "egazette.gov.in",
            "data.gov.in",
            "eci.gov.in",
            "mospi.gov.in/sdgs-broken"             // DEAD
        ));
        GRAPH.put("nic.in", Arrays.asList(
            "digilocker.gov.in",
            "web.umang.gov.in",
            "esanjeevani.mohfw.gov.in"
        ));
        GRAPH.put("digitalindia.gov.in", Arrays.asList(
            "meity.gov.in",
            "csc.gov.in/old-portal"                // DEAD
        ));
        GRAPH.put("mygov.in", Arrays.asList(
            "india.gov.in",
            "digitalindia.gov.in"
        ));
    }

    //  MAIN
    public static void main(String[] args) throws Exception {

        HttpServer httpServer = HttpServer.create(new InetSocketAddress(8000), 0);

        // /check 
        // Checks whether a URL is dead using the HashMap.
        // Returns "404" if found in DEAD_LINK_MAP, else "OK".
        httpServer.createContext("/check", exchange -> {
            addCORSHeaders(exchange);

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String url = extractUrlParam(exchange.getRequestURI().getQuery());

            System.out.println("\n");
            System.out.println("  CHECK request received");
            System.out.println("    Checking URL: " + url);
            System.out.println("    Method: HashMap.containsKey() lookup");

            if (DEAD_LINK_MAP.containsKey(url)) {
                System.out.println("    Dead link detected (HashMap) ✗");
                System.out.println("    Status: 404 - sending dead response to browser");
                String hint = DEAD_LINK_MAP.get(url);
                System.out.println("    Recovery hint: " + hint + "  (use /recover to fetch)");
                send(exchange, "404");
            } else {
                System.out.println("    Active link ");
                System.out.println("    Status: OK - browser will navigate normally");
                send(exchange, "OK");
            }
        });

        // /recover
        // Returns the recovery URL for a dead link.
        // Only called AFTER the user clicks "Recover Page".
        httpServer.createContext("/recover", exchange -> {
            addCORSHeaders(exchange);

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String url = extractUrlParam(exchange.getRequestURI().getQuery());

            System.out.println("\n");
            System.out.println("  RECOVER request received");
            System.out.println("    Recovery requested for: " + url);
            System.out.println("    Searching HashMap (DEAD_LINK_MAP) for recovery URL…");

            String recoveryUrl = DEAD_LINK_MAP.get(url);

            if (recoveryUrl != null) {
                System.out.println("     Recovery found in HashMap!");
                System.out.println("    Recovered URL: " + recoveryUrl);
                System.out.println("    Action: browser will redirect to recovered URL");
                send(exchange, recoveryUrl);
            } else {
                System.out.println("     No recovery entry found in HashMap");
                System.out.println("    Action: browser will show 'no recovery' message");
                send(exchange, "NONE");
            }
        });

        //  /bfs 
        // Triggers a full BFS traversal of the website graph.
        // Prints every step to the terminal, including dead link
        // detection via the HashMap and recovery lookups.
        httpServer.createContext("/bfs", exchange -> {
            addCORSHeaders(exchange);

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            System.out.println("\n\n");
            System.out.println("     BFS CRAWL + DEAD LINK RECOVERY - START      ");

            bfsTraversal("india.gov.in");

            send(exchange, "BFS complete - check terminal output");
        });

        //Start server
        httpServer.setExecutor(null);
        httpServer.start();

        System.out.println("Dead Link Recovery Server - RUNNING");
        System.out.println("http://localhost:8000 ");
        System.out.println("\nEndpoints: ");
        System.out.println("GET /check?url=<URL>  -->  dead detection (HashMap)");
        System.out.println("GET /recover?url=<URL> --> fetch recovery URL");
        System.out.println("GET /bfs               --> run BFS in terminal ");
        System.out.println("\nGraph nodes   : " + GRAPH.size() + " ");
        System.out.println("Dead links    : " + DEAD_LINK_MAP.size() + " (stored in HashMap)");
        System.out.println("Recovery map  : " + DEAD_LINK_MAP.size() + " entries (same HashMap)");
    }

    //  BFS TRAVERSAL

    /**
     * Performs Breadth-First Search over the website adjacency list.
     *
     * Data structures:
     *   Queue<String>               — BFS frontier (FIFO, LinkedList)
     *   Set<String>                 — visited nodes (HashSet, O(1) lookup)
     *   Map<String,List<String>>    — graph adjacency list
     *   Map<String,String>          — dead link HashMap for O(1) detection
     *
     * For every link encountered:
     *   1. HashMap lookup to check if dead (O(1))
     *   2. If dead → look up recovery URL in same HashMap
     *   3. If alive → enqueue for further traversal
     */
    static void bfsTraversal(String startNode) {
        Queue<String> queue   = new LinkedList<>();
        Set<String>   visited = new HashSet<>();

        queue.offer(startNode);
        visited.add(startNode);

        int deadCount      = 0;
        int recoveredCount = 0;

        System.out.println("\n BFS crawl started from: " + startNode);

        int level = 0;

        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            System.out.println("Level " + level + " - " + levelSize + " node(s) in queue");

            for (int i = 0; i < levelSize; i++) {
                String node = queue.poll();
                System.out.println("\n  Now crawling: " + node);

                List<String> neighbors = GRAPH.getOrDefault(node, Collections.emptyList());

                if (neighbors.isEmpty()) {
                    System.out.println("     Leaf node - no outgoing links in graph");
                    continue;
                }

                System.out.println("     Found " + neighbors.size() + " link(s), checking each…");

                for (String neighbor : neighbors) {
                    System.out.println("\n     Link: " + neighbor);

                    String fullUrl = "https://" + neighbor;

                    if (DEAD_LINK_MAP.containsKey(fullUrl)) {
                        // ── Dead link detected via HashMap ──
                        deadCount++;
                        System.out.println("     Dead link detected (HashMap)");
                        System.out.println("      Action: searching recovery map…");

                        String recovery = DEAD_LINK_MAP.get(fullUrl);
                        if (recovery != null) {
                            recoveredCount++;
                            System.out.println("Recovery found in HashMap!");
                            System.out.println("Recovered URL: " + recovery);
                            System.out.println("Crawl continues via recovered URL");
                        } else {
                            System.out.println("No recovery entry - link skipped");
                        }
                    } else {
                        // ── Active link ──
                        System.out.println("Active link ");
                    }

                    // Enqueue unvisited graph nodes
                    if (!visited.contains(neighbor) && GRAPH.containsKey(neighbor)) {
                        visited.add(neighbor);
                        queue.offer(neighbor);
                        System.out.println("     Enqueued: " + neighbor);
                    }
                }
            }

            System.out.println();
            level++;
        }
        System.out.println("  BFS Crawl Complete");
        System.out.println("    Nodes traversed  : " + visited.size());
        System.out.println("    Dead links found : " + deadCount);
        System.out.println("    Links recovered  : " + recoveredCount);
        System.out.println("    Unrecovered      : " + (deadCount - recoveredCount));
    }

    //  UTILITY METHODS

    /** Extract the `url` query parameter from a raw query string. */
    static String extractUrlParam(String query) {
        if (query == null || query.isEmpty()) return "";
        try {
            // Handle url=<value> — value may itself contain '=' (e.g. encoded URLs)
            int idx = query.indexOf("url=");
            if (idx < 0) return "";
            String encoded = query.substring(idx + 4);
            return URLDecoder.decode(encoded, "UTF-8");
        } catch (Exception e) {
            return "";
        }
    }

    /** Add CORS headers so the browser JS on any origin can reach localhost:8000. */
    static void addCORSHeaders(HttpExchange ex) {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin",  "*");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    /** Send a plain-text UTF-8 response with HTTP 200. */
    static void send(HttpExchange ex, String response) throws IOException {
        byte[] bytes = response.getBytes("UTF-8");
        ex.getResponseHeaders().add("Content-Type", "text/plain; charset=UTF-8");
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }
}