import React from 'react'
import { FeaturePageTemplate } from '@/components/marketing/FeaturePageTemplate'
import { featuresContent } from '@/data/featuresContent'

export default function SchedulingDispatchPage() {
  return <FeaturePageTemplate content={featuresContent['scheduling-dispatch']} />
}
