import ProjectEditor from '../_components/ProjectEditor'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProjectEditor id={id} />
}
