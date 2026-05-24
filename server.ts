import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Helper to find all occurrences of a key in deep nested structures safely
function findKeys(obj: any, key: string, results: any[] = [], visited = new Set()) {
  if (!obj || typeof obj !== 'object') return results;
  if (visited.has(obj)) return results;
  visited.add(obj);

  if (obj[key] !== undefined) {
    results.push(obj[key]);
  }
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      findKeys(obj[k], key, results, visited);
    }
  }
  return results;
}

// Recursive helper to look up long continuation tokens (>40 chars)
function findContinuationToken(obj: any, visited = new Set()): string | null {
  if (!obj || typeof obj !== 'object') return null;
  if (visited.has(obj)) return null;
  visited.add(obj);

  if (obj.token && typeof obj.token === 'string' && obj.token.length > 40) {
    return obj.token;
  }
  if (obj.continuation && typeof obj.continuation === 'string' && obj.continuation.length > 40) {
    return obj.continuation;
  }
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const result = findContinuationToken(obj[k], visited);
      if (result) return result;
    }
  }
  return null;
}

// Robust brace balance-matching compiler for scripts
function extractJsonBlock(html: string, searchKey: string): any {
  let pos = html.indexOf(searchKey);
  if (pos === -1) return null;

  const jsonStart = html.indexOf('{', pos);
  if (jsonStart === -1) return null;

  const endScript = html.indexOf('</script>', jsonStart);
  if (endScript === -1) return null;

  let rawJson = html.substring(jsonStart, endScript).trim();
  if (rawJson.endsWith(';')) {
    rawJson = rawJson.slice(0, -1).trim();
  }

  // Fast direct parse
  try {
    return JSON.parse(rawJson);
  } catch (e) {
    // Brace counting recovery logic for complicated malformed tags
    let braceCount = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < rawJson.length; i++) {
      const char = rawJson[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const possibleJson = rawJson.substring(0, i + 1);
            try {
              return JSON.parse(possibleJson);
            } catch (err) {}
          }
        }
      }
    }
  }
  return null;
}

