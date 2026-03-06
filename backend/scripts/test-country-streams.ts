import { connectDB } from '../src/config/db';
import { Streamer } from '../src/models';

const testStreams = [
  {
    id: `test_stream_${Date.now()}_ar`,
    hostId: '10755083',
    name: 'Live from Argentina 🇦🇷',
    avatar: 'https://picsum.photos/200/200?random=argentina',
    location: 'Buenos Aires, Argentina',
    time: 'Live Now',
    message: 'Transmitindo desde Argentina!',
    tags: ['live'],
    isHot: false,
    icon: '',
    country: 'ar',
    viewers: 150,
    isLive: true,
    startTime: new Date().toISOString(),
    category: 'general',
    language: 'es',
    playbackUrl: 'http://livego.store:8080/live/test_ar.flv',
    streamKey: 'test_ar',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: `test_stream_${Date.now()}_us`,
    hostId: '10755084',
    name: 'Live from USA 🇺🇸',
    avatar: 'https://picsum.photos/200/200?random=usa',
    location: 'New York, USA',
    time: 'Live Now',
    message: 'Broadcasting from United States!',
    tags: ['live'],
    isHot: false,
    icon: '',
    country: 'us',
    viewers: 200,
    isLive: true,
    startTime: new Date().toISOString(),
    category: 'general',
    language: 'en',
    playbackUrl: 'http://livego.store:8080/live/test_us.flv',
    streamKey: 'test_us',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: `test_stream_${Date.now()}_mx`,
    hostId: '10755085',
    name: 'Live from Mexico 🇲🇽',
    avatar: 'https://picsum.photos/200/200?random=mexico',
    location: 'Mexico City, Mexico',
    time: 'Live Now',
    message: 'Transmitiendo desde México!',
    tags: ['live'],
    isHot: false,
    icon: '',
    country: 'mx',
    viewers: 120,
    isLive: true,
    startTime: new Date().toISOString(),
    category: 'general',
    language: 'es',
    playbackUrl: 'http://livego.store:8080/live/test_mx.flv',
    streamKey: 'test_mx',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: `test_stream_${Date.now()}_pt`,
    hostId: '10755086',
    name: 'Live from Portugal 🇵🇹',
    avatar: 'https://picsum.photos/200/200?random=portugal',
    location: 'Lisbon, Portugal',
    time: 'Live Now',
    message: 'Transmitindo desde Portugal!',
    tags: ['live'],
    isHot: false,
    icon: '',
    country: 'pt',
    viewers: 180,
    isLive: true,
    startTime: new Date().toISOString(),
    category: 'general',
    language: 'pt',
    playbackUrl: 'http://livego.store:8080/live/test_pt.flv',
    streamKey: 'test_pt',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: `test_stream_${Date.now()}_it`,
    hostId: '10755087',
    name: 'Live from Italy 🇮🇹',
    avatar: 'https://picsum.photos/200/200?random=italy',
    location: 'Rome, Italy',
    time: 'Live Now',
    message: 'Trasmettendo dall\'Italia!',
    tags: ['live'],
    isHot: false,
    icon: '',
    country: 'it',
    viewers: 90,
    isLive: true,
    startTime: new Date().toISOString(),
    category: 'general',
    language: 'it',
    playbackUrl: 'http://livego.store:8080/live/test_it.flv',
    streamKey: 'test_it',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function addTestStreams() {
  try {
    await connectDB();
    console.log('🔗 Connected to database');

    // Clear existing test streams
    await Streamer.deleteMany({ id: { $regex: /^test_stream_/ } });
    console.log('🧹 Cleared existing test streams');

    // Add new test streams
    const createdStreams = await Streamer.insertMany(testStreams);
    console.log(`✅ Created ${createdStreams.length} test streams with different countries:`);
    
    createdStreams.forEach(stream => {
      console.log(`   - ${stream.name} (${stream.country.toUpperCase()})`);
    });

    // Test the filtering
    console.log('\n🔍 Testing country filtering:');
    
    const countries = ['ar', 'us', 'mx', 'pt', 'it', 'br'];
    for (const country of countries) {
      const streams = await Streamer.find({ country, isLive: true });
      console.log(`   ${country.toUpperCase()}: ${streams.length} streams`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestStreams();
