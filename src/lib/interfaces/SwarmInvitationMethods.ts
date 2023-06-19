export interface SwarmInvitationMethods {
  invite(
    email: string,
    redirect: string,
    preset: { [type: string]: any }
  ): Promise<boolean>
}
