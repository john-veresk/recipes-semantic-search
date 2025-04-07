import ollama from 'ollama';

// Document structure for ingredients
interface DocumentWithEmbedding {
  id: string;
  recipe_id: string;
  ingredients: string;
  embedding: number[];
}

class EmbeddingService {
  private documents: DocumentWithEmbedding[] = [];
  private embeddingModel = 'mxbai-embed-large';
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      this.initialized = true;
      console.log('In-memory embedding service initialized');
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
    
    this.documents.push({
      id,
      recipe_id,
      ingredients,
      embedding: response.embedding,
    });
    
    return id;
  }

  async searchSimilarIngredients(query: string, limit: number = 3): Promise<{recipe_id: string, ingredients: string}[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.documents.length === 0) {
      return [];
    }

    // Generate embedding for query
    const response = await ollama.embeddings({
      model: this.embeddingModel,
      prompt: query,
    });
    
    const queryEmbedding = response.embedding;
    
    // Calculate cosine similarity with all documents
    const documentsWithSimilarity = this.documents.map(doc => {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return {
        recipe_id: doc.recipe_id,
        ingredients: doc.ingredients,
        similarity
      };
    });
    
    // Sort by similarity (highest first) and take the top 'limit' results
    const results = documentsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(({recipe_id, ingredients}) => ({recipe_id, ingredients}));
    
    return results;
  }
  
  // Calculate cosine similarity between two vectors
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] ** 2;
      normB += vecB[i] ** 2;
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export default new EmbeddingService(); 