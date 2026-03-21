/**
 * Tabs compound to replace @sf-digital-ui/react-native Tabs.*
 */
import { createContext, useContext, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { colors, typography, borderRadius } from '../theme'

interface TabsContextType {
  value: string
  onValueChange?: (value: string) => void
}

const TabsContext = createContext<TabsContextType>({ value: '' })

export interface TabsRootProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  style?: ViewStyle
  variant?: 'panel' | 'underline'
  color?: string
  testID?: string
}

const TabsRoot = ({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  children,
  style,
  testID,
}: TabsRootProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = controlledValue ?? internalValue

  const handleChange = (v: string) => {
    if (!controlledValue) setInternalValue(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <View style={style} testID={testID}>
        {children}
      </View>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children?: React.ReactNode
  style?: ViewStyle
}

const TabsList = ({ children, style }: TabsListProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.list, style]}
    >
      {children}
    </ScrollView>
  )
}

export interface TabsTriggerProps {
  value: string
  children?: React.ReactNode
  style?: ViewStyle
  testID?: string
}

const TabsTrigger = ({ value, children, style, testID }: TabsTriggerProps) => {
  const { value: selected, onValueChange } = useContext(TabsContext)
  const isSelected = selected === value

  return (
    <Pressable
      testID={testID}
      onPress={() => onValueChange?.(value)}
      style={[styles.trigger, isSelected && styles.triggerSelected, style]}
    >
      {children}
    </Pressable>
  )
}

export interface TabsTriggerTextProps {
  children?: React.ReactNode
  style?: TextStyle
}

const TabsTriggerText = ({ children, style }: TabsTriggerTextProps) => {
  return <Text style={[styles.triggerText, style]}>{children}</Text>
}

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.md,
    padding: 4,
    gap: 4,
  },
  trigger: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerSelected: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  triggerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
})

export const TabsCompound = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  TriggerText: TabsTriggerText,
}

export default TabsCompound
