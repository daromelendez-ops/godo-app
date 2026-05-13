import { View, Text, StyleSheet, Pressable, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const BASE = 'https://storage.googleapis.com/msgsndr/sxFrugNVp2enL9pfGarC/media';

const MOCK_INBOX = [
  {
    id: '1',
    eventName: 'Wine Night 🍷',
    personName: '@MingleSpark',
    avatar: `${BASE}/6923e760460a6155f2c5c982.png`,
    lastMessage: "Can't wait to see everyone tonight!",
    time: '2m ago',
    unread: true,
  },
  {
    id: '2',
    eventName: 'Brush & Chill 🎨',
    personName: '@HappyHabit',
    avatar: `${BASE}/6923e760c7f3f5cf03d4abbf.png`,
    lastMessage: 'Bring your own brushes if you have them',
    time: '1h ago',
    unread: true,
  },
  {
    id: '3',
    eventName: 'Coffee Vibes ☕',
    personName: '@LaughingLatte',
    avatar: `${BASE}/6923de3c460a615f52c4ae6c.png`,
    lastMessage: 'We\'ll be at the corner table near the window',
    time: 'Yesterday',
    unread: false,
  },
];

interface Convo {
  id: string;
  eventName: string;
  personName: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
}

function ConvoRow({ item }: { item: Convo }) {
  return (
    <Pressable style={s.row}>
      <View style={s.avatarWrap}>
        <Image source={{ uri: item.avatar }} style={s.avatar} />
        {item.unread && <View style={s.badge} />}
      </View>
      <View style={s.rowBody}>
        <View style={s.rowTop}>
          <Text style={s.eventName} numberOfLines={1}>{item.eventName}</Text>
          <Text style={s.time}>{item.time}</Text>
        </View>
        <Text style={s.personName}>{item.personName}</Text>
        <Text
          style={[s.lastMsg, item.unread && s.lastMsgUnread]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </Pressable>
  );
}

export default function InboxScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Inbox</Text>
      </View>
      <FlatList
        data={MOCK_INBOX}
        keyExtractor={(i: Convo) => i.id}
        renderItem={({ item }: { item: Convo }) => <ConvoRow item={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={s.sep} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>💬</Text>
            <Text style={s.emptyTitle}>No messages yet</Text>
            <Text style={s.emptySub}>
              Join an event to get access to the group chat.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  list: { padding: 16, gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sep: { height: 10 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  personName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  lastMsg: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textLight,
  },
  lastMsgUnread: {
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  empty: { marginTop: 80, alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
});
