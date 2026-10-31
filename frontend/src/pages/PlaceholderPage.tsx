import { PageContainer } from '../components/layout/PageContainer'
import { Card, CardHeader, CardTitle } from '../components/ui/card'
import { StatePanel } from '../components/ui/StatePanel'

type PlaceholderPageProps = { title: string; description: string }

/** Honest integration state for modules without a connected API; no dead create/search controls. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <PageContainer title={title} description={description}>
      <Card>
        <CardHeader className="border-b border-slate-100"><CardTitle>{title} workspace</CardTitle><p className="text-sm text-slate-500">This module is not connected to a backend yet.</p></CardHeader>
        <StatePanel kind="empty" title={`${title} data is not available`} description="No records or actions are shown until the corresponding API and access rules are ready." />
      </Card>
    </PageContainer>
  )
}
