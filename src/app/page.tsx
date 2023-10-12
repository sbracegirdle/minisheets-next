import { redirect } from "next/navigation";

export default function Home() {
  // Generate random id
  const id = Math.random().toString(36).substring(2);

  redirect("/sheet/" + id);
}
