const BASE = 'https://storage.googleapis.com/msgsndr/sxFrugNVp2enL9pfGarC/media';

export type FeedCardType = 'upcoming' | 'recap';

export interface FeedEvent {
  id: string;
  type: FeedCardType;
  username: string;
  avatarUrl: string;
  mediaUrl: string;
  eventTitle: string;
  caption: string;
  timeLabel: string;
  neighborhood?: string;
  date?: string;
  time?: string;
  attending?: number;
  capacity?: number;
  spotsLeft?: number;
  price?: string | null;
  host?: {
    name: string;
    avatarUrl: string;
    memberSince: string;
  };
  description?: string;
  address?: string;
  category?: string;
  emoji?: string;
}

export const MOCK_EVENTS: FeedEvent[] = [
  {
    id: '1',
    type: 'upcoming',
    username: '@MingleSpark',
    avatarUrl: `${BASE}/6923e760460a6155f2c5c982.png`,
    mediaUrl: `${BASE}/6923e595a470b3044fe0ba57.png`,
    eventTitle: 'Wine Night 🍷',
    caption: 'Nothing beats a Friday wine night 🍷✨ #newfriends',
    timeLabel: 'Tonight at 7 PM',
    neighborhood: 'Downtown',
    date: 'Friday, May 16',
    time: '7:00 PM',
    attending: 4,
    capacity: 6,
    spotsLeft: 2,
    price: 'Free',
    category: 'Social',
    emoji: '🍷',
    description:
      'Join us for a relaxed evening of wine, good vibes, and great conversation. We\'ll taste a curated selection of reds and whites, learn a few fun wine facts, and enjoy a cozy atmosphere perfect for meeting new people or bringing friends.',
    address: '123 King St W, Downtown',
    host: {
      name: '@MingleSpark',
      avatarUrl: `${BASE}/6923e760460a6155f2c5c982.png`,
      memberSince: '2024',
    },
  },
  {
    id: '2',
    type: 'recap',
    username: '@SoulSync',
    avatarUrl: `${BASE}/6923e760460a61e135c5c97f.png`,
    mediaUrl: `${BASE}/6923e595460a61be06c59a4d.png`,
    eventTitle: 'Morning Yoga Flow',
    caption: 'Starting the week calm 🙏💫 #selfcare',
    timeLabel: '1d ago',
    category: 'Wellness',
    emoji: '🧘',
    description: 'A gentle morning yoga session to reset and recharge.',
    host: {
      name: '@SoulSync',
      avatarUrl: `${BASE}/6923e760460a61e135c5c97f.png`,
      memberSince: '2023',
    },
  },
  {
    id: '3',
    type: 'upcoming',
    username: '@HappyHabit',
    avatarUrl: `${BASE}/6923e760c7f3f5cf03d4abbf.png`,
    mediaUrl: `${BASE}/6923e8dfc7f3f5c74dd4df4d.png`,
    eventTitle: 'Brush & Chill 🎨',
    caption: 'Brush & Chill this Saturday! 🎨 Spots going fast',
    timeLabel: 'This Weekend',
    neighborhood: 'Arts District',
    date: 'Saturday, May 17',
    time: '3:00 PM',
    attending: 5,
    capacity: 6,
    spotsLeft: 1,
    price: 'Free',
    category: 'Arts',
    emoji: '🎨',
    description:
      'A chill painting session where you bring your creativity and we provide the supplies. No experience needed — just good vibes and a willingness to get your hands colorful.',
    address: '456 Queen St E, Arts District',
    host: {
      name: '@HappyHabit',
      avatarUrl: `${BASE}/6923e760c7f3f5cf03d4abbf.png`,
      memberSince: '2024',
    },
  },
  {
    id: '4',
    type: 'recap',
    username: '@BoardGameBoss',
    avatarUrl: `${BASE}/6923de2fa470b36bdfdfd088.png`,
    mediaUrl: `${BASE}/6923e8df460a61b463c5f3dd.png`,
    eventTitle: 'Board Game Jam',
    caption: "Didn't win but laughed until my sides hurt 🎲😂",
    timeLabel: '2d ago',
    category: 'Games',
    emoji: '🎲',
    host: {
      name: '@BoardGameBoss',
      avatarUrl: `${BASE}/6923de2fa470b36bdfdfd088.png`,
      memberSince: '2023',
    },
    description: 'Catan, Carcassonne, and Codenames — all in one night.',
  },
  {
    id: '5',
    type: 'upcoming',
    username: '@LaughingLatte',
    avatarUrl: `${BASE}/6923de3c460a615f52c4ae6c.png`,
    mediaUrl: `${BASE}/6923e8e1a470b3e342e11147.png`,
    eventTitle: 'Coffee Vibes ☕',
    caption: 'Coffee vibes this Sunday ☕✨ Meet new friends!',
    timeLabel: 'This Weekend',
    neighborhood: 'Midtown',
    date: 'Sunday, May 18',
    time: '10:00 AM',
    attending: 3,
    capacity: 6,
    spotsLeft: 3,
    price: 'Free',
    category: 'Social',
    emoji: '☕',
    description:
      'Come grab a coffee and meet some cool people in the neighborhood. No agenda, just good conversation and great coffee.',
    address: '789 Yonge St, Midtown',
    host: {
      name: '@LaughingLatte',
      avatarUrl: `${BASE}/6923de3c460a615f52c4ae6c.png`,
      memberSince: '2024',
    },
  },
  {
    id: '6',
    type: 'upcoming',
    username: '@LaughingLatte',
    avatarUrl: `${BASE}/6923de3c460a615f52c4ae6c.png`,
    mediaUrl: `${BASE}/6923e595a470b3044fe0ba57.png`,
    eventTitle: "Chef's Table Secrets 🍝",
    caption: "Chef's Table Secrets 🍝 Only 12 seats – $25",
    timeLabel: 'Next Week',
    neighborhood: 'Little Italy',
    date: 'Wednesday, May 21',
    time: '6:30 PM',
    attending: 10,
    capacity: 12,
    spotsLeft: 2,
    price: '$25',
    category: 'Food & Drink',
    emoji: '🍝',
    description:
      "A private dinner experience where a local chef walks you through the secrets behind three iconic Italian dishes. You'll cook, learn, and eat — all in an intimate setting.",
    address: '101 College St, Little Italy',
    host: {
      name: '@LaughingLatte',
      avatarUrl: `${BASE}/6923de3c460a615f52c4ae6c.png`,
      memberSince: '2024',
    },
  },
  {
    id: '7',
    type: 'recap',
    username: '@UrbanExplorer',
    avatarUrl: `${BASE}/6923e760460a61362bc5c980.png`,
    mediaUrl: `${BASE}/6923e7602e932b0c9c969020.png`,
    eventTitle: 'Sunday Hike',
    caption: 'Fresh air, new trails, good company 🏞️',
    timeLabel: '3d ago',
    category: 'Outdoors',
    emoji: '🏞️',
    host: {
      name: '@UrbanExplorer',
      avatarUrl: `${BASE}/6923e760460a61362bc5c980.png`,
      memberSince: '2023',
    },
    description: 'A relaxed Sunday morning hike through the ravine trails.',
  },
  {
    id: '8',
    type: 'upcoming',
    username: '@FunWithJamie',
    avatarUrl: `${BASE}/6924236c2a792758373a8c45.png`,
    mediaUrl: `${BASE}/6923e8dfc7f3f5c74dd4df4d.png`,
    eventTitle: 'Bowling Crew Night 🎳',
    caption: 'Bowling Night this Thursday 🎳🔥 laid-back, easy fun!',
    timeLabel: 'Thursday 8 PM',
    neighborhood: 'Westside',
    date: 'Thursday, May 22',
    time: '8:00 PM',
    attending: 4,
    capacity: 6,
    spotsLeft: 2,
    price: 'Free',
    category: 'Games',
    emoji: '🎳',
    description:
      "Easy going bowling night — doesn't matter if you're good or not. Just show up, have fun, and meet some cool people.",
    address: '234 Bloor St W, Westside',
    host: {
      name: '@FunWithJamie',
      avatarUrl: `${BASE}/6924236c2a792758373a8c45.png`,
      memberSince: '2024',
    },
  },
  {
    id: '9',
    type: 'recap',
    username: '@BoldBeat',
    avatarUrl: `${BASE}/6923e760c7f3f55319d4abbe.png`,
    mediaUrl: `${BASE}/6923e8d92e932b324196bbdd.png`,
    eventTitle: 'Stories by the Fire 🔥',
    caption: 'Campfire stories, warm vibes, and easy company. The perfect night!',
    timeLabel: '3d ago',
    category: 'Social',
    emoji: '🔥',
    host: {
      name: '@BoldBeat',
      avatarUrl: `${BASE}/6923e760c7f3f55319d4abbe.png`,
      memberSince: '2023',
    },
    description: 'A cozy evening around the fire with stories and s\'mores.',
  },
  {
    id: '10',
    type: 'upcoming',
    username: '@AdventureLaura',
    avatarUrl: `${BASE}/6923de3c2e932bd12c957f39.png`,
    mediaUrl: `${BASE}/6923e8dfc7f3f54405d4df4e.png`,
    eventTitle: 'Biking the Waterfront 🚴',
    caption: 'Easy ride along the waterfront this Saturday 🚴🌊 Bring a friend!',
    timeLabel: 'Next Week',
    neighborhood: 'Waterfront',
    date: 'Saturday, May 24',
    time: '9:00 AM',
    attending: 2,
    capacity: 6,
    spotsLeft: 4,
    price: 'Free',
    category: 'Outdoors',
    emoji: '🚴',
    description:
      'A casual bike ride along the waterfront trail. Easy pace, great views, and good company. Bring your own bike!',
    address: 'Waterfront Trail, Queens Quay',
    host: {
      name: '@AdventureLaura',
      avatarUrl: `${BASE}/6923de3c2e932bd12c957f39.png`,
      memberSince: '2024',
    },
  },
];

export const MAP_THUMBNAIL = `${BASE}/692bd89682f4c548c5143502.png`;
