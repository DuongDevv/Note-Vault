---
name: prefer-shadcn-components
description: "Enforce using shadcn UI components (such as Button) instead of raw native HTML elements in React components"
astCondition: "<button $$$PROPS>$$$CHILDREN</button>"
scope: ["tool:edit(*.tsx)", "tool:write(*.tsx)"]
---

Do not use native `<button>` elements directly. Use the project's shadcn UI components instead (e.g. `import { Button } from '@/components/ui/button'`). Check shadcn UI first for available components (Button, Input, Textarea, Select, Popover, etc.). Only fallback to native HTML elements if shadcn UI lacks a matching component or primitive.
