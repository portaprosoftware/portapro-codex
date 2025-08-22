import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface NumberInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange" | "size"> {
  value?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  showControls?: boolean
  size?: "sm" | "default" | "lg"
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    className, 
    value, 
    onChange, 
    min, 
    max, 
    step = 1, 
    showControls = true,
    size = "default",
    disabled,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value?.toString() || "")

    React.useEffect(() => {
      setDisplayValue(value?.toString() || "")
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      setDisplayValue(inputValue)
      
      if (inputValue === "") {
        onChange?.(0)
        return
      }

      const numValue = parseFloat(inputValue)
      if (!isNaN(numValue)) {
        const clampedValue = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, numValue))
        onChange?.(clampedValue)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Auto-select all text on focus for easy replacement
      e.target.select()
      props.onFocus?.(e)
    }

    const handleIncrement = () => {
      const currentValue = value || 0
      const newValue = currentValue + step
      const clampedValue = max !== undefined ? Math.min(newValue, max) : newValue
      onChange?.(clampedValue)
    }

    const handleDecrement = () => {
      const currentValue = value || 0
      const newValue = currentValue - step
      const clampedValue = min !== undefined ? Math.max(newValue, min) : newValue
      onChange?.(clampedValue)
    }

    const sizeClasses = {
      sm: "h-8 text-sm",
      default: "h-10 text-lg font-medium",
      lg: "h-12 text-xl font-medium"
    }

    const controlSizeClasses = {
      sm: "w-6 h-4 p-0",
      default: "w-8 h-6 p-0", 
      lg: "w-10 h-8 p-0"
    }

    if (!showControls) {
      return (
        <input
          type="number"
          className={cn(
            "flex w-full rounded-xl border border-input bg-background px-4 py-3 text-center ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            sizeClasses[size],
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          {...props}
        />
      )
    }

    return (
      <div className="space-y-1">
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className={cn(controlSizeClasses[size])}
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && (value || 0) >= max)}
            type="button"
            aria-label="Increase value"
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
        </div>
        <input
          type="number"
          className={cn(
            "flex w-full rounded-xl border border-input bg-background px-4 py-3 text-center ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            sizeClasses[size],
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          {...props}
        />
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className={cn(controlSizeClasses[size])}
            onClick={handleDecrement}
            disabled={disabled || (min !== undefined && (value || 0) <= min)}
            type="button"
            aria-label="Decrease value"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }
)

NumberInput.displayName = "NumberInput"

export { NumberInput }