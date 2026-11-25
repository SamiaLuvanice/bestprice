import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * 0061: aviso neutro enquanto a API não responde (pode ser o servidor iniciando, falta de internet
 * ou erro real). Visual do `Alert` informativo, sem quadro Figma próprio, por decisão da spec.
 *
 * O aviso não é uma região viva própria (revisão R1, I2): `role={undefined}` desliga o `status`
 * padrão do `Alert`. Quem o mostra o coloca dentro de um contêiner `role="status"` que já existia
 * antes, para o leitor de tela anunciar a troca de texto.
 */
export function ServerWakingNotice() {
  return <Alert role={undefined} className="server-waking-notice">
    <AlertDescription>
      Não conseguimos falar com o servidor agora. Ele pode estar iniciando; isso leva alguns segundos.
    </AlertDescription>
  </Alert>
}
