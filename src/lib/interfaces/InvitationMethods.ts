export interface InvitationMethods {
  invite(
    request: any,
    email: string,
    redirect: string,
    preset: { [type: string]: any }
  ): Promise<any>
}
