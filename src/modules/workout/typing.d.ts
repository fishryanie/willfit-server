interface IExerciseOfWorkoutSession {
  sets: number
  reps: number
  exercise: import('mongoose').Types.ObjectId
  equipment: import('mongoose').Types.ObjectId
  schedule: import('mongoose').Types.ObjectId[]
}

interface IWorkoutSession extends IDefinitionCommon {
  client: import('mongoose').Types.ObjectId
  exercises: IExerciseOfWorkoutSession[]
}

interface IExercise extends IDefinitionCommon {
  goal: import('mongoose').Types.ObjectId
  level: import('mongoose').Types.ObjectId
  muscle: import('mongoose').Types.ObjectId
  category: import('mongoose').Types.ObjectId
  equipment: import('mongoose').Types.ObjectId
}
