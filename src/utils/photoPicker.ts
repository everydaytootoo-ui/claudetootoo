import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * "실물 사진 첨부" 공통 흐름. 카메라로 즉석 촬영하거나 앨범에서 고를 수 있게 하고,
 * 선택/촬영된 로컬 uri를 반환한다 (취소 시 null).
 * 실제 서비스에서는 이 uri를 Supabase Storage에 업로드한 뒤 반환된 public/signed URL로 교체한다.
 */
export function pickItemPhoto(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.alert('사진 첨부', '어떻게 첨부할까요?', [
      { text: '취소', style: 'cancel', onPress: () => resolve(null) },
      {
        text: '📷 사진 촬영',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            resolve(null);
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
          });
          resolve(!result.canceled && result.assets[0] ? result.assets[0].uri : null);
        },
      },
      {
        text: '🖼 앨범에서 선택',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            resolve(null);
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [1, 1],
          });
          resolve(!result.canceled && result.assets[0] ? result.assets[0].uri : null);
        },
      },
    ]);
  });
}
