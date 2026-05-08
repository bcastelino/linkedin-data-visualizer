import LLMPanel from '../LLMPanel';

/**
 * AI Summary tab: hosts the LLMPanel which contains the input controls,
 * call log, and rendered insight results.
 */
export default function AISummaryTab() {
  return (
    <div className="space-y-4">
      <LLMPanel />
    </div>
  );
}
