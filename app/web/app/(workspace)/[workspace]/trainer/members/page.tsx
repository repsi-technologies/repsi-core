import { redirect } from "next/navigation";

// Superseded by /trainer/clients, which lists only this trainer's assigned clients from the API.
export default async function TrainerMembersPage(props: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await props.params;
  redirect(`/${workspace}/trainer/clients`);
}
