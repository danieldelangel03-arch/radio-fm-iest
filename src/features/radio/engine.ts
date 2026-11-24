export type RoundOption = { songId: string; position: number; score: number };
export type TieStrategy = "context" | "first";

export function resolveRoundWinner(options: RoundOption[], strategy: TieStrategy): string {
  if (options.length !== 2) throw new Error("Una ronda debe tener exactamente dos opciones");
  const sorted = [...options].sort((a, b) => b.score - a.score || a.position - b.position);
  if (sorted[0].score !== sorted[1].score) return sorted[0].songId;
  if (strategy === "context")
    return [...options].sort((a, b) => b.score - a.score || a.position - b.position)[0].songId;
  return [...options].sort((a, b) => a.position - b.position)[0].songId;
}

export type AdvanceSnapshot = {
  version: number;
  paused: boolean;
  roundOpen: boolean;
  closesAt?: Date;
  transitionedRoundId?: string;
};
export type AdvanceDecision = { shouldCloseRound: boolean; nextVersion: number };

export function decideAdvance(snapshot: AdvanceSnapshot, databaseNow: Date): AdvanceDecision {
  if (snapshot.paused || !snapshot.roundOpen || !snapshot.closesAt)
    return { shouldCloseRound: false, nextVersion: snapshot.version };
  const shouldCloseRound =
    snapshot.closesAt.getTime() <= databaseNow.getTime() && !snapshot.transitionedRoundId;
  return {
    shouldCloseRound,
    nextVersion: shouldCloseRound ? snapshot.version + 1 : snapshot.version,
  };
}

export class SerialAdvanceCoordinator {
  private chain = Promise.resolve();
  private version = 0;
  private closed = false;
  async advance(): Promise<number> {
    const operation = this.chain.then(() => {
      if (!this.closed) {
        this.closed = true;
        this.version += 1;
      }
      return this.version;
    });
    this.chain = operation.then(() => undefined);
    return operation;
  }
}
