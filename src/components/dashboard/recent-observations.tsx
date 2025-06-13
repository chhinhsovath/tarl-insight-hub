import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Observation {
  id: string
  school: {
    name: string
  }
  observer: {
    name: string
    image?: string
  }
  createdAt: string
  status: string
}

interface RecentObservationsProps {
  observations: Observation[]
}

export function RecentObservations({ observations }: RecentObservationsProps) {
  return (
    <div className="space-y-8">
      {observations.map((observation) => (
        <div key={observation.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={observation.observer.image} alt={observation.observer.name} />
            <AvatarFallback>
              {observation.observer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {observation.school.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {observation.observer.name}
            </p>
          </div>
          <div className="ml-auto font-medium">
            {new Date(observation.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  )
} 