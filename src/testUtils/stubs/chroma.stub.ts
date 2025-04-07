import { ChromaClient, Collection } from 'chromadb';

// Create minimal types that match what we need from ChromaDB
// This avoids type compatibility issues with the actual ChromaDB types

export interface ChromaCollectionInterface {
  add: (params: {
    ids: string[];
    embeddings: number[][];
    metadatas?: Record<string, any>[];
    documents?: string[];
  }) => Promise<void>;
  
  query: (params: {
    queryEmbeddings?: number[][];
    queryTexts?: string[];
    nResults?: number;
    where?: Record<string, any>;
    whereDocument?: Record<string, any>;
    include?: string[];
  }) => Promise<{
    ids: string[][];
    distances: number[][];
    metadatas?: Record<string, any>[][];
    documents?: string[][];
    embeddings?: number[][][];
    included?: Record<string, any>;
  }>;
}

export interface ChromaClientInterface {
  getOrCreateCollection: (params: { 
    name: string;
    metadata?: Record<string, any>;
  }) => Promise<ChromaCollectionInterface>;
}

// Stub implementation of the Collection class
export class CollectionStub implements ChromaCollectionInterface {
  private ids: string[] = [];
  private embeddings: number[][] = [];
  private metadatas: Record<string, any>[] = [];
  private documents: string[] = [];
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async add(params: {
    ids: string[];
    embeddings: number[][];
    metadatas?: Record<string, any>[];
    documents?: string[];
  }): Promise<void> {
    for (let i = 0; i < params.ids.length; i++) {
      this.ids.push(params.ids[i]);
      this.embeddings.push(params.embeddings[i]);
      
      if (params.metadatas) {
        this.metadatas.push(params.metadatas[i]);
      } else {
        this.metadatas.push({});
      }
      
      if (params.documents) {
        this.documents.push(params.documents[i]);
      } else {
        this.documents.push('');
      }
    }
  }

  async query(params: {
    queryEmbeddings?: number[][];
    queryTexts?: string[];
    nResults?: number;
    where?: Record<string, any>;
    whereDocument?: Record<string, any>;
    include?: string[];
  }): Promise<{
    ids: string[][];
    distances: number[][];
    metadatas?: Record<string, any>[][];
    documents?: string[][];
    embeddings?: number[][][];
    included?: Record<string, any>;
  }> {
    if (!params.queryEmbeddings || params.queryEmbeddings.length === 0) {
      return {
        ids: [[]],
        distances: [[]],
        metadatas: [[]],
        documents: [[]],
        embeddings: [[]]
      };
    }

    const nResults = params.nResults || 10;
    const queryEmbedding = params.queryEmbeddings[0];
    
    // Calculate cosine similarity between query and all embeddings
    const similarities = this.embeddings.map(embedding => this.cosineSimilarity(queryEmbedding, embedding));
    
    // Create array of indices
    const indices = Array.from({ length: similarities.length }, (_, i) => i);
    
    // Sort indices by similarity (highest first)
    indices.sort((a, b) => similarities[b] - similarities[a]);
    
    // Take top n results
    const topIndices = indices.slice(0, Math.min(nResults, indices.length));
    
    // Build result
    const result = {
      ids: [topIndices.map(i => this.ids[i])],
      distances: [topIndices.map(i => 1 - similarities[i])], // Convert similarity to distance
      metadatas: [topIndices.map(i => this.metadatas[i])],
      documents: [topIndices.map(i => this.documents[i])],
      embeddings: [topIndices.map(i => this.embeddings[i])],
      included: {}
    };
    
    return result;
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

// Stub implementation of the ChromaClient class
export class ChromaClientStub implements ChromaClientInterface {
  private collections: Map<string, CollectionStub> = new Map();

  async getOrCreateCollection(params: { 
    name: string;
    metadata?: Record<string, any>;
  }): Promise<ChromaCollectionInterface> {
    if (!this.collections.has(params.name)) {
      this.collections.set(params.name, new CollectionStub(params.name));
    }
    return this.collections.get(params.name)!;
  }
} 