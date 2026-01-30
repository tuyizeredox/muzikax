const mongoose = require('./backend/node_modules/mongoose');

async function investigateOriginalTrack() {
  try {
    // Connect to MongoDB using the production URI
    const mongoUri = 'mongodb+srv://hashimuimfuransa:hashimu@cluster0.qzuhv97.mongodb.net/muzikax?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');
    
    const albumId = '693a93e47b854c5beb55c1ff';
    
    // Get the album
    const album = await mongoose.connection.collection('albums').findOne({ 
      _id: new mongoose.Types.ObjectId(albumId) 
    });
    
    console.log('Album details:');
    console.log(`Title: ${album.title}`);
    console.log(`Description: ${album.description}`);
    console.log(`Created: ${album.createdAt}`);
    console.log(`Creator: ${album.creatorId}`);
    
    // Check what tracks this creator has
    const creatorTracks = await mongoose.connection.collection('tracks').find({ 
      creatorId: album.creatorId 
    }).toArray();
    
    console.log(`\nThis creator has ${creatorTracks.length} total tracks:`);
    creatorTracks.forEach((track, index) => {
      const inAlbum = track.albumId && track.albumId.toString() === albumId;
      console.log(`${index + 1}. ${track.title} (${track._id})`);
      console.log(`   Type: ${track.type}, Genre: ${track.genre}`);
      console.log(`   In this album: ${inAlbum ? 'YES' : 'NO'}`);
      console.log(`   AlbumId: ${track.albumId || 'null'}`);
      console.log('');
    });
    
    // Check if there's a track that should belong to this album
    // Maybe it exists but doesn't have the albumId reference
    const tracksWithoutAlbum = creatorTracks.filter(track => !track.albumId);
    console.log(`Tracks without album assignment: ${tracksWithoutAlbum.length}`);
    
    if (tracksWithoutAlbum.length > 0) {
      console.log('\nTracks that could potentially belong to this album:');
      tracksWithoutAlbum.forEach((track, index) => {
        console.log(`${index + 1}. ${track.title} (${track._id})`);
        console.log(`   Genre: ${track.genre}, Type: ${track.type}`);
      });
      
      // If there's only one track without album, and the album is named "soul",
      // we could assign that track to this album
      if (tracksWithoutAlbum.length === 1) {
        const track = tracksWithoutAlbum[0];
        console.log(`\nThis track "${track.title}" could be the one for the "${album.title}" album.`);
        console.log('Would you like to assign it to this album?');
      }
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

investigateOriginalTrack();