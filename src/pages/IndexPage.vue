<template>
  <q-page class="q-pa-lg">

    <!-- https://legtwxykhbhhhwgwrywg.supabase.co/rest/v1/rpc/match_snippets -->

  <div class="row q-gutter-md items-center">
    <div class="col col-auto">
      <q-img class="hammer" src="../assets/hammer.svg" alt="Hammer" />
    </div>
    <div class="col col-grow">
      <q-input standout round label="Ask Hammer" v-model="content" />
    </div>
    <div class="col col-shrink">
      <q-btn label="Ask" no-caps size="lg" unelevated class="q-px-lg" color="primary" @click="getEmbed(content)" />
    </div>
    
  </div>
    <br>
    <p><strong>Question as vector embed:</strong></p>
    <div class="overflow">
    {{ embed }}
    </div>
    <br>
    <p><strong>Matching snippets:</strong></p>
    <div class="overflow">
    {{ snippets }}
    </div>
    <br>
    
    <p><strong>Hammer's answer:</strong></p>
    <div class="overflow auto-height">
    {{ answer }}
    </div>
    
    <table v-if="chunks && chunks.length > 0">
      <tr>
        <th>Action</th>
        <th>ID</th>
        <th>Has Embed</th>
        <th>Content</th>
      </tr>
      <tr v-for="chunk in chunks" :key="chunk.id">
        <td>
          <q-btn @click="updateChunk(chunk.id, chunk.content)" label="Embed" />
        </td>
        <td>{{ chunk.id }}</td>
        <td style="text-align: center">
          <span v-if="chunk.embedding">
            <q-icon name="check" size="lg" />
          </span>
          <span v-else>
            <q-icon name="block" size="lg" />
          </span>
        </td>
        <td>
          <div class="content">{{ chunk.content }}</div>
        </td>
      </tr>
    </table>
  </q-page>
</template>

<script>
import { defineComponent, ref } from "vue";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import OpenAI from "openai";

export default defineComponent({
  name: "IndexPage",
  setup() {
    let chunks = ref([]);
    let embed = ref(null);
    let content = ref('What business should I start?');
    let snippets = ref(null);
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    let answer = ref(null);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    const getChunks = async () => {
        const { data, error } = await supabase
            .from("chunks")
            .select()
            .is("embedding", null);
        if (!error) {
            chunks.value = data;
            // data.forEach(chunk => {
            //     updateChunk(chunk.id, chunk.content);
            // });
        }
    };


    const getEmbed = async (content) => {
      const openaiUrl = "https://api.openai.com/v1/embeddings";
      const headers = {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json",
      };
      const data = {
        input: content,
        model: "text-embedding-ada-002",
      };

      try {
        const response = await axios.post(openaiUrl, data, {headers: headers});

        embed.value = response.data.data[0].embedding;

        const matchSnippetsUrl = "https://legtwxykhbhhhwgwrywg.supabase.co/rest/v1/rpc/match_snippets";
        const matchSnippetsData = {
            query_embedding: embed.value,
            match_threshold: 0.78,
            match_count: 20,
        };
        
        try {
            const matchSnippetsResponse = await axios.post(matchSnippetsUrl, matchSnippetsData, {
              headers: {
                apikey: process.env.SUPABASE_KEY,
              }
            });
          snippets.value = matchSnippetsResponse.data;
          
          const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                "role": "system",
                "content": "You're 'Hammer' from 'Don't be a doorstop' podcast. The podcast is about mindset and entrepreneurship. You'll be asked a question and I'll provided you with content snippets from the podcast related to their question. Avoid restating the question or mentioning the use of the snippets. Steer clear of generic statements, introductory statements and hedging. Only use these snippets to form a super short, specific, direct, concise, positive, direct answer to their question. Use British English spelling. Use a friendly, informal tone as if you're talking to a friend."
              },
              {
                "role": "assistant",
                "content": `Their question is ${content.value}: Podcast snippets: ${JSON.stringify(snippets.value)}`

              },
            ],
            temperature: 1,
            max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          });

          console.log(response)
          answer.value = response.choices[0].message.content;
        

          
        } catch (error) {
            console.error("Error querying match snippets:", error);
        }
      
      } catch (error) {
        console.error("Error generating embedding:", error);
      }
    };
    
    const updateChunk = async (id, content) => {
      console.log("Update: ", id, content);

      const openaiUrl = "https://api.openai.com/v1/embeddings";
      const headers = {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json",
      };
      const data = {
        input: content,
        model: "text-embedding-ada-002",
      };

      try {
        const response = await axios.post(openaiUrl, data, {headers: headers});
        //console.log("Response: ", response.data.data[0].embedding);
      
        if (response.data && response.data.data[0].embedding) {
          const { data: updateData, error: updateError } = await supabase
            .from('chunks')
            .update({
              embedding: response.data.data[0].embedding
            })
            .eq('id', id)
      
          if (updateError) {
            console.error('Error updating embedding in Supabase:', updateError);
          } else {
            console.log('Done updating embedding in Supabase');
          }
        }
      } catch (error) {
        console.error("Error generating embedding:", error);
      }
    };


    

    //getChunks();

    return {
      chunks,
      //updateChunk,
      getEmbed,
      embed,
      content,
      snippets,
      answer,
      
    };
  },
});
</script>
<style lang="scss" scoped>
  
table {
  width: 100%;
  th {
    text-align: left;
  }
  td {
    padding: 5px;
  }
  td,
  th {
    border-bottom: 1px solid grey;
  }
  .content {
    background: rgba(grey, 0.1);
    padding: 2px 10px;
    width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
