"use client"

import * as React from "react"
import { Check, ChevronDown, Slash } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./button"
import { Input } from "./input"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export type ColorPickerOption = {
  label?: string
  value: string
}

export const DEFAULT_COLOR_PICKER_OPTIONS: ColorPickerOption[] = [
  { value: "#000000", label: "黑色" },
  { value: "#595959", label: "深灰" },
  { value: "#8c8c8c", label: "灰色" },
  { value: "#bfbfbf", label: "浅灰" },
  { value: "#f5222d", label: "红色" },
  { value: "#fa541c", label: "橙色" },
  { value: "#fa8c16", label: "橙黄" },
  { value: "#fadb14", label: "黄色" },
  { value: "#52c41a", label: "绿色" },
  { value: "#13c2c2", label: "青色" },
  { value: "#1677ff", label: "蓝色" },
  { value: "#2f54eb", label: "靛蓝" },
  { value: "#722ed1", label: "紫色" },
  { value: "#eb2f96", label: "洋红" },
  { value: "#ffe7ba", label: "浅橙" },
  { value: "#fff1b8", label: "浅黄" },
  { value: "#d9f7be", label: "浅绿" },
  { value: "#b5f5ec", label: "浅青" },
  { value: "#bae0ff", label: "浅蓝" },
  { value: "#d3adf7", label: "浅紫" },
  { value: "#ffd6e7", label: "浅粉" },
  { value: "#ffa39e", label: "粉红" },
  { value: "#ffc069", label: "杏橙" },
  { value: "#ffd666", label: "明黄" },
  { value: "#95de64", label: "草绿" },
  { value: "#5cdbd3", label: "湖蓝" },
  { value: "#69b1ff", label: "天蓝" },
  { value: "#85a5ff", label: "淡蓝" },
  { value: "#b37feb", label: "淡紫" },
  { value: "#ff85c0", label: "粉紫" },
  { value: "#cf1322", label: "暗红" },
  { value: "#d46b08", label: "棕橙" },
  { value: "#ad8b00", label: "赭黄" },
  { value: "#389e0d", label: "松绿" },
  { value: "#08979c", label: "暗青" },
  { value: "#0958d9", label: "深蓝" },
  { value: "#1d39c4", label: "藏蓝" },
  { value: "#531dab", label: "深紫" },
  { value: "#c41d7f", label: "玫红" },
  { value: "#820014", label: "酒红" },
  { value: "#613400", label: "褐色" },
  { value: "#614700", label: "土黄" },
  { value: "#254000", label: "军绿" },
  { value: "#00474f", label: "墨青" },
  { value: "#003a8c", label: "海军蓝" },
  { value: "#10239e", label: "深靛" },
  { value: "#22075e", label: "深邃紫" },
  { value: "#780650", label: "梅紫" },
]

type ColorPickerProps = {
  allowCustomColor?: boolean
  defaultLabel?: string
  disabled?: boolean
  label?: string
  onChange: (value: string | null) => void
  onOpenChange?: (open: boolean) => void
  onTriggerMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void
  open?: boolean
  options?: readonly ColorPickerOption[]
  triggerContent?: React.ReactNode
  triggerIndicatorFallbackColor?: string
  value?: string | null
}

export function ColorPicker(props: ColorPickerProps) {
  const controlled = props.open !== undefined
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [customColor, setCustomColor] = React.useState("#000000")
  const onOpenChange = props.onOpenChange
  const onChange = props.onChange

  const open = controlled ? props.open : internalOpen
  const selectedColor = normalizeColor(props.value)
  const options = props.options ?? DEFAULT_COLOR_PICKER_OPTIONS
  const label = props.label ?? "选择颜色"
  const defaultLabel = props.defaultLabel ?? "默认"
  const allowCustomColor = props.allowCustomColor ?? true

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!controlled) setInternalOpen(nextOpen)
      onOpenChange?.(nextOpen)
    },
    [controlled, onOpenChange],
  )

  React.useEffect(() => {
    if (!selectedColor || !isHexColor(selectedColor)) return
    setCustomColor(selectedColor)
  }, [selectedColor])

  const commitColor = React.useCallback(
    (nextColor: string | null) => {
      onChange(nextColor)
      setOpen(false)
    },
    [onChange, setOpen],
  )

  const triggerActive = Boolean(selectedColor)
  const triggerIndicatorColor = selectedColor ?? props.triggerIndicatorFallbackColor ?? null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={triggerActive ? "secondary" : "ghost"}
          size="sm"
          className="h-8 gap-1 px-1.5"
          disabled={props.disabled}
          aria-label={label}
          onMouseDown={props.onTriggerMouseDown}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            {props.triggerContent ?? <span className="text-base font-medium leading-none">A</span>}
            <span
              className={cn(
                "absolute -bottom-[2px] left-0 right-0 h-[2px] rounded-full",
                !triggerIndicatorColor && "bg-transparent",
              )}
              style={triggerIndicatorColor ? { backgroundColor: triggerIndicatorColor } : undefined}
            />
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[260px] p-3">
        <div className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-muted"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => commitColor(null)}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-input bg-background">
              <Slash className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <span className="flex-1">{defaultLabel}</span>
            {!selectedColor ? <Check className="h-4 w-4" /> : null}
          </button>

          <div className="grid grid-cols-8 gap-2">
            {options.map((option) => {
              const isSelected = selectedColor === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-label={option.label ?? option.value}
                  aria-pressed={isSelected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commitColor(option.value)}
                  className={cn(
                    "relative h-6 w-6 rounded-sm border transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected
                      ? "border-transparent ring-2 ring-ring ring-offset-2 ring-offset-background"
                      : "border-input",
                  )}
                  style={{ backgroundColor: option.value }}
                >
                  {isSelected ? (
                    <Check className={cn("absolute inset-0 m-auto h-3.5 w-3.5", getCheckColor(option.value))} />
                  ) : null}
                </button>
              )
            })}
          </div>

          {allowCustomColor ? (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">自定义</div>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  aria-label="自定义颜色"
                  className="h-9 w-11 cursor-pointer border-input p-1"
                  value={customColor}
                  onMouseDown={(event) => event.preventDefault()}
                  onChange={(event) => {
                    const nextColor = event.target.value
                    setCustomColor(nextColor)
                    commitColor(nextColor)
                  }}
                />
                <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {selectedColor ?? customColor}
                </code>
              </div>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function normalizeColor(value?: string | null) {
  if (!value) return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function isHexColor(value: string) {
  return /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(value)
}

function getCheckColor(hexColor: string) {
  const normalized = hexColor.replace("#", "")
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized

  const red = Number.parseInt(fullHex.slice(0, 2), 16)
  const green = Number.parseInt(fullHex.slice(2, 4), 16)
  const blue = Number.parseInt(fullHex.slice(4, 6), 16)
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000
  return Number.isFinite(luminance) && luminance > 160 ? "text-black/80" : "text-white"
}
