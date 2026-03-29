import BuilderClient from "../BuilderClient";

export default async function EditBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BuilderClient kitId={id} />;
}
