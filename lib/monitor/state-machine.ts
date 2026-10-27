export type Status = "unknown" | "up" | "down";
export type Transition = "went_down" | "recovered" | null;

type Prev = { status: Status; consecutiveFailures: number; threshold: number };
type Next = {
  status: Status;
  consecutiveFailures: number;
  transition: Transition;
};

/**
 * One success -> UP. DOWN only after `threshold` consecutive failures.
 * A transition is reported only when the state really flips (no repeat alerts).
 */
export function nextState(prev: Prev, ok: boolean): Next {
  if (ok) {
    return {
      status: "up",
      consecutiveFailures: 0,
      transition: prev.status === "down" ? "recovered" : null,
    };
  }

  const failures = prev.consecutiveFailures + 1;

  if (failures >= prev.threshold) {
    return {
      status: "down",
      consecutiveFailures: failures,
      transition: prev.status === "down" ? null : "went_down",
    };
  }

  return {
    status: prev.status,
    consecutiveFailures: failures,
    transition: null,
  };
}
