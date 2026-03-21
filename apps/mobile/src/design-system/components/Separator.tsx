import { StyleSheet, View, type ViewStyle } from 'react-native'
import { colors } from '../theme'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  style?: ViewStyle
}

export const Separator = ({ orientation = 'horizontal', style }: SeparatorProps) => {
  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
    backgroundColor: colors.border,
  },
  vertical: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
})

export default Separator
