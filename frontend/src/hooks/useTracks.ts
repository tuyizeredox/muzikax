import { useState, useEffect } from 'react';
import { ITrack } from '../types';
import { fetchAllTracks, fetchTrendingTracks, fetchPopularCreators, fetchTracksByType } from '../services/trackService';

interface UseTracksResult {
  tracks: ITrack[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  total?: number;
  page?: number;
  pages?: number;
}

interface UseCreatorsResult {
  creators: any[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useAllTracks = (page: number = 1, limit: number = 10): UseTracksResult => {
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllTracks(page, limit);
      setTracks(data.tracks);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tracks');
      console.error('Error fetching tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [page, limit]);

  return { tracks, loading, error, refresh: fetchTracks };
};

export const useTrendingTracks = (limit: number = 10, page: number = 1): UseTracksResult => {
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [pages, setPages] = useState<number>(0);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllTracks(page, limit);
      setTracks(data.tracks);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending tracks');
      console.error('Error fetching trending tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [limit, page]);

  return { tracks, loading, error, refresh: fetchTracks, total, page, pages };
};

export const usePopularCreators = (limit: number = 10): UseCreatorsResult => {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPopularCreators(limit);
      setCreators(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch popular creators');
      console.error('Error fetching popular creators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [limit]);

  return { creators, loading, error, refresh: fetchCreators };
};

export const useTracksByType = (type: string, limit: number = 10): UseTracksResult => {
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTracksByType(type, limit);
      setTracks(data);
    } catch (err: any) {
      setError(err.message || `Failed to fetch ${type} tracks`);
      console.error(`Error fetching ${type} tracks:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
  }, [type, limit]);

  return { tracks, loading, error, refresh: fetchTracks };
};