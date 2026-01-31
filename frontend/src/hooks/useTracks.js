import { useState, useEffect } from 'react';
import { fetchAllTracks, fetchTrendingTracks, fetchPopularCreators, fetchTracksByType } from '../services/trackService';
export const useAllTracks = (page = 1, limit = 10) => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchTracks = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAllTracks(page, limit);
            setTracks(data.tracks);
        }
        catch (err) {
            setError(err.message || 'Failed to fetch tracks');
            console.error('Error fetching tracks:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTracks();
    }, [page, limit]);
    return { tracks, loading, error, refresh: fetchTracks };
};
export const useTrendingTracks = (limit = 10, page = 1) => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(0);
    const fetchTracks = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAllTracks(page, limit);
            setTracks(data.tracks);
            setTotal(data.total);
            setPages(data.pages);
        }
        catch (err) {
            setError(err.message || 'Failed to fetch trending tracks');
            console.error('Error fetching trending tracks:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTracks();
    }, [limit, page]);
    return { tracks, loading, error, refresh: fetchTracks, total, page, pages };
};
export const usePopularCreators = (limit = 10) => {
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchCreators = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchPopularCreators(limit);
            setCreators(data);
        }
        catch (err) {
            setError(err.message || 'Failed to fetch popular creators');
            console.error('Error fetching popular creators:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCreators();
    }, [limit]);
    return { creators, loading, error, refresh: fetchCreators };
};
export const useTracksByType = (type, limit = 10) => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchTracks = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchTracksByType(type, limit);
            setTracks(data);
        }
        catch (err) {
            setError(err.message || `Failed to fetch ${type} tracks`);
            console.error(`Error fetching ${type} tracks:`, err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTracks();
    }, [type, limit]);
    return { tracks, loading, error, refresh: fetchTracks };
};
