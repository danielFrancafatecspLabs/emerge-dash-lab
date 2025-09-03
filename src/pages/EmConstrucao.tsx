import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface EmConstrucaoProps {
  titulo: string
  descricao: string
}

const EmConstrucao = ({ titulo, descricao }: EmConstrucaoProps) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-lab-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Construction className="w-8 h-8 text-lab-primary" />
          </div>
          <CardTitle className="text-xl">{titulo}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {descricao}
          </p>
          <p className="text-sm text-muted-foreground">
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
          </p>
          <Button 
            onClick={() => navigate("/")}
            className="bg-lab-primary hover:bg-lab-primary-dark text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default EmConstrucao