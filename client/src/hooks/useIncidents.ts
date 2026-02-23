import { useState, useEffect, useCallback } from 'react';
import { Incident, PaginationMeta } from '../types';
import { getIncidents } from '../services/api';

interface UseIncidentsParams {
  severity?: string;
  status?: string;
  source?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

interface UseIncidentsReturn {
  incidents: Incident[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIncidents(params: UseIncidentsParams): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(params);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getIncidents(params);
      setIncidents(result.incidents);
      setPagination(result.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch incidents';
      setError(message);
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { incidents, pagination, loading, error, refetch: fetchData };
}
