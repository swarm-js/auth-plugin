export interface AuthUserMethods {
  login(email: string, password: string): Promise<any>
}
