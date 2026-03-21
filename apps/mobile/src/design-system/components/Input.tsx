import { forwardRef, useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { colors, typography, borderRadius } from '../theme'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  helperText?: string
  containerStyle?: ViewStyle
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helperText, containerStyle, style, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            !!error && styles.inputError,
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    )
  },
)

Input.displayName = 'Input'

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.fontWeight.medium,
    fontSize: typography.fontSize.sm,
    color: colors.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  inputFocused: {
    borderColor: colors.ring,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.destructive,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.destructive,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.mutedForeground,
  },
})

export default Input
