import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { colors, typography, borderRadius, shadows } from '../theme'

export interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  options: SelectOption[]
  value?: string | null
  onValueChange?: (value: string) => void
  placeholder?: string
  style?: ViewStyle
  disabled?: boolean
  testID?: string
}

export const Select = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  style,
  disabled,
  testID,
}: SelectProps) => {
  const [open, setOpen] = useState(false)

  const selectedLabel = options.find((o) => o.value === value)?.label

  return (
    <>
      <Pressable
        testID={testID}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.trigger, disabled && styles.disabled, style]}
      >
        <Text style={[styles.triggerText, !selectedLabel && styles.placeholder]}>
          {selectedLabel ?? placeholder}
        </Text>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType='fade' onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            <ScrollView>
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.option,
                    opt.value === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onValueChange?.(opt.value)
                    setOpen(false)
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      opt.value === value && styles.optionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  triggerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.foreground,
    flex: 1,
  },
  placeholder: {
    color: colors.mutedForeground,
  },
  disabled: {
    opacity: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
    ...shadows.md,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionSelected: {
    backgroundColor: colors.accent,
  },
  optionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.foreground,
  },
  optionTextSelected: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
  },
})

export default Select
