import * as React from "react"
import { cn } from "@/lib/utils"
import { formatPhoneNumberInput } from "@/lib/utils"

export interface PhoneInputProps extends Omit<React.ComponentProps<"input">, 'onChange'> {
  value?: string
  onChange?: (e164Value: string) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    // Convert E.164 format to display format on initial load/value change
    React.useEffect(() => {
      if (value) {
        if (value.startsWith('+1') && value.length === 12) {
          // E.164 format: convert to display format
          const digits = value.slice(2) // Remove +1
          setDisplayValue(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`)
        } else {
          // Already in display format or raw digits
          const { displayValue: formatted } = formatPhoneNumberInput(value)
          setDisplayValue(formatted)
        }
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      const { displayValue, e164Value } = formatPhoneNumberInput(input)
      
      setDisplayValue(displayValue)
      
      // Call onChange with E.164 format when we have a complete number
      if (onChange) {
        onChange(e164Value)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Auto-select text for easier replacement
      e.target.select()
      props.onFocus?.(e)
    }

    return (
      <input
        type="tel"
        className={cn(
          "flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 md:text-sm",
          className
        )}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="(555) 123-4567"
        ref={ref}
        {...props}
      />
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput }