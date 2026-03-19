## Icon

This custom component serves the purpose of displaying an Icon, according to our design system

### Pattern Composition

`Root`: the root of the Icon (if using Background)
`Background`: background overlay used with Icons that are used as the header of a page
`IconContainer`: a rounded container around the Icon
`Icon`: the icon itself

### Props

**IconContainer**:
    `hasBackground`: boolean
    `color`: string

**Icon**:
    `name`: IconName

### Usage (with background)
```
    import { Icon } from "@/components/Icon"

                    <Icon.Root>
						<Icon.Background
							stroke={colors.neutral['40']}
							strokeWidth={1}
							fill='transparent'
							width={340}
							height={190}
						/>

						<Icon.IconContainer hasBackground>
							<Icon.Icon
								name='check-verified-01'
								size={28}
								stroke={colors.neutral['500']}
								strokeWidth={2}
							/>
						</Icon.IconContainer>
					</Icon.Root>
```

### Usage (without background)

```
    import { Icon } from "@/components/Icon"

						<Icon.IconContainer hasBackground={false}>
							<Icon.Icon
								name='check-verified-01'
								size={28}
								stroke={colors.neutral['500']}
								strokeWidth={2}
							/>
						</Icon.IconContainer>
```
