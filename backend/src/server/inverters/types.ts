/** Shape every brand adapter must satisfy. No chain imports allowed here. */
export interface InverterAdapter {
  readonly brand: string;
  /**
   * Attempt a lightweight validation call against the brand's API using the
   * supplied credentials. Resolves with a human-readable label on success,
   * throws with a descriptive message on failure.
   */
  validateCredentials(credentials: Record<string, string>): Promise<string>;
}
