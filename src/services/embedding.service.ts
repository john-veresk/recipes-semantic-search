import ollama from 'ollama';
import { ChromaClient, Collection } from 'chromadb';

// Document structure for ingredients
interface DocumentWithEmbedding {
  id: string;
  recipe_id: string;
  ingredients: string;
  embedding: number[];
}

// Add new interface for batch input
interface IngredientRecord {
  recipe_id: string;
  ingredients: string;
}

export class EmbeddingService {
  private client: ChromaClient;
  private collection!: Collection; // Using definite assignment assertion
  private embeddingModel = 'mxbai-embed-large';
  private initialized = false;
  private collectionName: string;

  constructor(client?: ChromaClient, isTestEnvironment = process.env.NODE_ENV === 'test') {
    this.client = client || new ChromaClient();
    this.collectionName = isTestEnvironment ? 'ingredients-test' : 'ingredients';
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

  async addIngredientsBatch(records: IngredientRecord[]): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (records.length === 0) {
      return [];
    }

    const ids: string[] = [];
    const embeddings: number[][] = [];
    const metadatas: Record<string, any>[] = [];
    const documents: string[] = [];
    
    // Generate embeddings for all ingredients in parallel
    const embeddingPromises = records.map(record => 
      ollama.embeddings({
        model: this.embeddingModel,
        prompt: record.ingredients,
      })
    );
    
    const embeddingResponses = await Promise.all(embeddingPromises);
    
    // Prepare data for batch insertion
    for (let i = 0; i < records.length; i++) {
      const id = `ing_${Date.now()}_${i}`;
      ids.push(id);
      embeddings.push(embeddingResponses[i].embedding);
      metadatas.push({ recipe_id: records[i].recipe_id });
      documents.push(records[i].ingredients);
    }
    
    // Add all embeddings in a single batch operation
    await this.collection.add({
      ids,
      embeddings,
      metadatas,
      documents
    });
    
    return ids;
  }

  async deleteIngredientsByRecipeId(recipe_id: string): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Use ChromaDB's where filtering capability to find entries with matching recipe_id
    const result = await this.collection.get({
      where: { recipe_id }
    });

    // If there are no IDs to delete, return 0
    if (!result.ids || result.ids.length === 0) {
      return 0;
    }

    // Delete the found entries
    await this.collection.delete({
      ids: result.ids
    });

    return result.ids.length;
  }

  async searchSimilarIngredients(query: string, limit: number = 3): Promise<{recipe_id: string, ingredients: string}[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const searchPrompt = "Represent this sentence for searching relevant passages: ";
    // Generate embedding for query
    const response = await ollama.embeddings({
      model: this.embeddingModel,
      prompt: searchPrompt + query,
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

  async clearCollection(): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get all ids in the collection
      const result = await this.collection.get({});
      
      const deletedCount = result.ids?.length || 0;
      
      if (deletedCount > 0) {
        // Delete all entries
        await this.collection.delete({
          ids: result.ids
        });
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to clear collection:', error);
      throw error;
    }
  }
}

export default new EmbeddingService(); 