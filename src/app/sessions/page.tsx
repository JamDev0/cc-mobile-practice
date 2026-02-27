"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markViewInteractive } from "@/shared/utils/performanceProfiler";
import { useRouter } from "next/navigation";
import { useTheme } from "@/shared/theme/ThemeProvider";
import {
  createSessionFromPdf,
  listSessions,
} from "@/features/session/service/sessionService";
import type { Session } from "@/domain/models/types";
import { InkSessions } from "@/variants/ink";
import { TerraSessions } from "@/variants/terra";
import { FrostSessions } from "@/variants/frost";
import { NoirSessions } from "@/variants/noir";
import { CitrusSessions } from "@/variants/citrus";

export default function SessionsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const refreshSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    const result = await listSessions();
    setLoadingSessions(false);
    if (result.ok) {
      setSessions(result.sessions);
    } else {
      setSessionsError(result.error);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (!loadingSessions) {
      markViewInteractive("sessions");
    }
  }, [loadingSessions]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setCreating(true);
      const result = await createSessionFromPdf(file);
      setCreating(false);
      e.target.value = "";
      if (result.ok) {
        await refreshSessions();
        router.push(`/sessions/${result.sessionId}`);
      } else {
        setError(result.error);
      }
    },
    [router, refreshSessions]
  );

  const handleCreateClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const layoutProps = {
    sessions,
    loading: loadingSessions,
    error: sessionsError,
    creating,
    createError: error,
    onCreateClick: handleCreateClick,
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="application/pdf"
      onChange={handleFileChange}
      style={{ display: "none" }}
    />
  );

  switch (theme) {
    case "ink":
      return <>{fileInput}<InkSessions {...layoutProps} /></>;
    case "terra":
      return <>{fileInput}<TerraSessions {...layoutProps} /></>;
    case "frost":
      return <>{fileInput}<FrostSessions {...layoutProps} /></>;
    case "noir":
      return <>{fileInput}<NoirSessions {...layoutProps} /></>;
    case "citrus":
      return <>{fileInput}<CitrusSessions {...layoutProps} /></>;
  }
}
