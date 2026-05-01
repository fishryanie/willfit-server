import swaggerAutogen from 'swagger-autogen'
import path from 'path'

const __dirname = path.resolve()

const outputFile = path.join(__dirname, 'swagger.json')
const routes = [path.join(__dirname, 'src/api/router.ts'), path.join(__dirname, 'src/modules/**/*.ts')]

const doc = {
  info: {
    title: 'Welcome to WillFit API',
    description: 'API documentation',
    version: '1.0.0'
  },
  servers: [{ url: `http://localhost:${process.env.PORT || '3000'}` }],
  tags: [
    { name: 'Auth', description: 'Endpoints liên quan đến Auth' },
    { name: 'Chat', description: 'Endpoints liên quan đến Chat' },
    { name: 'Client', description: 'Endpoints liên quan đến Client' },
    { name: 'Trainer', description: 'Endpoints liên quan đến Trainer' },
    { name: 'Organization', description: 'Endpoints liên quan đến Organization' },
    { name: 'Notifications', description: 'Endpoints liên quan đến Notifications' },
    { name: 'Common', description: 'Endpoints liên quan đến Common' }
  ]
}

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc)
