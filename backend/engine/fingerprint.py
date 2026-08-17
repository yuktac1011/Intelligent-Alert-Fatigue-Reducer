import re
import hashlib
from typing import Dict, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class SemanticFingerprinter:
    def __init__(self, similarity_threshold: float = 0.85):
        self.similarity_threshold = similarity_threshold
        self.known_fingerprints: Dict[str, str] = {} # normalized_text -> fingerprint_id
        
    def normalize_message(self, message: str) -> str:
        # Lowercase
        msg = message.lower()
        # Remove UUIDs
        msg = re.sub(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '<UUID>', msg)
        # Remove IP addresses
        msg = re.sub(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '<IP>', msg)
        # Remove pod IDs or specific instance names (e.g. pod-17 -> pod-<ID>)
        msg = re.sub(r'pod-\w+', 'pod-<ID>', msg)
        # Remove numbers
        msg = re.sub(r'\b\d+(\.\d+)?(ms|s|kb|mb|gb)?\b', '<NUM>', msg)
        # Remove request IDs or traces
        msg = re.sub(r'trace_id=[a-z0-9]+', 'trace_id=<ID>', msg)
        return msg.strip()

    def get_fingerprint(self, message: str) -> Tuple[str, float]:
        """
        Returns a tuple of (fingerprint_id, similarity_score).
        For this prototype, if the normalized message matches exactly, it's a 1.0 similarity.
        Otherwise, we use TF-IDF to find the closest match.
        """
        normalized = self.normalize_message(message)
        
        if normalized in self.known_fingerprints:
            return self.known_fingerprints[normalized], 1.0
            
        # If we have existing fingerprints, check similarity
        if self.known_fingerprints:
            corpus = list(self.known_fingerprints.keys())
            corpus.append(normalized)
            vectorizer = TfidfVectorizer().fit_transform(corpus)
            vectors = vectorizer.toarray()
            
            target_vector = vectors[-1].reshape(1, -1)
            corpus_vectors = vectors[:-1]
            
            similarities = cosine_similarity(target_vector, corpus_vectors)[0]
            max_sim_idx = similarities.argmax()
            max_sim = similarities[max_sim_idx]
            
            if max_sim >= self.similarity_threshold:
                matched_normalized = list(self.known_fingerprints.keys())[max_sim_idx]
                fp_id = self.known_fingerprints[matched_normalized]
                # Map this new normalized text to the same fingerprint ID
                self.known_fingerprints[normalized] = fp_id
                return fp_id, float(max_sim)

        # Create new fingerprint
        # Create a stable hash of the normalized message
        fp_id = "fp_" + hashlib.md5(normalized.encode()).hexdigest()[:8]
        self.known_fingerprints[normalized] = fp_id
        return fp_id, 1.0

# Singleton instance for the prototype
fingerprinter = SemanticFingerprinter()
