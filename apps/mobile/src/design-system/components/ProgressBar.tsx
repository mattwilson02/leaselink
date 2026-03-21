/**
 * ProgressBar component to replace @sf-digital-ui/react-native ProgressBar
 */
import { View, Text, StyleSheet } from 'react-native'
import { colors, typography } from '../theme'

interface Stage {
  id: number
  label: string
}

interface ProgressBarProps {
  stages: Stage[]
  currentStage: number
}

export const ProgressBar = ({ stages, currentStage }: ProgressBarProps) => {
  return (
    <View style={styles.container}>
      {stages.map((stage, index) => {
        const isCompleted = stage.id < currentStage
        const isActive = stage.id === currentStage
        const isLast = index === stages.length - 1

        return (
          <View key={stage.id} style={[styles.stageContainer, !isLast && styles.stageContainerGrow]}>
            <View style={styles.stageContent}>
              <View
                style={[
                  styles.dot,
                  isCompleted && styles.dotCompleted,
                  isActive && styles.dotActive,
                ]}
              />
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  isCompleted && styles.labelCompleted,
                ]}
              >
                {stage.label}
              </Text>
            </View>
            {!isLast && (
              <View style={[styles.line, isCompleted && styles.lineCompleted]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageContainerGrow: {
    flex: 1,
  },
  stageContent: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.neutral['30'],
    borderWidth: 2,
    borderColor: colors.neutral['200'],
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.neutral['30'],
    marginHorizontal: 4,
    alignSelf: 'center',
    marginBottom: 16,
  },
  lineCompleted: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.neutral['400'],
  },
  labelActive: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
  },
  labelCompleted: {
    color: colors.primary,
  },
})

export default ProgressBar
