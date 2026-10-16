package in.campustwin.explanation;

/**
 * Strategy interface for explanation generation.
 * Decouples hosted LLM integration from deterministic fallback templates.
 */
public interface ExplanationProvider {

    GeneratedExplanation generate(ExplanationContext context);

    String getProviderName();
}
