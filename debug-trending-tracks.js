async function debugTrendingTracks() {
  try {
    console.log('🔍 Debugging trending tracks issue...\n');
    
    // Test 1: Fetch trending tracks from API
    console.log('1. Fetching trending tracks from API...');
    const trendingResponse = await fetch('http://localhost:5000/api/tracks?limit=20&page=1');
    const trendingData = await trendingResponse.json();
    
    console.log(`✓ Received ${trendingData.tracks?.length || 0} tracks`);
    console.log('✓ Total pages:', trendingData.pages);
    console.log('✓ Current page:', trendingData.page);
    console.log('✓ Total tracks:', trendingData.total);
    
    // Test 2: Check track data structure
    console.log('\n2. Analyzing track data structure...');
    if (trendingData.tracks && trendingData.tracks.length > 0) {
      const sampleTrack = trendingData.tracks[0];
      console.log('Sample track keys:', Object.keys(sampleTrack));
      console.log('Sample track title:', sampleTrack.title);
      console.log('Sample track artist:', sampleTrack.creatorId?.name || 'Unknown');
      console.log('Sample track plays:', sampleTrack.plays);
      console.log('Sample track likes:', sampleTrack.likes);
      console.log('Sample track type:', sampleTrack.type);
      console.log('Sample track coverURL:', sampleTrack.coverURL ? 'Yes' : 'No');
      console.log('Sample track audioURL:', sampleTrack.audioURL ? 'Yes' : 'No');
      
      // Check if there are any missing fields
      const requiredFields = ['title', 'creatorId', 'plays', 'likes'];
      const missingFields = requiredFields.filter(field => {
        if (field === 'creatorId') {
          return !sampleTrack.creatorId || !sampleTrack.creatorId.name;
        }
        return sampleTrack[field] === undefined;
      });
      
      if (missingFields.length > 0) {
        console.log('⚠ Missing fields:', missingFields);
      } else {
        console.log('✓ All required fields present');
      }
    }
    
    // Test 3: Check pagination consistency
    console.log('\n3. Checking pagination consistency...');
    const page1Response = await fetch('http://localhost:5000/api/tracks?limit=10&page=1');
    const page1Data = await page1Response.json();
    
    const page2Response = await fetch('http://localhost:5000/api/tracks?limit=10&page=2');
    const page2Data = await page2Response.json();
    
    console.log(`Page 1: ${page1Data.tracks?.length || 0} tracks`);
    console.log(`Page 2: ${page2Data.tracks?.length || 0} tracks`);
    
    // Check for duplicate tracks between pages
    if (page1Data.tracks && page2Data.tracks) {
      const page1Ids = page1Data.tracks.map(t => t._id);
      const page2Ids = page2Data.tracks.map(t => t._id);
      const duplicates = page1Ids.filter(id => page2Ids.includes(id));
      
      if (duplicates.length > 0) {
        console.log('⚠ Found duplicate tracks between pages:', duplicates);
      } else {
        console.log('✓ No duplicate tracks found between pages');
      }
    }
    
    // Test 4: Check if all tracks have proper creator data
    console.log('\n4. Checking creator data population...');
    if (trendingData.tracks) {
      const tracksWithoutCreator = trendingData.tracks.filter(track => 
        !track.creatorId || !track.creatorId.name
      );
      
      console.log(`Tracks without creator data: ${tracksWithoutCreator.length}`);
      
      if (tracksWithoutCreator.length > 0) {
        console.log('First track without creator:');
        console.log(JSON.stringify(tracksWithoutCreator[0], null, 2));
      }
    }
    
    // Test 5: Simulate frontend grid rendering
    console.log('\n5. Simulating frontend grid layout...');
    if (trendingData.tracks) {
      // Simulate a 4-column grid (like on desktop)
      const columns = [[], [], [], []];
      
      trendingData.tracks.forEach((track, index) => {
        const columnIndex = index % 4;
        columns[columnIndex].push({
          id: track._id,
          title: track.title,
          artist: track.creatorId?.name || 'Unknown',
          hasCover: !!track.coverURL,
          hasAudio: !!track.audioURL,
          plays: track.plays,
          likes: track.likes
        });
      });
      
      console.log('Column distribution:');
      columns.forEach((col, index) => {
        console.log(`  Column ${index + 1}: ${col.length} tracks`);
        col.forEach((track, trackIndex) => {
          const issues = [];
          if (!track.hasCover) issues.push('no cover');
          if (!track.hasAudio) issues.push('no audio');
          if (track.artist === 'Unknown') issues.push('no artist');
          
          console.log(`    ${trackIndex + 1}. ${track.title} - ${track.artist}${issues.length > 0 ? ` (${issues.join(', ')})` : ''}`);
        });
      });
    }
    
    console.log('\n✅ Debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Run the debug function
debugTrendingTracks();