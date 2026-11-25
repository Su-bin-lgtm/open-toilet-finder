import { Linking, Platform } from 'react-native'

export async function openDirections(latitude: number, longitude: number, label: string) {
  const encodedLabel = encodeURIComponent(label)
  const url = Platform.OS === 'ios'
    ? `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodedLabel}`
    : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`
  await Linking.openURL(url)
}
