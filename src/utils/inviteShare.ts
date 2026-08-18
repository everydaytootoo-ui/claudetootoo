import { Share } from 'react-native';
import { Trip } from '../types/models';

/**
 * 6자리 초대 코드를 카카오톡/문자/메일 등 기기의 공유 시트로 전달한다.
 * 가족뿐 아니라 친구도 이 코드 하나로 동일한 trip(크루) 공간에 합류할 수 있다.
 */
export async function shareTripInvite(trip: Trip): Promise<void> {
  const message = [
    `${trip.name}에 같이 짐싸러 올래? 🧳`,
    `PackWith 초대 코드: ${trip.inviteCode}`,
    `앱에서 "코드로 참여하기"에 입력하면 바로 합류할 수 있어!`,
  ].join('\n');

  await Share.share({
    message,
    title: `${trip.name} 초대`,
  });
}
