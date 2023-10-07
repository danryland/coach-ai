// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { Configuration } from "https://esm.sh/openai@3.2.1";
import axios from "https://esm.sh/axios@1.5.1";

const configuration = new Configuration({
  apiKey: Deno.env.get("OPEN_API_KEY"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const requestBody = await req.json();

    const userID = requestBody.id;
    const userContent = requestBody.content;

    const openaiUrl = "https://api.openai.com/v1/embeddings";
    const headers = {
      Authorization: "Bearer " + Deno.env.get("OPEN_API_KEY"),
      "Content-Type": "application/json",
    };
    const data = {
      input: userContent,
      model: "text-embedding-ada-002",
    };

    const response = await axios.post(openaiUrl, data, { headers: headers });

    const {
      data: {
        embeddings,
      },
    } = response;

    return new Response(JSON.stringify(embeddings), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error in function:", error);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'