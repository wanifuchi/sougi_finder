export interface MapChunk {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  maps?: MapChunk;
}

export interface QAndA {
  question: string;
  answer: string;
}

export interface SearchResult {
  title:string;
  uri: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: string[];
  qanda?: QAndA[];
}