async function testSpecificColumns() {
  try {
    console.log('🔍 Testing specific column issues...\n');
    
    // Fetch trending tracks
    const response = await fetch('http://localhost:5000/api/tracks?limit=20&page=1');
    const data = await response.json();
    const tracks = data.tracks;
    
    console.log(`Total tracks received: ${tracks.length}\n`);
    
    // Simulate 4-column grid layout and analyze each position
    console.log('Analyzing track data by grid position:');
    console.log('=====================================\n');
    
    for (let i = 0; i < Math.min(tracks.length, 12); i++) {
      const track = tracks[i];
      const columnIndex = (i % 4) + 1; // 1-based indexing for columns
      const rowIndex = Math.floor(i / 4) + 1; // 1-based indexing for rows
      
      console.log(`Position [Row ${rowIndex}, Col ${columnIndex}]:`);
      console.log(`  Title: "${track.title}"`);
      console.log(`  Artist: ${track.creatorId?.name || 'Unknown Artist'}`);
      console.log(`  Has Cover Image: ${!!track.coverURL}`);
      console.log(`  Has Audio URL: ${!!track.audioURL}`);
      console.log(`  Plays: ${track.plays}`);
      console.log(`  Likes: ${track.likes}`);
      console.log(`  Type: ${track.type}`);
      console.log(`  Album: ${track.albumId?.title || 'None'}`);
      
      // Check for potential issues
      const issues = [];
      if (!track.title) issues.push('Missing title');
      if (!track.creatorId?.name) issues.push('Missing artist name');
      if (!track.coverURL) issues.push('Missing cover image');
      if (!track.audioURL) issues.push('Missing audio URL');
      if (track.plays === undefined) issues.push('Missing plays count');
      if (track.likes === undefined) issues.push('Missing likes count');
      
      if (issues.length > 0) {
        console.log(`  ⚠ Issues: ${issues.join(', ')}`);
      } else {
        console.log(`  ✓ No issues detected`);
      }
      
      console.log('');
    }
    
    // Check if there's a pattern with specific columns
    console.log('Column-wise analysis:');
    console.log('====================\n');
    
    const columns = [[], [], [], []]; // 0-indexed columns
    
    tracks.forEach((track, index) => {
      const colIndex = index % 4;
      columns[colIndex].push({
        index: index + 1,
        title: track.title,
        hasCover: !!track.coverURL,
        hasAudio: !!track.audioURL,
        artist: track.creatorId?.name || 'Unknown',
        issues: []
      });
    });
    
    columns.forEach((colTracks, colIndex) => {
      console.log(`Column ${colIndex + 1}:`);
      const missingCover = colTracks.filter(t => !t.hasCover).length;
      const missingAudio = colTracks.filter(t => !t.hasAudio).length;
      const unknownArtist = colTracks.filter(t => t.artist === 'Unknown').length;
      
      console.log(`  Total tracks: ${colTracks.length}`);
      console.log(`  Missing covers: ${missingCover}`);
      console.log(`  Missing audio: ${missingAudio}`);
      console.log(`  Unknown artists: ${unknownArtist}`);
      
      if (missingCover > 0 || missingAudio > 0 || unknownArtist > 0) {
        console.log(`  Affected tracks:`);
        colTracks.forEach(track => {
          const problems = [];
          if (!track.hasCover) problems.push('no cover');
          if (!track.hasAudio) problems.push('no audio');
          if (track.artist === 'Unknown') problems.push('unknown artist');
          
          if (problems.length > 0) {
            console.log(`    ${track.index}. "${track.title}" (${problems.join(', ')})`);
          }
        });
      }
      console.log('');
    });
    
    // Test the actual mapping logic used in frontend
    console.log('Testing frontend mapping logic:');
    console.log('==============================\n');
    
    const mappedTracks = tracks.map(track => ({
      id: track._id,
      title: track.title || 'Untitled Track',
      artist: typeof track.creatorId === "object" && track.creatorId !== null
        ? track.creatorId.name
        : "Unknown Artist",
      album: track.albumId?.title || "",
      plays: track.plays || 0,
      likes: track.likes || 0,
      coverImage: track.coverURL || "",
      duration: track.duration || "",
      category: track.type || 'song',
      type: track.type || 'song',
      paymentType: track.paymentType,
      creatorId: typeof track.creatorId === "object" && track.creatorId !== null
        ? track.creatorId._id
        : track.creatorId,
      audioUrl: track.audioURL || "",
    }));
    
    console.log('Mapped track sample:');
    console.log(JSON.stringify(mappedTracks[0], null, 2));
    
    console.log('\n✅ Column analysis completed!');
    
  } catch (error) {
    console.error('❌ Column test failed:', error);
  }
}

// Run the test
testSpecificColumns();