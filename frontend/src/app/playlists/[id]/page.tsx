'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserPlaylists, updatePlaylistMetadata } from '../../../services/userService';

interface PlaylistTrack {
  _id: string;
  title: string;
  creatorId: {
    name: string;
  };
  plays: number;
  coverURL?: string;
  audioURL?: string;
  audioUrl?: string;
  url?: string;
  coverImage?: string;
  audio?: string;
  src?: string;
}

interface Playlist {
  _id: string;
  name: string;
  description: string;
  userId: {
    _id: string;
    name: string;
  };
  tracks: PlaylistTrack[];
  isPublic: boolean;
  createdAt: string;
}

export default function EditPlaylist() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const playlists = await getUserPlaylists();
        const foundPlaylist = playlists.find((p: Playlist) => p._id === id);

        if (!foundPlaylist) {
          setError('Playlist not found');
          return;
        }

        // Check if user owns the playlist
        if (foundPlaylist.userId._id !== user?.id) {
          setError('You do not have permission to edit this playlist');
          return;
        }

        setPlaylist(foundPlaylist);
        setName(foundPlaylist.name);
        setDescription(foundPlaylist.description || '');
        setIsPublic(foundPlaylist.isPublic);
      } catch (err: any) {
        setError(err.message || 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id, isAuthenticated, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Playlist name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Update playlist metadata
      if (!playlist?._id) {
        setError('Playlist ID is missing');
        return;
      }
      
      const result = await updatePlaylistMetadata(playlist._id, name, description, isPublic);
      if (result) {
        alert('Playlist updated successfully!');
        router.push('/playlists');
      } else {
        setError('Failed to update playlist. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update playlist');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D67]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <button 
              onClick={() => router.push('/playlists')}
              className="px-4 py-2 bg-[#FF4D67] hover:bg-[#FF4D67]/90 text-white rounded-lg transition-colors"
            >
              Back to Playlists
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12">
      <div className="absolute -top-40 left-0 w-96 h-96 bg-[#FF4D67]/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 right-0 w-96 h-96 bg-[#FFCB2B]/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 sm:px-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] mb-2">
            Edit Playlist
          </h1>
          <p className="text-gray-400">Modify your playlist details</p>
        </div>

        <form onSubmit={handleSubmit} className="card-bg rounded-2xl p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Playlist Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67]"
                placeholder="Enter playlist name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] resize-none"
                placeholder="Enter playlist description"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-[#FF4D67] bg-gray-800 border-gray-700 rounded focus:ring-[#FF4D67]"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-gray-300">
                Make this playlist public
              </label>
            </div>

            {error && (
              <div className="text-red-500 text-sm py-2">{error}</div>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] hover:opacity-90 text-white rounded-lg transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Track Management Section */}
        <div className="mt-8 card-bg rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Manage Tracks</h2>
          <p className="text-gray-400 mb-4">Add or remove tracks from this playlist</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              className="px-4 py-3 bg-gradient-to-r from-[#FF4D67] to-[#FFCB2B] hover:opacity-90 text-white rounded-lg transition-opacity"
              onClick={() => {
                // In a real implementation, this would open a modal to add tracks
                alert('Add tracks functionality would open here');
              }}
            >
              Add Tracks
            </button>
            
            <button 
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              onClick={() => {
                // In a real implementation, this would open a modal to remove tracks
                alert('Remove tracks functionality would open here');
              }}
            >
              Remove Tracks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}