"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_HISTORY = 50;

interface HistoryFlags {
  canUndo: boolean;
  canRedo: boolean;
}

export function useEditorHistory<T>(initialState: T) {
  const [state, setState] = useState(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const isApplyingHistoryRef = useRef(false);
  const stateRef = useRef(state);
  const [historyFlags, setHistoryFlags] = useState<HistoryFlags>({
    canUndo: false,
    canRedo: false,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncHistoryFlags = useCallback(() => {
    setHistoryFlags({
      canUndo: pastRef.current.length > 0,
      canRedo: futureRef.current.length > 0,
    });
  }, []);

  const cloneState = useCallback((value: T): T => {
    return structuredClone(value);
  }, []);

  const commit = useCallback(
    (nextState: T | ((previous: T) => T)) => {
      setState((previous) => {
        const resolved =
          typeof nextState === "function"
            ? (nextState as (value: T) => T)(previous)
            : nextState;

        if (!isApplyingHistoryRef.current) {
          pastRef.current.push(cloneState(previous));
          if (pastRef.current.length > MAX_HISTORY) {
            pastRef.current.shift();
          }
          futureRef.current = [];
        }

        return resolved;
      });
    },
    [cloneState],
  );

  const replace = useCallback((nextState: T) => {
    isApplyingHistoryRef.current = true;
    setState(nextState);
    isApplyingHistoryRef.current = false;
  }, []);

  const patch = useCallback((updater: (previous: T) => T) => {
    setState(updater);
  }, []);

  const checkpoint = useCallback(() => {
    if (isApplyingHistoryRef.current) {
      return;
    }

    pastRef.current.push(cloneState(stateRef.current));
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current.shift();
    }
    futureRef.current = [];
    syncHistoryFlags();
  }, [cloneState, syncHistoryFlags]);

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) {
      return;
    }

    futureRef.current.push(cloneState(stateRef.current));
    replace(previous);
    syncHistoryFlags();
  }, [cloneState, replace, syncHistoryFlags]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) {
      return;
    }

    pastRef.current.push(cloneState(stateRef.current));
    replace(next);
    syncHistoryFlags();
  }, [cloneState, replace, syncHistoryFlags]);

  const resetHistory = useCallback(
    (nextState: T) => {
      pastRef.current = [];
      futureRef.current = [];
      replace(nextState);
      syncHistoryFlags();
    },
    [replace, syncHistoryFlags],
  );

  useEffect(() => {
    syncHistoryFlags();
  }, [state, syncHistoryFlags]);

  return {
    state,
    commit,
    replace,
    patch,
    checkpoint,
    undo,
    redo,
    resetHistory,
    canUndo: historyFlags.canUndo,
    canRedo: historyFlags.canRedo,
  };
}
