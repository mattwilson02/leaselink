/**
 * Select compound to replace @sf-digital-ui/react-native Select.*
 */
import { createContext, useContext, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { colors, typography, borderRadius, shadows } from '../theme'

interface SelectContextType {
  value: string | null | undefined
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = createContext<SelectContextType>({
  value: null,
  open: false,
  setOpen: () => {},
})

export interface SelectRootProps {
  value?: string | null
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  defaultValue?: string
}

const SelectRoot = ({ value, onValueChange, children }: SelectRootProps) => {
  const [open, setOpen] = useState(false)
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <View>{children}</View>
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
  onTouchEnd?: (e: any) => void
  onTouchStart?: (e: any) => void
}

const SelectTrigger = ({ children, style, testID, onTouchEnd, onTouchStart }: SelectTriggerProps) => {
  const { setOpen } = useContext(SelectContext)
  return (
    <Pressable
      testID={testID}
      onPress={() => setOpen(true)}
      style={[styles.trigger, style as ViewStyle]}
      onTouchEnd={onTouchEnd}
      onTouchStart={onTouchStart}
    >
      {children}
    </Pressable>
  )
}

export interface SelectContentProps {
  children?: React.ReactNode
}

const SelectContent = ({ children }: SelectContentProps) => {
  const { open, setOpen } = useContext(SelectContext)
  return (
    <Modal visible={open} transparent animationType='fade' onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
        <View style={styles.content}>
          {children}
        </View>
      </Pressable>
    </Modal>
  )
}

export interface SelectViewportProps {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
  onTouchStart?: (e: any) => void
  onTouchEnd?: (e: any) => void
}

const SelectViewport = ({ children, testID, onTouchStart, onTouchEnd }: SelectViewportProps) => {
  return (
    <ScrollView testID={testID} style={styles.viewport} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </ScrollView>
  )
}

export interface SelectItemProps {
  value: string
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}

const SelectItem = ({ value, children, style, testID }: SelectItemProps) => {
  const { onValueChange, setOpen, value: selectedValue } = useContext(SelectContext)
  const isSelected = selectedValue === value

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        onValueChange?.(value)
        setOpen(false)
      }}
      style={[styles.item, isSelected && styles.itemSelected, style as ViewStyle]}
    >
      {children}
    </Pressable>
  )
}

export interface SelectItemTextProps {
  children?: React.ReactNode
  style?: TextStyle
}

const SelectItemText = ({ children, style }: SelectItemTextProps) => {
  return <Text style={[styles.itemText, style]}>{children}</Text>
}

export interface SelectValueProps {
  placeholder?: string
  children?: React.ReactNode
  testID?: string
}

const SelectValue = ({ placeholder, children }: SelectValueProps) => {
  const { value } = useContext(SelectContext)
  return (
    <Text style={styles.valueText}>
      {value || children || placeholder}
    </Text>
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
    backgroundColor: colors.background,
    minHeight: 44,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  viewport: {
    maxHeight: 300,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemSelected: {
    backgroundColor: colors.accent,
  },
  itemText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.foreground,
  },
  valueText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.foreground,
    flex: 1,
  },
})

export const SelectCompound = {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Viewport: SelectViewport,
  Item: SelectItem,
  ItemText: SelectItemText,
  Value: SelectValue,
}

export default SelectCompound
