import { redirect } from 'next/navigation'

// Endereço antigo da tela de transição pós-login: hoje o login leva direto ao feed.
export default function BemVindoPage() {
  redirect('/comunidade')
}
