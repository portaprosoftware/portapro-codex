import React from 'react'
import { FeaturePageTemplate } from '@/components/marketing/FeaturePageTemplate'
import { featuresContent } from '@/data/featuresContent'

export default function AIScanningPage() {
  return <FeaturePageTemplate content={featuresContent['ai-scanning']} />
}
