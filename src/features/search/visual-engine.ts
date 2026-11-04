/** Compatibility exports for real-image ranking. No synthetic catalogue or seeded vectors. */
export {cosine as cosineSimilarity,textRelevance as computeTextRelevance} from './discovery';
export type {DiscoveryProduct as CatalogSearchItem} from './discovery';
