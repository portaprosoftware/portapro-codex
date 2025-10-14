import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle } from 'lucide-react'

const leadFormSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  phone: z.string()
    .trim()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .max(20, { message: 'Phone number must be less than 20 characters' })
    .regex(/^[0-9+\s()-]+$/, { message: 'Invalid phone number format' }),
  company: z.string()
    .trim()
    .min(2, { message: 'Company name must be at least 2 characters' })
    .max(150, { message: 'Company name must be less than 150 characters' }),
  email: z.string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  fleetSize: z.enum(['1-5', '6-15', '16-30', '31-50', '50+'], {
    required_error: 'Please select your fleet size'
  }),
  source: z.string().optional()
})

type LeadFormData = z.infer<typeof leadFormSchema>

interface LeadFormProps {
  source?: string
  onSuccess?: () => void
}

export const LeadForm: React.FC<LeadFormProps> = ({ source = 'feature-page', onSuccess }) => {
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      source
    }
  })
  
  const fleetSize = watch('fleetSize')
  
  const submitLead = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const { error } = await supabase
        .from('leads')
        .insert([{
          name: data.name,
          phone: data.phone,
          company: data.company,
          email: data.email,
          fleet_size: data.fleetSize,
          source: data.source || source,
          status: 'new'
        }])
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setSubmitted(true)
      toast({
        title: 'Thank you!',
        description: "We'll be in touch shortly to schedule your demo.",
      })
      if (onSuccess) onSuccess()
    },
    onError: (error) => {
      toast({
        title: 'Submission failed',
        description: 'Please try again or contact support@portapro.com',
        variant: 'destructive'
      })
      console.error('Lead submission error:', error)
    }
  })
  
  const onSubmit = (data: LeadFormData) => {
    submitLead.mutate(data)
  }
  
  if (submitted) {
    return (
      <Card className="bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle className="h-12 w-12 text-primary" />
            <div>
              <h3 className="mb-1 text-lg font-semibold">Thank You!</h3>
              <p className="text-sm text-muted-foreground">
                We've received your information and will contact you within 24 hours to schedule your personalized demo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>See PortaPro in Action</CardTitle>
        <CardDescription>
          Schedule a personalized demo and discover how PortaPro can transform your operations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Smith"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@company.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('phone')}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              placeholder="ABC Portable Services"
              {...register('company')}
              className={errors.company ? 'border-destructive' : ''}
            />
            {errors.company && (
              <p className="text-sm text-destructive">{errors.company.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="fleetSize">Fleet Size *</Label>
            <Select
              value={fleetSize}
              onValueChange={(value) => setValue('fleetSize', value as LeadFormData['fleetSize'])}
            >
              <SelectTrigger className={errors.fleetSize ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select fleet size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1-5 vehicles</SelectItem>
                <SelectItem value="6-15">6-15 vehicles</SelectItem>
                <SelectItem value="16-30">16-30 vehicles</SelectItem>
                <SelectItem value="31-50">31-50 vehicles</SelectItem>
                <SelectItem value="50+">50+ vehicles</SelectItem>
              </SelectContent>
            </Select>
            {errors.fleetSize && (
              <p className="text-sm text-destructive">{errors.fleetSize.message}</p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={submitLead.isPending}
          >
            {submitLead.isPending ? 'Submitting...' : 'Request Demo'}
          </Button>
          
          <p className="text-center text-xs text-muted-foreground">
            By submitting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
