"use client";
import { useEffect } from "react";

// Fires a DataFast goal once per browser for a given key (e.g. a new account's id).
export function TrackGoalOnce({ goal, onceKey }: { goal: string; onceKey: string }) {
  useEffect(() => {
    const flag = `dk_goal_${goal}_${onceKey}`;
    try {
      if (localStorage.getItem(flag)) return;
      localStorage.setItem(flag, "1");
    } catch {
      // Storage blocked: still record the goal rather than lose it.
    }
    (window as unknown as { datafast?: (goal: string) => void }).datafast?.(goal);
  }, [goal, onceKey]);
  return null;
}