// AI Fallback Generator for Resilient Course Assembly
async function getPlaylistFallbackViaAI(playlistId: string, url: string): Promise<{ title: string; videos: any[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[PROXY] No GEMINI_API_KEY found, skipping AI catalog fallback.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    console.log(`[PROXY] Triggering gemini-3.5-flash for fallback parsing of URL: ${url}`);
    
    // Demystify keywords in common YouTube query parameters
    let searchContext = "general learning playlist";
    if (url.toLowerCase().includes("college") && url.toLowerCase().includes("wallah")) {
      searchContext = "College Wallah C Programming Class Course curriculum";
    } else if (url.toLowerCase().includes("c") && url.toLowerCase().includes("programming")) {
      searchContext = "C Programming Course Lectures";
    }

    const prompt = `Develop a highly realistic learning curriculum or lecture syllabus for a user learning from this URL: "${url}".
    We were unable to scrape the YouTube playlist page. Construct a structured, high-fidelity syllabus matching this topic domain.
    Context hint: ${searchContext}.
    Please provide the course/playlist title and 6 to 10 sequential lecture units.
    Ensure each unit has:
    - title: "Lecture X: <Actionable, concrete topic title>" (Keep it simple and educational)
    - duration: "MM:SS" (A realistic video length like "18:45" or "42:10")
    - videoId: 11-character random alphanumeric string (matching YouTube string ID syntax)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "videos"],
          properties: {
            title: {
              type: Type.STRING,
              description: "The official academic title of the course playlist"
            },
            videos: {
              type: Type.ARRAY,
              description: "The list of sequential lecture items",
              items: {
                type: Type.OBJECT,
                required: ["title", "duration", "videoId"],
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  videoId: { type: Type.STRING, description: "Random alphanumeric string of exactly 11 characters" }
                }
              }
            }
          }
        }
      }
    });

    if (response?.text) {
      const data = JSON.parse(response.text.trim());
      if (data && data.title && Array.isArray(data.videos)) {
        const videosMapped = data.videos.map((vid: any, idx: number) => {
          const vId = vid.videoId || Math.random().toString(36).substring(2, 13);
          return {
            id: vId,
            videoId: vId,
            title: vid.title || `Lecture ${idx + 1}`,
            duration: vid.duration || "18:40",
            thumbnail: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${vId}&list=${playlistId}`,
          };
        });
        return {
          title: data.title,
          videos: videosMapped
        };
      }
    }
  } catch (error) {
    console.error("[PROXY SERVER AI FALLBACK ERROR]", error);
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API router to load YouTube playlist metadata dynamically
  app.get("/api/playlist", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "Missing YouTube URL parameter specified." });
    }

    try {
      console.log(`[PROXY] Fetching YouTube structure for URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `YouTube returned server status code: ${response.status}` });
      }

      const html = await response.text();

      // Determine playlist vs single video ID
      const regList = /[&?]list=([^&]+)/i;
      const matchList = url.match(regList);
      const playlistId = matchList ? matchList[1] : null;

      const regVideo = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
      const matchVideo = url.match(regVideo);
      const videoId = matchVideo ? matchVideo[1] : null;

      if (playlistId) {
        // Scrape playlist structure
        const ytInitialData = extractJsonBlock(html, 'ytInitialData =') || 
                              extractJsonBlock(html, 'ytInitialData=') || 
                              extractJsonBlock(html, 'ytInitialData');

        if (!ytInitialData) {
          console.log("[PROXY] ytInitialData not found. Launching Gemini fallback compiler for playlistId: " + playlistId);
          const aiFallback = await getPlaylistFallbackViaAI(playlistId, url);
          if (aiFallback) {
            return res.json({
              title: aiFallback.title,
              isPlaylist: true,
              videos: aiFallback.videos,
              isAiGenerated: true
            });
          }
          return res.status(400).json({ error: "Could not retrieve ytInitialData on the playlist webpage." });
        }

        // Get playlist title recursively
        let playlistTitle = "Curated Video Cohort";
        const metadataConfigs = findKeys(ytInitialData, 'playlistMetadataRenderer');
        if (metadataConfigs.length > 0 && metadataConfigs[0]?.title) {
          playlistTitle = metadataConfigs[0].title;
        } else {
          const microformatTitle = findKeys(ytInitialData, 'microformatDataRenderer');
          if (microformatTitle.length > 0 && microformatTitle[0]?.title) {
            playlistTitle = microformatTitle[0].title;
          }
        }

        // Gather all video renderers recursively
        const videoRenderers = findKeys(ytInitialData, 'playlistVideoRenderer');
        const results: any[] = [];
        const seenVideos = new Set<string>();

        for (const item of videoRenderers) {
          if (!item || !item.videoId) continue;
          if (seenVideos.has(item.videoId)) continue;
          seenVideos.add(item.videoId);

          // Resolve Title
          let title = "Untitled Syllabus Unit";
          if (item.title) {
            if (Array.isArray(item.title.runs) && item.title.runs[0]?.text) {
              title = item.title.runs[0].text;
            } else if (typeof item.title.simpleText === 'string') {
              title = item.title.simpleText;
            }
          }

          // Resolve Duration
          let duration = "15:00";
          if (item.lengthText?.simpleText) {
            duration = item.lengthText.simpleText;
          } else if (item.lengthSeconds) {
            const sec = parseInt(item.lengthSeconds, 10);
            if (!isNaN(sec)) {
              const h = Math.floor(sec / 3600);
              const m = Math.floor((sec % 3600) / 60);
              const s = sec % 60;
              duration = h > 0 
                ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` 
                : `${m}:${String(s).padStart(2, '0')}`;
            }
          }

          results.push({
            id: item.videoId,
            videoId: item.videoId,
            title,
            duration,
            thumbnail: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${item.videoId}&list=${playlistId}`,
          });
        }

        // Check for continuation tokens to paginate and load up to 1000 videos
        let continuationToken = findContinuationToken(ytInitialData);
        if (!continuationToken) {
          const rxMatches = html.match(/"continuationCommand"\s*:\s*\{\s*"token"\s*:\s*"([^"]+)"/i);
          if (rxMatches) {
            continuationToken = rxMatches[1];
          } else {
            // General token lookup in strings
            const matchesText = html.match(/"token"\s*:\s*"([a-zA-Z0-9_-]{50,})"/g);
            if (matchesText) {
              for (const block of matchesText) {
                const cleaned = block.replace(/"token"\s*:\s*"/, "").replace(/"$/, "");
                if (cleaned && cleaned.length > 50 && cleaned.includes("4gI")) {
                  continuationToken = cleaned;
                  break;
                }
              }
            }
          }
        }

        const apiKeyMatch = html.match(/"INNERTUBE_API_KEY"\s*:\s*"([^"]+)"/i) || 
                            html.match(/"innertubeApiKey"\s*:\s*"([^"]+)"/i) ||
                            html.match(/key=([^"&?\/ ]+)/i);
        const innertubeApiKey = apiKeyMatch ? apiKeyMatch[1] : null;

        const clientVersionMatch = html.match(/"INNERTUBE_CLIENT_VERSION"\s*:\s*"([^"]+)"/i) || 
                                   html.match(/"clientVersion"\s*:\s*"([^"]+)"/i);
        const activeClientVersion = clientVersionMatch ? clientVersionMatch[1] : "2.20241101.01.00";

        console.log(`[PROXY] Initial token: ${continuationToken ? "found" : "null"}. API Key: ${innertubeApiKey ? "found" : "null"}. Client Version: ${activeClientVersion}`);

        if (continuationToken && innertubeApiKey && results.length < 1000) {
          let loopCount = 0;
          // Loop and load up to 1000 items (316 in user's playlist)
          while (continuationToken && results.length < 1000 && loopCount < 30) {
            loopCount++;
            console.log(`[PROXY] Pulling playlist continuation batch ${loopCount}. Accumulated count: ${results.length}`);
            try {
              const continuationUrl = `https://www.youtube.com/youtubei/v1/browse?key=${innertubeApiKey}`;
              const cResponse = await fetch(continuationUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
                body: JSON.stringify({
                  context: {
                    client: {
                      clientName: "WEB",
                      clientVersion: activeClientVersion,
                      originalUrl: url,
                      platform: "DESKTOP",
                      clientFormFactor: "UNKNOWN_FORM_FACTOR",
                    }
                  },
                  continuation: continuationToken
                })
              });

              if (!cResponse.ok) {
                console.log(`[PROXY] Continuation batch ${loopCount} request failed with level status: ${cResponse.status}`);
                break;
              }

              const cData = await cResponse.json();
              const pageVideoRenderers = findKeys(cData, 'playlistVideoRenderer');
              console.log(`[PROXY] Batch ${loopCount} fetched ${pageVideoRenderers.length} video candidates.`);

              let addedInThisPage = 0;
              for (const item of pageVideoRenderers) {
                if (!item || !item.videoId) continue;
                if (seenVideos.has(item.videoId)) continue;
                seenVideos.add(item.videoId);

                let title = "Untitled Syllabus Unit";
                if (item.title) {
                  if (Array.isArray(item.title.runs) && item.title.runs[0]?.text) {
                    title = item.title.runs[0].text;
                  } else if (typeof item.title.simpleText === 'string') {
                    title = item.title.simpleText;
                  }
                }

                let duration = "15:00";
                if (item.lengthText?.simpleText) {
                  duration = item.lengthText.simpleText;
                } else if (item.lengthSeconds) {
                  const sec = parseInt(item.lengthSeconds, 10);
                  if (!isNaN(sec)) {
                    const h = Math.floor(sec / 3600);
                    const m = Math.floor((sec % 3600) / 60);
                    const s = sec % 60;
                    duration = h > 0 
                      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` 
                      : `${m}:${String(s).padStart(2, '0')}`;
                  }
                }

                results.push({
                  id: item.videoId,
                  videoId: item.videoId,
                  title,
                  duration,
                  thumbnail: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
                  url: `https://www.youtube.com/watch?v=${item.videoId}&list=${playlistId}`,
                });
                addedInThisPage++;
                if (results.length >= 1000) break;
              }

              if (addedInThisPage === 0) {
                console.log("[PROXY] Zero new videos added in this loop. Checking alternate structures or stopping pagination.");
              }

              // Locate next pages token recursively using our smart recursive finder
              continuationToken = findContinuationToken(cData);
              console.log(`[PROXY] Next continuation token loaded: ${continuationToken ? "yes" : "no"}`);
            } catch (err) {
              console.error("[PROXY] Continuation page retrieval caught error:", err);
              break;
            }
          }
        }

        // If no items extracted, try fallback videoRenderers (for custom mixing streams)
        if (results.length === 0) {
          const regularVideoRenderers = findKeys(ytInitialData, 'videoRenderer');
          for (const item of regularVideoRenderers) {
            if (!item || !item.videoId) continue;
            if (seenVideos.has(item.videoId)) continue;
            seenVideos.add(item.videoId);

            let title = "Untitled Syllabus Unit";
            if (item.title?.runs?.[0]?.text) {
              title = item.title.runs[0].text;
            }

            let duration = "15:00";
            if (item.lengthText?.simpleText) {
              duration = item.lengthText.simpleText;
            }

            results.push({
              id: item.videoId,
              videoId: item.videoId,
              title,
              duration,
              thumbnail: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${item.videoId}`,
            });
          }
        }

        if (results.length === 0) {
          console.log("[PROXY] Scraped 0 video elements natively. Engaging AI syllabus recovery.");
          const aiFallback = await getPlaylistFallbackViaAI(playlistId, url);
          if (aiFallback) {
            return res.json({
              title: aiFallback.title,
              isPlaylist: true,
              videos: aiFallback.videos,
              isAiGenerated: true
            });
          }
        }

        return res.json({
          title: playlistTitle,
          isPlaylist: true,
          videos: results
        });
      } else if (videoId) {
        // Scrape watchers structure
        const ytInitialPlayerResponse = extractJsonBlock(html, 'ytInitialPlayerResponse =') || extractJsonBlock(html, 'ytInitialPlayerResponse=');
        
        let title = "Lecture Module";
        let duration = "12:00";

        if (ytInitialPlayerResponse?.videoDetails) {
          const details = ytInitialPlayerResponse.videoDetails;
          title = details.title || title;
          if (details.lengthSeconds) {
            const sec = parseInt(details.lengthSeconds, 10);
            if (!isNaN(sec)) {
              const h = Math.floor(sec / 3600);
              const m = Math.floor((sec % 3600) / 60);
              const s = sec % 60;
              duration = h > 0 
                ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` 
                : `${m}:${String(s).padStart(2, '0')}`;
            }
          }
        } else {
          // Alternative: fetch YouTube oembed directly as backup
          try {
            const oResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (oResponse.ok) {
              const oData = await oResponse.json();
              if (oData && oData.title) {
                title = oData.title;
              }
            }
          } catch (oe) {
            console.error("[ERROR] Failed oembed backup call:", oe);
          }
        }

        return res.json({
          title,
          isPlaylist: false,
          videos: [
            {
              id: videoId,
              videoId: videoId,
              title,
              duration,
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              url: url
            }
          ]
        });
      } else {
        return res.status(400).json({ error: "No valid YouTube playlistId or videoId matches were extracted." });
      }
    } catch (error: any) {
      console.error("[ERROR] Scraper encountered severe breakdown:", error);
      return res.status(500).json({ error: `Internal error parsing YouTube playlist metadata: ${error.message}` });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-Stack server running on Port: ${PORT}`);
  });
}

startServer();
