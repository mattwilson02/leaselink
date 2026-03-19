## Input Select

This custom component serves the purpose of capturing two values: an **option** and a **free text**

### Pattern Composition

`Root`: the container of the InputSelect
`Select`: the root of the Select part of the component
`Trigger`: the atom that opens the Select List
`SelectedValue`: the value selected that shows for the Select
`ItemList`: list of the options for the Select
`Item`: an item on the option list
`ItemText`: the text within an Item
`TextControl`: the Input part of the component

### Usage

```
    import { InputSelect } from "@/components/InputSelect"

    <InputSelect.Root>
        <InputSelect.Select value={value} onValueChange={(value) => setValue(value)}>
            <InputSelect.Trigger>
                <InputSelect.SelectedValue placeholder="Select value" />
            </InputSelect.Trigger>
            <InputSelect.ItemList>
            <InputSelect.Item>
                <InputSelect.ItemText>
                    Text
                </InputSelect.ItemText>
            </InputSelect.Item>
            </InputSelect.ItemList>
        </InputSelect.Select>
        <InputSelect.TextControl onTextChange={(text) => setText(text)} />
    </InputSelect.Root>
```
