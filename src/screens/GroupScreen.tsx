import React, { useState } from 'react';
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CURRENT_USER_NAME, useTripContext } from '../state/TripContext';
import { shareTripInvite } from '../utils/inviteShare';
import { supabase } from '../lib/supabase';
import { TripMember, TripMemberRelation } from '../types/models';

const RELATION_LABEL: Record<TripMemberRelation, string> = {
  family: '가족',
  friend: '친구',
  me: '나',
};

/** 가족과 친구를 구분 없이 초대·관리하는 화면. 6자리 코드 하나로 누구나 같은 여행 공간에 합류한다. */
export function GroupScreen() {
  const { trip, members, setMembers } = useTripContext();
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joining, setJoining] = useState(false);

  const handleShare = () => {
    shareTripInvite(trip).catch(() => {
      Alert.alert('공유 시트를 열지 못했어요');
    });
  };

  const handleJoin = async () => {
    if (joinCode.trim().length !== 6) {
      Alert.alert('6자리 초대 코드를 입력해주세요.');
      return;
    }
    if (!joinName.trim()) {
      Alert.alert('크루에서 사용할 이름(닉네임)을 입력해주세요.');
      return;
    }
    setJoining(true);
    try {
      // 실서비스: Supabase RPC로 family_members에 합류 (가족/친구 구분 없이 동일 로직)
      await supabase.rpc('join_family_by_code', { code: joinCode.trim(), display_name: joinName.trim() });
      Alert.alert('합류 완료 🎉', `${joinName.trim()}님이 여행 크루에 합류했어요.`);
      setJoinCode('');
      setJoinName('');
    } catch (e) {
      // 데모 환경(Supabase 미연결)에서는 로컬 상태에만 반영해 동작을 보여준다.
      const newMember: TripMember = {
        id: `mem-${Date.now()}`,
        tripId: trip.id,
        displayName: joinName.trim(),
        relation: 'friend',
        joinedAt: new Date().toISOString(),
      };
      setMembers((prev) => [...prev, newMember]);
      setJoinCode('');
      setJoinName('');
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={members}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.inviteCard}>
              <Text style={styles.inviteLabel}>여행 크루 초대 코드</Text>
              <Text style={styles.inviteCode}>{trip.inviteCode}</Text>
              <Text style={styles.inviteDesc}>가족이든 친구든 이 코드만 있으면 같은 여행 공간에 합류해요.</Text>
              <Pressable style={styles.shareBtn} onPress={handleShare}>
                <Text style={styles.shareBtnText}>📤 초대 코드 공유하기</Text>
              </Pressable>
            </View>

            <View style={styles.joinCard}>
              <Text style={styles.joinTitle}>코드로 참여하기</Text>
              <TextInput
                style={styles.joinInput}
                placeholder="닉네임 (예: 민지)"
                value={joinName}
                onChangeText={setJoinName}
              />
              <TextInput
                style={styles.joinInput}
                placeholder="6자리 초대 코드"
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />
              <Pressable style={styles.joinBtn} onPress={handleJoin} disabled={joining}>
                <Text style={styles.joinBtnText}>{joining ? '참여 중...' : '참여하기'}</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>크루 멤버 ({members.length}명)</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.displayName.slice(0, 1)}</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {item.displayName}
                {item.displayName === CURRENT_USER_NAME ? ' (나)' : ''}
              </Text>
              <Text style={styles.memberRelation}>{RELATION_LABEL[item.relation]}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBF7F0' },
  listContent: { padding: 16, paddingBottom: 48, gap: 10 },
  headerSection: { gap: 16, marginBottom: 8 },
  inviteCard: { backgroundColor: '#2A2A2E', borderRadius: 20, padding: 18, gap: 6 },
  inviteLabel: { color: '#C7C7CC', fontSize: 12 },
  inviteCode: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: 4 },
  inviteDesc: { color: '#C7C7CC', fontSize: 11, marginBottom: 8 },
  shareBtn: { backgroundColor: '#FF8A5B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  shareBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  joinCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 8 },
  joinTitle: { fontSize: 13, fontWeight: '700', color: '#2A2A2E' },
  joinInput: {
    backgroundColor: '#F3F1EC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  joinBtn: { backgroundColor: '#2A2A2E', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  joinBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#8A8A8E' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDE9DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#C1560B' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '700', color: '#2A2A2E' },
  memberRelation: { fontSize: 11, color: '#8A8A8E' },
});
