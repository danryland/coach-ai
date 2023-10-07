<template>
  <q-page class="q-pa-lg" v-if="chunks">
    <table>
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

export default defineComponent({
  name: "IndexPage",
  setup() {
    let chunks = ref([]);

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
      }
    };

    const updateChunk = async (id, content) => {
      console.log("Update: ", id, content);

      const openaiUrl = "https://api.openai.com/v1/embeds";
      const headers = {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json",
      };
      const data = {
        input: content,
        model: "text-embedding-ada-002",
      };

      try {
        const response = await axios.post(openaiUrl, data, {
          headers: headers,
        });
        console.log("Response: ", response.data[0].embedding);
      } catch (error) {
        console.error("Error generating embedding:", error);
      }
    };

    getChunks();

    return {
      chunks,
      updateChunk,
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
