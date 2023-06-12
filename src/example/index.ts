import { Swarm } from '@swarmjs/core'
import { AuthPlugin, AuthPluginOptions } from '../'
import mongoose, { ConnectOptions } from 'mongoose'
import { MongooseAuthPlugin } from '../'

// 1. Create an interface representing a document in MongoDB.
interface IUser {
  firstname?: string
  lastname?: string
  email?: string
  avatar?: string
}

// 2. Create a Schema corresponding to the document interface.
const userSchema = new mongoose.Schema<IUser>({
  firstname: String,
  lastname: String,
  email: String,
  avatar: String
})

userSchema.plugin(MongooseAuthPlugin, {
  password: true,
  fido2: true,
  facebook: true,
  google: true,
  googleAuthenticator: true,
  ethereum: true
})

// 3. Create a Model.
const User = mongoose.model<IUser>('User', userSchema)

const app = new Swarm({
  logLevel: 'info',
  title: 'My API',
  description: 'A super API made with SwarmJS'
})

app.use(AuthPlugin, {
  password: true,
  fido2: true,
  facebook: true,
  google: true,
  googleAuthenticator: true,
  ethereum: true,
  model: User,
  rpId: 'localhost',
  rpName: 'SwarmJS Auth plugin test app',
  origin: 'localhost:8080',
  logo: 'https://www.gitbook.com/cdn-cgi/image/width=40,dpr=2,height=40,fit=contain,format=auto/https%3A%2F%2F3423608392-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FeEVq5YDGaSKNtIJG7WcF%252Ficon%252F4XDY5BBrhcqwMH6XFO06%252Flogo.png%3Falt%3Dmedia%26token%3D017a73c1-adc8-48d7-8807-bf496703eb6a'
} as AuthPluginOptions)

async function main () {
  mongoose.connect(process.env.MONGO_DSN ?? 'mongodb://localhost:27017/test', {
    useNewUrlParser: true
  } as ConnectOptions)
  await app.listen(8080)
}
main()
