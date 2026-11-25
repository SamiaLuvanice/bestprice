import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * 0061: aviso neutro enquanto a API não responde (pode ser o servidor iniciando, falta de internet
 * ou erro real). Variante informativa do `Alert` (`role="status"`): anúncio educado, sem interromper.
 * Sem quadro Figma próprio, por decisão da spec.
 */
export function ServerWakingNotice() {
  return <Alert className="server-waking-notice">
    <AlertDescription>
      Não conseguimos falar com o servidor agora. Ele pode estar iniciando; isso leva alguns segundos.
    </AlertDescription>
  </Alert>
}
