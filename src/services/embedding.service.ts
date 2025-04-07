import ollama from 'ollama';
import { ChromaClient, Collection } from 'chromadb';

// Document structure for ingredients
interface DocumentWithEmbedding {
  id: string;
  recipe_id: string;
  ingredients: string;
  embedding: number[];
}

export class EmbeddingService {
  private client: ChromaClient;
  private collection!: Collection; // Using definite assignment assertion
  private embeddingModel = 'mxbai-embed-large';
  private initialized = false;
  private collectionName = 'ingredients';

  constructor(client?: ChromaClient) {
    this.client = client || new ChromaClient();
  }

  async initialize(): Promise<void> {
    try {
      // Create or get the collection
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
      });
      
      this.initialized = true;
      console.log('ChromaDB embedding service initialized');
    } catch (error) {
      console.error('Failed to initialize embedding service:', error);
      throw error;
    }
  }

  async addIngredient(recipe_id: string, ingredients: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Generate embedding for the ingredients
    const response = await ollama.embeddings({
      model: this.embeddingModel,
      prompt: ingredients,
    });
    
    const id = `ing_${Date.now()}`;
    
    // Add to ChromaDB
    await this.collection.add({
      ids: [id],
      embeddings: [response.embedding],
      metadatas: [{ recipe_id }],
      documents: [ingredients]
    });
    
    return id;
  }

  async searchSimilarIngredients(query: string, limit: number = 3): Promise<{recipe_id: string, ingredients: string}[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate embedding for query
    const response = await ollama.embeddings({
      model: this.embeddingModel,
      prompt: query,
    });
    
    // Use ChromaDB's native query capabilities
    const result = await this.collection.query({
      queryEmbeddings: [response.embedding],
      nResults: limit
    });
    
    // Map the results to the expected format
    const matches: {recipe_id: string, ingredients: string}[] = [];
    
    // Safely access nested properties
    const metadatas = result.metadatas?.[0] || [];
    const documents = result.documents?.[0] || [];
    
    for (let i = 0; i < metadatas.length && i < documents.length; i++) {
      const metadata = metadatas[i];
      const document = documents[i];
      
      if (metadata?.recipe_id && document) {
        matches.push({
          recipe_id: String(metadata.recipe_id),
          ingredients: String(document)
        });
      }
    }
    
    return matches;
  }
}

export default new EmbeddingService(); 