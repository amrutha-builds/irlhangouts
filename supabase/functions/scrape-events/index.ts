const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCRAPE_URLS = [
  "https://www.eventbrite.com/d/ca--san-jose/events--this-weekend/?distance=50mi",
  "https://www.eventbrite.com/d/ca--san-jose/events--next-week/?distance=50mi",
];

const SEARCH_QUERIES = [
  "site:sulekha.com San Francisco Bay Area events this weekend 2026",
  "site:sulekha.com San Francisco Bay Area events next weekend 2026",
];

const CATEGORIES = [
  "Creative",
  "Food & Drinks",
  "Wellness",
  "Entertainment",
  "Outdoors",
  "Nightlife",
  "Arts & Culture",
  "Social",
];

const EMOJI_MAP: Record<string, string> = {
  Creative: "🎨",
  "Food & Drinks": "🥂",
  Wellness: "🧘‍♀️",
  Entertainment: "😂",
  Outdoors: "🌸",
  Nightlife: "🍸",
  "Arts & Culture": "🎭",
  Social: "💃",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase config missing");
    }

    // Step 1: Scrape & search event sources
    console.log("Scraping event sources...");
    const scrapeResults: string[] = [];

    // Scrape Eventbrite listing pages
    for (const url of SCRAPE_URLS) {
      try {
        console.log(`Scraping: ${url}`);
        const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            formats: ["markdown"],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          if (markdown) {
            scrapeResults.push(
              `--- Source: ${url} ---\n${markdown.slice(0, 8000)}`
            );
            console.log(`Got ${markdown.length} chars from ${url}`);
          }
        } else {
          console.error(`Failed to scrape ${url}: ${scrapeResp.status}`);
        }
      } catch (e) {
        console.error(`Error scraping ${url}:`, e);
      }
    }

    // Search for Sulekha events (their site is JS-heavy, search works better)
    for (const query of SEARCH_QUERIES) {
      try {
        console.log(`Searching: ${query}`);
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            limit: 10,
            scrapeOptions: {
              formats: ["markdown"],
              onlyMainContent: true,
            },
          }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const results = searchData?.data || [];
          for (const result of results) {
            const md = result?.markdown || "";
            const resultUrl = result?.url || "";
            if (md && md.length > 100) {
              scrapeResults.push(
                `--- Source: ${resultUrl} (Sulekha) ---\n${md.slice(0, 5000)}`
              );
            }
          }
          console.log(`Search "${query}" yielded ${results.length} results`);
        } else {
          console.error(`Failed to search: ${searchResp.status}`);
        }
      } catch (e) {
        console.error(`Error searching:`, e);
      }
    }

    if (scrapeResults.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No sources could be scraped" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Use AI to extract structured events
    console.log("Extracting events with AI...");
    const today = new Date();
    const twoWeeksOut = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const systemPrompt = `You are an event extraction assistant. Extract upcoming IN-PERSON events from the scraped web content below.

STRICT FILTERS — only include events that meet ALL of these criteria:
1. Located within 50 miles of San Jose, CA (includes San Jose, San Francisco, Oakland, Berkeley, Palo Alto, Mountain View, Santa Cruz, Fremont, etc.)
2. In-person / physical events only — exclude virtual, online, or livestream events
3. Happening on a Friday, Saturday, or Sunday within the next two weeks (${today.toLocaleDateString()} to ${twoWeeksOut.toLocaleDateString()})
4. Would be fun for a group of friends hanging out IRL

Include events across all categories: nightlife & dining, arts & culture, wellness & outdoors, entertainment, social gatherings.

For each event, extract:
- title: The event name
- date: The date/time as a readable string (e.g. "Sat, Apr 5 · 8 PM")
- location: The venue or location name
- category: One of: ${CATEGORIES.join(", ")}
- source_url: The direct URL to the event page or ticket purchase page from the source website
- description: A 1-2 sentence summary of the event — what it is, what to expect, and why it's fun

Extract up to 40 of the best events. Prioritize variety across categories. Exclude any event that doesn't clearly state an in-person location.`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Here is the scraped content from event websites:\n\n${scrapeResults.join("\n\n")}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "save_events",
                description: "Save extracted events to the database",
                parameters: {
                  type: "object",
                  properties: {
                    events: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          date: { type: "string" },
                          location: { type: "string" },
                          category: {
                            type: "string",
                            enum: CATEGORIES,
                          },
                          source_url: { type: "string", description: "Direct URL to the event page or ticket purchase page" },
                          description: { type: "string", description: "1-2 sentence summary of the event" },
                        },
                        required: ["title", "date", "location", "category"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["events"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "save_events" },
          },
        }),
      }
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limited, try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("AI did not return structured events");
    }

    const { events: extractedEvents } = JSON.parse(toolCall.function.arguments);
    console.log(`Extracted ${extractedEvents.length} events`);

    // Step 3: Insert events into database (clear old scraped events first, keep user-created ones)
    // Delete events without a created_by (scraped events)
    await fetch(`${SUPABASE_URL}/rest/v1/events?created_by=is.null`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // Insert new events
    const eventsToInsert = extractedEvents.map(
      (e: { title: string; date: string; location: string; category: string; source_url?: string; description?: string }) => ({
        title: e.title,
        date: e.date,
        location: e.location,
        category: e.category,
        emoji: EMOJI_MAP[e.category] || "🎉",
        source_url: e.source_url || null,
        description: e.description || null,
        created_by: null, // scraped, not user-created
      })
    );

    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(eventsToInsert),
    });

    if (!insertResp.ok) {
      const err = await insertResp.text();
      console.error("Insert error:", err);
      throw new Error(`Failed to insert events: ${err}`);
    }

    console.log(`Successfully inserted ${eventsToInsert.length} events`);

    return new Response(
      JSON.stringify({
        success: true,
        eventsFound: eventsToInsert.length,
        sources: scrapeResults.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scrape-events error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
