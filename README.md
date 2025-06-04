# demo

## /scripts/utils.js

- buildTree function is a declarative dom tree builder
    - supports 3 item/type definitions:
        - string - simple tag definition
            - defines (previous) element to attach children to (arrays) or define properties of (objects)
            - can be used to define attributes and children (should have space (" ") after tag or ">")
            - if string ends with ">" no closing tag will be added
        - object - properties of a previous element
            - if ":tag" property is defined, creates an element with this tag type (doesn't use the previous tag, previous becomes this element)
            - ":children" tag is defined (and it is an array) => "inline" children definition
            - event handlers are attached with ":onxxx" rule (note ":on") so the function is not resolved
            - attributes can be used like "attr:style": "display: none; color: white"
            - ":before" callback is called when encountered in prop list
            - ":after" callback is called after all props are applied
            - ":after-children" callback is called after all children were added
            - if property value is a function (except for event handlers and callbacks) then value will be first resolved by calling it
            - callbacks and value resolvers use this arguments/format (self, data, parent) => {...}
        - array - children to append to previous element
    - arguments (tree, data, root, options):
        - tree - array of tree creation/definition
            - only mandatory argument
        - data object that can be used for rendering values and/or state management (will be added to root[":data"])
        - root - tag string or element to attach created elements
            - can be attached to dom before call so layout changes can be tracked
            - if not provided div element will be created
        - options - future extendibility, optional
            - ":before" callback
            - ":after" callback
    - returns root element (provided or created)

## /scripts/input-components.js

- number-input - true numeric input

- date-input - date/time picker and input component
    - supports date, time (time-hm short HM), datetime and datetime-tz formats
    - datetime displays value within current time zone
    - datetime-tz stores a value with editors time zone (if changed)

- checkbox-input

- select-native
    - uses "options" as attribute(stringified JSON array)/prop(array)
        - array of tuples ([["a", "value a"], ["b", "value b"]])
        - or array of items ([{ value: "a", label: "value a" }, { value: "b", label: "value b" }])

- select-simple

- select-multi
