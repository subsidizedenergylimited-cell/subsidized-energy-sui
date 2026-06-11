/** Shape every brand adapter must satisfy. No chain imports allowed here. */
export interface InverterAdapter {
  readonly brand: string;

  /**
   * Attempt a lightweight validation call against the brand's API using the
   * supplied credentials. Resolves with a human-readable label on success,
   * throws with a descriptive message on failure.
   */
  validateCredentials(credentials: Record<string, string>): Promise<string>;

  /**
   * Fetch the total watt-hours produced on `productionDay` (YYYYMMDD).
   * Must return an integer >= 0.
   *
   * Implementation note: prefer the day's END-OF-DAY cumulative reading where
   * available to avoid partial-day double-counting.  The pipeline takes the
   * MAX across all readings it has seen for a given day as the final figure.
   */
  readProduction(
    credentials: Record<string, string>,
    productionDay: number,
  ): Promise<number>;
}
